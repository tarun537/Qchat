import React, { useContext, useEffect, useRef } from 'react';
import { CallContext } from '../../context/CallContext';
import assets from '../assets/assets';

const CallUI = () => {
    const {
        callStatus,
        callType,
        remoteUser,
        isMuted,
        isVideoOff,
        screenBlurred,
        callDuration,
        localStreamRef,
        remoteStreamRef,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
    } = useContext(CallContext);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Format call time (mm:ss)
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Attach local stream
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [callStatus, isVideoOff, localStreamRef.current]);

    // Attach remote stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
    }, [callStatus, remoteStreamRef.current]);

    if (callStatus === 'idle') return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Screen recording prevention watermark & blur overlay */}
            {screenBlurred && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center">
                    <span className="text-4xl mb-3">🔒</span>
                    <h3 className="text-xl font-semibold mb-2">Screen Privacy Shield Active</h3>
                    <p className="text-sm text-gray-400 max-w-sm">
                        To protect caller privacy and prevent unauthorized recording, content is shielded when the window loses focus or recording is detected.
                    </p>
                </div>
            )}

            {/* Subtle dynamic security watermark to deter screen recordings */}
            <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden flex flex-wrap gap-12 opacity-10 text-xs font-mono text-white p-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="transform -rotate-12">CONFIDENTIAL • DO NOT RECORD</span>
                ))}
            </div>

            {/* 1. INCOMING CALL MODAL */}
            {callStatus === 'incoming' && (
                <div className="bg-[#1f1b2e] border border-violet-500/40 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl relative z-20 animate-fade-in">
                    <div className="relative inline-block mb-4">
                        <img 
                            src={remoteUser?.profilePic || assets.avatar_icon} 
                            alt="" 
                            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-violet-500/60" 
                        />
                        <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-[#1f1b2e] flex items-center justify-center text-xs">
                            {callType === 'video' ? '📹' : '📞'}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{remoteUser?.fullName || 'QuickChat User'}</h3>
                    <p className="text-sm text-violet-300 mb-6 flex items-center justify-center gap-1.5 animate-pulse">
                        Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...
                    </p>

                    <div className="flex justify-center items-center gap-6">
                        {/* Reject */}
                        <button 
                            onClick={rejectCall}
                            className="flex flex-col items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-transform active:scale-95"
                        >
                            <span className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                                ✕
                            </span>
                            Decline
                        </button>

                        {/* Accept */}
                        <button 
                            onClick={acceptCall}
                            className="flex flex-col items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-transform active:scale-95"
                        >
                            <span className="w-14 h-14 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg animate-bounce">
                                📞
                            </span>
                            Answer
                        </button>
                    </div>
                </div>
            )}

            {/* 2. CALLING (OUTGOING) MODAL */}
            {callStatus === 'calling' && (
                <div className="bg-[#1f1b2e] border border-violet-500/40 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl relative z-20">
                    <div className="relative inline-block mb-4">
                        <img 
                            src={remoteUser?.profilePic || assets.avatar_icon} 
                            alt="" 
                            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-violet-500/60 animate-pulse" 
                        />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{remoteUser?.fullName}</h3>
                    <p className="text-sm text-violet-300 mb-8 animate-pulse">
                        Calling ({callType === 'video' ? 'Video' : 'Audio'})...
                    </p>

                    <button 
                        onClick={() => endCall(true)}
                        className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg mx-auto active:scale-95 transition-transform"
                        title="End call"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* 3. CONNECTED CALL SCREEN */}
            {callStatus === 'connected' && (
                <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 z-20">
                    {/* Top bar info */}
                    <div className="flex justify-between items-center bg-black/40 backdrop-blur-md px-5 py-3 rounded-full mx-auto border border-white/10 max-w-md w-full">
                        <div className="flex items-center gap-3">
                            <img 
                                src={remoteUser?.profilePic || assets.avatar_icon} 
                                alt="" 
                                className="w-9 h-9 rounded-full object-cover" 
                            />
                            <div>
                                <h4 className="text-sm font-semibold text-white leading-tight">{remoteUser?.fullName}</h4>
                                <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {formatTime(callDuration)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-1 bg-violet-600/40 border border-violet-400/40 rounded-full text-violet-200">
                                {callType === 'video' ? 'Video' : 'Audio'}
                            </span>
                        </div>
                    </div>

                    {/* Middle Video / Avatar Area */}
                    <div className="flex-1 flex items-center justify-center relative my-4 rounded-3xl overflow-hidden bg-black/40 border border-white/5">
                        {callType === 'video' ? (
                            <>
                                {/* Remote video */}
                                <video 
                                    ref={remoteVideoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain" 
                                />

                                {/* Local PIP video */}
                                <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden border-2 border-violet-500 shadow-2xl bg-black">
                                    {isVideoOff ? (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-gray-400 text-xs">
                                            Camera Off
                                        </div>
                                    ) : (
                                        <video 
                                            ref={localVideoRef} 
                                            autoPlay 
                                            playsInline 
                                            muted 
                                            className="w-full h-full object-cover transform scale-x-[-1]" 
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Audio call visualizer */
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full border-4 border-violet-500/50 p-1 mb-4 relative">
                                    <img 
                                        src={remoteUser?.profilePic || assets.avatar_icon} 
                                        alt="" 
                                        className="w-full h-full rounded-full object-cover" 
                                    />
                                    <div className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping opacity-25"></div>
                                </div>
                                <h3 className="text-xl text-white font-medium">{remoteUser?.fullName}</h3>
                                <p className="text-sm text-gray-400 mt-1">QuickChat Audio Call</p>
                            </div>
                        )}
                    </div>

                    {/* Controls Bar */}
                    <div className="flex items-center justify-center gap-4 bg-black/50 backdrop-blur-lg px-6 py-3.5 rounded-full mx-auto border border-white/10">
                        {/* Mute button */}
                        <button 
                            onClick={toggleMute}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
                                isMuted ? 'bg-red-500/30 text-red-400 border border-red-500/60' : 'bg-white/15 text-white hover:bg-white/25'
                            }`}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? '🔇' : '🎙️'}
                        </button>

                        {/* Camera toggle (video call only) */}
                        {callType === 'video' && (
                            <button 
                                onClick={toggleVideo}
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-colors ${
                                    isVideoOff ? 'bg-red-500/30 text-red-400 border border-red-500/60' : 'bg-white/15 text-white hover:bg-white/25'
                                }`}
                                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                            >
                                {isVideoOff ? '🚫' : '📹'}
                            </button>
                        )}

                        {/* End call button */}
                        <button 
                            onClick={() => endCall(true)}
                            className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xl shadow-lg transition-transform active:scale-95"
                            title="End call"
                        >
                            📞
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallUI;

