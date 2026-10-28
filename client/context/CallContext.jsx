import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { rtcConfig } from "../src/lib/webrtc";
import toast from "react-hot-toast";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { socket, authUser } = useContext(AuthContext);

    // Call status: "idle" | "calling" | "incoming" | "connected"
    const [callStatus, setCallStatus] = useState("idle");
    const [callType, setCallType] = useState("audio"); // "audio" | "video"
    const [remoteUser, setRemoteUser] = useState(null); // { _id, fullName, profilePic }
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [screenBlurred, setScreenBlurred] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);
    const incomingCallDataRef = useRef(null);

    // Track state in refs for socket events
    const callStatusRef = useRef(callStatus);
    const remoteUserRef = useRef(remoteUser);
    useEffect(() => {
        callStatusRef.current = callStatus;
    }, [callStatus]);
    useEffect(() => {
        remoteUserRef.current = remoteUser;
    }, [remoteUser]);

    // Cleanup resources helper
    const cleanupCall = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        remoteStreamRef.current = null;
        incomingCallDataRef.current = null;

        setCallStatus("idle");
        setRemoteUser(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setCallDuration(0);
        setScreenBlurred(false);
    };

    // End / Hang up call
    const endCall = (notifyRemote = true) => {
        if (notifyRemote && remoteUserRef.current && socket) {
            socket.emit("call:end", { to: remoteUserRef.current._id });
        }
        cleanupCall();
    };

    // Reject incoming call
    const rejectCall = () => {
        if (incomingCallDataRef.current && socket) {
            socket.emit("call:reject", { to: incomingCallDataRef.current.from });
        }
        cleanupCall();
    };

    // Initialize WebRTC Peer Connection
    const createPeerConnection = (targetUserId) => {
        const pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit("call:ice-candidate", {
                    to: targetUserId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                remoteStreamRef.current = event.streams[0];
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                cleanupCall();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    // Initiate Call (Caller side)
    const startCall = async (user, type) => {
        if (!socket || !authUser) return;
        if (callStatus !== "idle") {
            toast.error("You are already in a call or connecting");
            return;
        }

        setCallType(type);
        setRemoteUser(user);
        setCallStatus("calling");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video",
            });
            localStreamRef.current = stream;

            const pc = createPeerConnection(user._id);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("call:initiate", {
                to: user._id,
                fromUser: {
                    _id: authUser._id,
                    fullName: authUser.fullName,
                    profilePic: authUser.profilePic,
                },
                type,
                offer,
            });
        } catch (error) {
            console.error("Error starting call:", error);
            if (error.name === "NotAllowedError") {
                toast.error("Permission denied to access camera/microphone");
            } else {
                toast.error("Could not access media devices");
            }
            cleanupCall();
        }
    };

    // Accept Incoming Call (Callee side)
    const acceptCall = async () => {
        const callData = incomingCallDataRef.current;
        if (!callData || !socket) return;

        setCallStatus("connected");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callData.type === "video",
            });
            localStreamRef.current = stream;

            const pc = createPeerConnection(callData.from);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("call:accept", {
                to: callData.from,
                answer,
            });

            // Start timer
            setCallDuration(0);
            timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accepting call:", error);
            toast.error("Failed to establish call connection");
            rejectCall();
        }
    };

    // Mute / Unmute Audio
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Video On / Off
    const toggleVideo = () => {
        if (localStreamRef.current && callType === "video") {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // --- Screen Recording & Capture Prevention ---
    useEffect(() => {
        if (callStatus !== "connected") {
            setScreenBlurred(false);
            return;
        }

        // 1. Detect tab visibility / window focus changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setScreenBlurred(true);
            } else {
                setScreenBlurred(false);
            }
        };

        const handleBlur = () => {
            setScreenBlurred(true);
        };

        const handleFocus = () => {
            setScreenBlurred(false);
        };

        // 2. Block keyboard shortcuts for screenshots and recordings (PrintScreen, Windows+Shift+S, Meta+Shift+3/4, etc.)
        const handleKeyDown = (e) => {
            if (e.key === "PrintScreen") {
                e.preventDefault();
                setScreenBlurred(true);
                toast("Screenshots / recordings are restricted during calls", { icon: "🔒" });
                setTimeout(() => setScreenBlurred(false), 2000);
            }

            // Detect Alt+PrintScreen or Windows screen snippet
            if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
                if (e.shiftKey) {
                    setScreenBlurred(true);
                    setTimeout(() => setScreenBlurred(false), 2000);
                }
            }
        };

        // 3. Monitor getDisplayMedia calls to prevent active in-browser screen sharing of the call
        let originalGetDisplayMedia = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
            navigator.mediaDevices.getDisplayMedia = async () => {
                toast.error("Screen recording is blocked during active calls for privacy.");
                throw new DOMException("Screen capture is disabled during calls", "NotAllowedError");
            };
        }

        window.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("keydown", handleKeyDown);
            if (originalGetDisplayMedia && navigator.mediaDevices) {
                navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
            }
        };
    }, [callStatus]);

    // Socket Event Listeners for Call Signaling
    useEffect(() => {
        if (!socket) return;

        // Incoming call
        const handleIncomingCall = ({ from, fromUser, type, offer }) => {
            if (callStatusRef.current !== "idle") {
                // Already busy
                socket.emit("call:reject", { to: from });
                return;
            }

            incomingCallDataRef.current = { from, fromUser, type, offer };
            setRemoteUser(fromUser);
            setCallType(type);
            setCallStatus("incoming");
        };

        // Call accepted by remote peer
        const handleCallAccepted = async ({ answer }) => {
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    setCallStatus("connected");

                    // Start call duration timer
                    setCallDuration(0);
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = setInterval(() => {
                        setCallDuration((prev) => prev + 1);
                    }, 1000);
                } catch (err) {
                    console.error("Error setting remote description for answer:", err);
                    cleanupCall();
                }
            }
        };

        // Call rejected
        const handleCallRejected = () => {
            toast.error("Call was declined");
            cleanupCall();
        };

        // Remote user unavailable
        const handleUserUnavailable = () => {
            toast.error("User is currently offline or unavailable");
            cleanupCall();
        };

        // Call ended by remote user
        const handleCallEnded = () => {
            toast("Call ended", { icon: "📞" });
            cleanupCall();
        };

        // ICE candidate received
        const handleIceCandidate = async ({ candidate }) => {
            if (peerConnectionRef.current && candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ice candidate:", err);
                }
            }
        };

        // User disconnected
        const handleUserDisconnected = ({ userId }) => {
            if (remoteUserRef.current && remoteUserRef.current._id === userId) {
                toast.error("User disconnected");
                cleanupCall();
            }
        };

        socket.on("call:incoming", handleIncomingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("call:rejected", handleCallRejected);
        socket.on("call:user-unavailable", handleUserUnavailable);
        socket.on("call:ended", handleCallEnded);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:user-disconnected", handleUserDisconnected);

        return () => {
            socket.off("call:incoming", handleIncomingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("call:rejected", handleCallRejected);
            socket.off("call:user-unavailable", handleUserUnavailable);
            socket.off("call:ended", handleCallEnded);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:user-disconnected", handleUserDisconnected);
        };
    }, [socket]);

    const value = {
        callStatus,
        callType,
        remoteUser,
        isMuted,
        isVideoOff,
        screenBlurred,
        callDuration,
        localStreamRef,
        remoteStreamRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

