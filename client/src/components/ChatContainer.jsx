import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { compressImage, formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { CallContext } from '../../context/CallContext'
import { ThemeContext } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {
    const {
        messages,
        selectedUser,
        setSelectedUser,
        selectedGroup,
        setSelectedGroup,
        sendMessage,
        sendGroupMessage,
        getMessages,
        getGroupMessages,
        users
    } = useContext(ChatContext);

    const { authUser, onlineUsers } = useContext(AuthContext);
    const { startCall, callStatus } = useContext(CallContext);
    const { theme } = useContext(ThemeContext);

    const isDark = theme === 'dark';
    const scrollEnd = useRef();

    const [input, setInput] = useState('');

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const activeChat = selectedGroup || selectedUser;
    const isGroup = !!selectedGroup;

    // Handle sending message
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (input.trim() === "") return;

        if (isGroup) {
            await sendGroupMessage({ text: input.trim() });
        } else {
            await sendMessage({ text: input.trim() });
        }
        setInput("");
    };

    // Handle sending image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Select an image file");
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            toast.error("Image size must be less than 25MB");
            return;
        }
        try {
            const base64Image = await compressImage(file, 1200, 1200, 0.8);
            if (isGroup) {
                await sendGroupMessage({ image: base64Image });
            } else {
                await sendMessage({ image: base64Image });
            }
            e.target.value = "";
        } catch (error) {
            toast.error("Failed to process image: " + error.message);
        }
    };

    // Start voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                if (audioBlob.size < 1000) {
                    toast.error("Recording too short");
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result;
                    try {
                        if (isGroup) {
                            await sendGroupMessage({ audio: base64Audio });
                        } else {
                            await sendMessage({ audio: base64Audio });
                        }
                    } catch (error) {
                        toast.error("Failed to send voice message");
                    }
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => {
                    if (prev >= 120) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                toast.error("Microphone access denied");
            } else {
                toast.error("Could not access microphone");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = () => {
                mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            };
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        toast("Recording cancelled", { icon: "🗑️" });
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        } else if (selectedGroup) {
            getGroupMessages(selectedGroup._id);
        }
    }, [selectedUser, selectedGroup]);

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const closeChat = () => {
        setSelectedUser(null);
        setSelectedGroup(null);
    };

    // When no chat is selected: Empty State like the reference image
    if (!activeChat) {
        return (
            <div className={`h-full max-md:hidden flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${
                isDark ? 'bg-[#151c19] text-gray-200' : 'bg-[#fcfdfc] text-gray-800'
            }`}>
                {/* Bubble Icon with soft background glow */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                    Good conversations<br />
                    <span className="text-emerald-600 dark:text-emerald-400">start here.</span>
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                    Choose a conversation or find someone to start a new one.
                </p>

                <button
                    onClick={() => {
                        const firstAvailable = users.find((u) => u._id !== authUser?._id);
                        if (firstAvailable) setSelectedUser(firstAvailable);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95"
                >
                    <span>+</span> Find a person
                </button>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col relative overflow-hidden transition-colors duration-300 ${
            !activeChat ? 'max-md:hidden' : 'w-full'
        } ${
            isDark ? 'bg-[#151c19] text-gray-200' : 'bg-[#fcfdfc] text-gray-800'
        }`}>
            {/* Header */}
            <div className={`flex items-center gap-3 p-3 px-4 border-b shrink-0 transition-colors ${
                isDark ? 'border-emerald-950/60 bg-[#151c19]' : 'border-emerald-100 bg-[#fcfdfc]'
            }`}>
                <img
                    src={(isGroup ? activeChat.groupPic : activeChat.profilePic) || assets.avatar_icon}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                />
                <div className="flex-1 leading-tight min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                        {isGroup ? activeChat.name : activeChat.fullName}
                        {!isGroup && onlineUsers.includes(activeChat._id) && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                    </p>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {isGroup
                            ? `${activeChat.members?.length || 0} members`
                            : onlineUsers.includes(activeChat._id) ? "Online" : "Offline"}
                    </span>
                </div>

                {/* Audio/Video Call Buttons */}
                {!isGroup && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => startCall(selectedUser, 'audio')}
                            disabled={callStatus !== 'idle'}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-40"
                            title="Start Voice Call"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => startCall(selectedUser, 'video')}
                            disabled={callStatus !== 'idle'}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-40"
                            title="Start Video Call"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m22 8-6 4 6 4V8Z"/>
                                <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
                            </svg>
                        </button>
                    </div>
                )}

                <button
                    onClick={closeChat}
                    className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 text-sm font-bold"
                >
                    ✕
                </button>
            </div>

            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-[#121815]' : 'bg-[#f7faf8]'}`}>
                {messages.map((msg, index) => {
                    const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;
                    const senderId = senderObj ? senderObj._id : msg.senderId;
                    const isMe = senderId === authUser?._id;
                    const senderName = senderObj?.fullName || (isMe ? 'You' : 'Member');
                    const senderPic = senderObj?.profilePic || assets.avatar_icon;

                    return (
                        <div key={index} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <img
                                    src={isGroup ? senderPic : (activeChat?.profilePic || assets.avatar_icon)}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                                />
                            )}

                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                {isGroup && !isMe && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5 ml-1">
                                        {senderName}
                                    </span>
                                )}

                                {msg.image ? (
                                    <img src={msg.image} alt="" className="max-w-[240px] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm" />
                                ) : msg.audio ? (
                                    <div className={`p-2.5 rounded-2xl flex items-center gap-2 ${
                                        isMe
                                            ? 'bg-emerald-600 text-white rounded-br-xs'
                                            : isDark
                                                ? 'bg-[#1c2420] text-gray-200 border border-emerald-950 rounded-bl-xs'
                                                : 'bg-white text-gray-800 border border-emerald-100 rounded-bl-xs shadow-sm'
                                    }`}>
                                        <audio controls className="max-w-[180px] h-8" preload="metadata">
                                            <source src={msg.audio} type="audio/webm" />
                                        </audio>
                                    </div>
                                ) : (
                                    <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                        isMe
                                            ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm'
                                            : isDark
                                                ? 'bg-[#1b2320] text-gray-200 border border-emerald-950/80 rounded-bl-xs'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                )}

                                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">
                                    {formatMessageTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollEnd}></div>
            </div>

            {/* Input Bar */}
            <div className={`p-2.5 sm:p-3 px-3 sm:px-4 border-t shrink-0 transition-colors ${
                isDark ? 'border-emerald-950/60 bg-[#151c19]' : 'border-emerald-100 bg-[#fcfdfc]'
            }`}>
                {isRecording ? (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-2xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-red-500 text-xs font-mono">{formatDuration(recordingDuration)}</span>
                        <span className="flex-1 text-xs text-gray-500">Recording audio...</span>
                        <button onClick={cancelRecording} className="text-gray-400 hover:text-red-500 text-xs font-bold px-2">
                            Cancel
                        </button>
                        <button onClick={stopRecording} className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                            ✓
                        </button>
                    </div>
                ) : (
                    <div className={`flex items-center gap-2 p-1.5 px-3 rounded-2xl border transition-colors ${
                        isDark ? 'bg-[#1b2320] border-emerald-950' : 'bg-[#f4f7f5] border-gray-200/80'
                    }`}>
                        <label className="cursor-pointer text-gray-400 hover:text-emerald-500 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                            <input onChange={handleSendImage} type="file" accept="image/*" hidden />
                        </label>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                            placeholder={`Message ${isGroup ? activeChat.name : activeChat.fullName}...`}
                            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm placeholder-gray-400"
                        />

                        {input.trim() ? (
                            <button
                                onClick={handleSendMessage}
                                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={startRecording}
                                className="text-gray-400 hover:text-emerald-500 p-1"
                                title="Voice message"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <line x1="12" x2="12" y1="19" y2="22"/>
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatContainer;
