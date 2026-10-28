import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { compressImage } from '../lib/utils';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { authUser, updateProfile } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    const [selectedImg, setSelectedImg] = useState(null);
    const navigate = useNavigate();
    const [name, setName] = useState(authUser?.fullName || "");
    const [bio, setBio] = useState(authUser?.bio || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (authUser) {
            setName(authUser.fullName || "");
            setBio(authUser.bio || "");
        }
    }, [authUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedImg) {
            await updateProfile({ fullName: name, bio });
            setLoading(false);
            navigate('/');
            return;
        }

        try {
            const base64Image = await compressImage(selectedImg, 512, 512, 0.85);
            await updateProfile({ profilePic: base64Image, fullName: name, bio });
            setLoading(false);
            navigate('/');
        } catch (error) {
            setLoading(false);
            toast.error("Failed to process image: " + error.message);
        }
    };

    return (
        <div className={`min-h-[100dvh] w-full flex flex-col justify-between p-4 sm:p-8 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1412] text-gray-100' : 'bg-[#e4eae6] text-gray-900'
        }`}>
            {/* Top Navigation */}
            <div className="w-full max-w-4xl mx-auto flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/')}
                    className={`flex items-center gap-2 text-xs sm:text-sm font-semibold p-2 px-3 rounded-xl border transition-colors ${
                        isDark 
                            ? 'bg-[#151c19] border-emerald-950/80 text-gray-300 hover:text-white hover:bg-white/5' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    <span>Back to Chats</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-medium ${
                            isDark 
                                ? 'bg-[#151c19] border-emerald-950/80 text-emerald-400 hover:bg-white/5' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                        }`}
                        title="Toggle Theme"
                    >
                        {isDark ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-2xl mx-auto my-auto">
                <div className={`w-full p-6 sm:p-10 rounded-3xl border shadow-xl transition-colors duration-300 flex flex-col md:flex-row items-center gap-8 ${
                    isDark 
                        ? 'bg-[#151c19] border-emerald-950/70 text-gray-100' 
                        : 'bg-white border-emerald-100/90 shadow-emerald-950/5 text-gray-900'
                }`}>
                    {/* Avatar Preview */}
                    <div className="flex flex-col items-center shrink-0">
                        <div className="relative group cursor-pointer">
                            <img
                                className="w-28 sm:w-36 h-28 sm:h-36 rounded-full object-cover border-4 border-emerald-500/40 shadow-md"
                                src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.avatar_icon)}
                                alt="Profile Avatar"
                            />
                            <label
                                htmlFor="avatar"
                                className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <span className="text-xl">📷</span>
                                <span>Change</span>
                            </label>
                            <input
                                onChange={(e) => setSelectedImg(e.target.files[0])}
                                type="file"
                                id="avatar"
                                accept=".png, .jpg, .jpeg"
                                hidden
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">Tap image to update</p>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col gap-4">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Keep your account details up to date</p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                            <input
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                type="text"
                                required
                                placeholder="Your Name"
                                className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>About You (Bio)</label>
                            <textarea
                                onChange={(e) => setBio(e.target.value)}
                                value={bio}
                                rows={3}
                                required
                                placeholder="Write a short bio..."
                                className={`p-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                                    isDark
                                        ? 'bg-[#1b2320] border-emerald-950 text-white placeholder-gray-500 focus:border-emerald-500'
                                        : 'bg-[#f4f7f5] border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-600'
                                }`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className={`w-full max-w-4xl mx-auto flex justify-between items-center text-[11px] pt-4 border-t mt-6 ${
                isDark ? 'border-emerald-950/60 text-gray-500' : 'border-gray-200 text-gray-500'
            }`}>
                <span>reachat • Profile Settings</span>
                <span>All changes synced across devices</span>
            </div>
        </div>
    );
};

export default ProfilePage;
