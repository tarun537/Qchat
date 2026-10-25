import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { compressImage, formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext)
    const { authUser, onlineUsers } = useContext(AuthContext)

    const scrollEnd = useRef()

    const [input, setInput] = useState('');

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Handle sending a message
    const handleSendMessage = async (e)=>{
        e.preventDefault()
        if(input.trim() === "") return null;
        await sendMessage({text: input.trim()});
        setInput("")
    }

    // Handle sending an image
    const handleSendImage = async (e) =>{
        const file = e.target.files[0];
        if(!file || !file.type.startsWith("image/")){
            toast.error("select an image file")
            return;
        }
        if(file.size > 25 * 1024 * 1024){
            toast.error("Image size must be less than 25MB");
            return;
        }
        try {
            const base64Image = await compressImage(file, 1200, 1200, 0.8);
            await sendMessage({image: base64Image});
            e.target.value = "";
        } catch (error) {
            toast.error("Failed to process image: " + error.message);
        }
    }

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
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all audio tracks
                stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Don't send if too short (< 0.5s worth of data)
                if (audioBlob.size < 1000) {
                    toast.error("Recording too short");
                    return;
                }

                // Convert to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result;
                    try {
                        await sendMessage({ audio: base64Audio });
                    } catch (error) {
                        toast.error("Failed to send voice message");
                    }
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            // Start duration timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    // Auto-stop at 2 minutes
                    if (prev >= 120) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            if (error.name === 'NotAllowedError') {
                toast.error("Microphone access denied. Please allow microphone permission.");
            } else {
                toast.error("Could not access microphone");
            }
        }
    };

    // Stop voice recording
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

    // Cancel voice recording
    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            // Remove the onstop handler so it doesn't send
            mediaRecorderRef.current.onstop = () => {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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

    // Format seconds into mm:ss
    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    useEffect(()=>{
        if(selectedUser){
            getMessages(selectedUser._id)
        }
    },[selectedUser])

    useEffect(()=>{
        if(scrollEnd.current && messages){
            scrollEnd.current.scrollIntoView({ behavior: "smooth"})
        }
    },[messages])

  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
        {/* ------ header ------ */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
        <img onClick={()=> setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>
      {/* ------ chat area ------ */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg, index)=>(
            <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser?._id && 'flex-row-reverse'}`}>
                {msg.image ? (
                    <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
                ) : msg.audio ? (
                    <div className={`mb-8 rounded-lg p-2 ${msg.senderId === authUser?._id ? 'bg-violet-500/30 rounded-br-none' : 'bg-violet-500/30 rounded-bl-none'}`}>
                        <div className='flex items-center gap-2'>
                            {/* Mic icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-300">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" x2="12" y1="19" y2="22"/>
                            </svg>
                            <audio controls className='max-w-[200px] h-8' preload='metadata'>
                                <source src={msg.audio} type="audio/webm" />
                                Your browser does not support audio.
                            </audio>
                        </div>
                    </div>
                ) : (
                    <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser?._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
                )}
                <div className='text-center text-xs'>
                    <img src={msg.senderId === authUser?._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                    <p className='text-gray-500'>{formatMessageTime(msg.createdAt) }</p>
                </div>
            </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

        {/* ------ bottom area ------ */}
        <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>

            {/* Recording UI */}
            {isRecording ? (
                <div className='flex-1 flex items-center gap-3 bg-red-500/20 border border-red-500/40 px-4 py-2 rounded-full'>
                    {/* Pulsing red dot */}
                    <span className='w-3 h-3 rounded-full bg-red-500 animate-pulse'></span>
                    <span className='text-red-400 text-sm font-mono'>{formatDuration(recordingDuration)}</span>
                    <span className='flex-1 text-sm text-gray-400'>Recording...</span>
                    {/* Cancel button */}
                    <button onClick={cancelRecording} className='text-gray-400 hover:text-red-400 transition-colors' title="Cancel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    {/* Stop & Send button */}
                    <button onClick={stopRecording} className='bg-green-500 hover:bg-green-600 text-white rounded-full p-1.5 transition-colors' title="Send voice message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>
                        </svg>
                    </button>
                </div>
            ) : (
                <>
                    <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
                        <input onChange={(e)=> setInput(e.target.value)} value={input} onKeyDown={(e)=> e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder='Send a message' 
                        className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
                        <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
                        <label htmlFor="image">
                            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
                        </label>
                    </div>

                    {/* Show mic button when input is empty, send button when there's text */}
                    {input.trim() ? (
                        <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer' />
                    ) : (
                        <button onClick={startRecording} className='text-gray-400 hover:text-violet-400 transition-colors p-1' title="Record voice message">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" x2="12" y1="19" y2="22"/>
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>


    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
        <img src={assets.logo_icon} className='max-w-16' alt="" />
        <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer
