import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'

const RightSidebar = () => {
    const { selectedUser, messages } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const [msgImages, setMsgImages] = useState([]);

    const isDark = theme === 'dark';

    useEffect(() => {
        setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
    }, [messages]);

    if (!selectedUser) return null;

    return (
        <div className={`h-full border-l p-5 flex flex-col justify-between transition-colors duration-300 max-md:hidden ${
            isDark
                ? 'bg-[#151c19] border-emerald-950/60 text-gray-200'
                : 'bg-[#fcfdfc] border-emerald-100 text-gray-800'
        }`}>
            <div className="flex flex-col items-center text-center">
                <div className="relative mb-3 mt-4">
                    <img
                        src={selectedUser?.profilePic || assets.avatar_icon}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/30"
                    />
                    {onlineUsers.includes(selectedUser._id) && (
                        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151c19]"></span>
                    )}
                </div>

                <h3 className="text-sm font-bold">{selectedUser.fullName}</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                    {selectedUser.bio || 'Available'}
                </p>

                <hr className={`w-full my-5 ${isDark ? 'border-emerald-950/80' : 'border-gray-100'}`} />

                {/* Media Section */}
                <div className="w-full text-left">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Shared Media ({msgImages.length})
                        </span>
                    </div>

                    {msgImages.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">No media shared yet</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {msgImages.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    onClick={() => window.open(url)}
                                    alt=""
                                    className="w-full aspect-square rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => logout()}
                className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors mt-4"
            >
                Log Out
            </button>
        </div>
    );
};

export default RightSidebar;
