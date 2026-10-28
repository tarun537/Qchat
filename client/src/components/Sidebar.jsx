import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import { ThemeContext } from '../../context/ThemeContext'
import CreateGroupModal from './CreateGroupModal'

const Sidebar = () => {
    const {
        getUsers,
        users,
        groups,
        getGroups,
        selectedUser,
        setSelectedUser,
        selectedGroup,
        setSelectedGroup,
        unseenMessages,
        unseenGroupMessages,
        setUnseenMessages,
        setUnseenGroupMessages
    } = useContext(ChatContext);

    const { logout, onlineUsers, authUser } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    const [input, setInput] = useState('');
    const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Unread' | 'Groups' | 'Pinned' | 'Archived'
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [statusText, setStatusText] = useState('Available');
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        getUsers();
        getGroups();
    }, [onlineUsers]);

    // Filter users and groups based on search input and filter tabs
    const filteredUsers = users.filter((u) => {
        const matchesSearch = u.fullName.toLowerCase().includes(input.toLowerCase());
        if (!matchesSearch) return false;
        if (filterTab === 'Unread') return (unseenMessages[u._id] || 0) > 0;
        if (filterTab === 'Groups') return false;
        return true;
    });

    const filteredGroups = groups.filter((g) => {
        const matchesSearch = g.name.toLowerCase().includes(input.toLowerCase());
        if (!matchesSearch) return false;
        if (filterTab === 'Unread') return (unseenGroupMessages[g._id] || 0) > 0;
        return true;
    });

    const isDark = theme === 'dark';

    return (
        <div className={`h-full flex flex-col border-r transition-colors duration-300 ${
            selectedUser || selectedGroup ? 'max-md:hidden' : ''
        } ${
            isDark
                ? 'bg-[#151c19] border-emerald-950/60 text-gray-200'
                : 'bg-[#fcfdfc] border-emerald-100 text-gray-800'
        }`}>
            {/* 1. Header with Logo, Add Action, Theme Toggle, & Menu */}
            <div className="p-4 sm:p-5 pb-3">
                <div className="flex justify-between items-center">
                    {/* Brand Logo (reachat style with leaf/bubble icon) */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            reachat
                        </span>
                    </div>

                    {/* Actions: + create group, Theme toggle, Kebab menu */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            title="Create Group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>

                        {/* Theme Toggle (Sun / Moon) */}
                        <button
                            onClick={toggleTheme}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isDark ? 'hover:bg-white/10 text-emerald-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"/>
                                    <line x1="12" y1="1" x2="12" y2="3"/>
                                    <line x1="12" y1="21" x2="12" y2="23"/>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                    <line x1="1" y1="12" x2="3" y2="12"/>
                                    <line x1="21" y1="12" x2="23" y2="12"/>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                                </svg>
                            )}
                        </button>

                        {/* Menu Dropdown - Clickable & Tap friendly for mobile + Desktop */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                    isMenuOpen
                                        ? 'bg-emerald-500/20 text-emerald-500'
                                        : isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                                title="Menu"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="12" cy="5" r="1"/>
                                    <circle cx="12" cy="19" r="1"/>
                                </svg>
                            </button>

                            {/* Backdrop overlay to close menu on tap outside */}
                            {isMenuOpen && (
                                <div
                                    onClick={() => setIsMenuOpen(false)}
                                    className="fixed inset-0 z-20 bg-transparent"
                                />
                            )}

                            {isMenuOpen && (
                                <div className={`absolute top-full right-0 z-30 w-44 p-2 rounded-2xl border shadow-2xl transition-all ${
                                    isDark ? 'bg-[#1b2320] border-emerald-950 text-gray-200' : 'bg-white border-gray-100 text-gray-800'
                                }`}>
                                    <p
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="cursor-pointer text-xs p-2.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <span>👤</span> Edit Profile
                                    </p>
                                    <p
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsGroupModalOpen(true);
                                        }}
                                        className="cursor-pointer text-xs p-2.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <span>👥</span> New Group
                                    </p>
                                    <hr className={`my-1 ${isDark ? 'border-gray-800' : 'border-gray-100'}`} />
                                    <p
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            logout();
                                        }}
                                        className="cursor-pointer text-xs p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <span>🚪</span> Logout
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. User Status Card - Tap to Edit Profile on Mobile */}
                <div 
                    onClick={() => navigate('/profile')}
                    className={`mt-3 p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer hover:border-emerald-500/50 ${
                        isDark
                            ? 'bg-[#1b2420] border-emerald-900/40 text-gray-100 hover:bg-[#202b26]'
                            : 'bg-[#f4f7f5] border-emerald-50 text-gray-800 hover:bg-[#eef3ef]'
                    }`}
                    title="Tap to Edit Profile"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {authUser?.fullName ? authUser.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold truncate leading-tight">
                                {authUser?.fullName || 'My Account'}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                {isEditingStatus ? (
                                    <input
                                        type="text"
                                        value={statusText}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setStatusText(e.target.value)}
                                        onBlur={() => setIsEditingStatus(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingStatus(false)}
                                        autoFocus
                                        className="text-[11px] bg-transparent border-b border-emerald-500 outline-none w-24 text-emerald-600 dark:text-emerald-400"
                                    />
                                ) : (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                        {statusText}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingStatus(!isEditingStatus);
                        }}
                        className="text-gray-400 hover:text-emerald-500 p-1.5 rounded-lg"
                        title="Edit Status"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                </div>

                {/* 3. Search Bar */}
                <div className={`mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-colors ${
                    isDark
                        ? 'bg-[#19221e] border-emerald-950/80 focus-within:border-emerald-700'
                        : 'bg-[#f4f7f5] border-gray-200/80 focus-within:border-emerald-500'
                }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Search conversations..."
                        className="bg-transparent border-none outline-none text-xs w-full placeholder-gray-400"
                    />
                    <button
                        onClick={() => setIsGroupModalOpen(true)}
                        className="text-gray-400 hover:text-emerald-500 font-bold text-sm shrink-0"
                        title="Start new conversation"
                    >
                        +
                    </button>
                </div>

                {/* 4. Filter Pills (All, Unread, Groups, Pinned, Archived) */}
                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
                    {['All', 'Unread', 'Groups', 'Pinned', 'Archived'].map((tab) => {
                        const active = filterTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setFilterTab(tab)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : isDark
                                            ? 'bg-[#1b2320] text-gray-400 hover:text-white hover:bg-white/5'
                                            : 'bg-[#f0f4f2] text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 5. Section Header */}
            <div className="px-5 py-2 text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                Conversations
            </div>

            {/* 6. Conversation List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {/* When list is completely empty */}
                {filteredUsers.length === 0 && filteredGroups.length === 0 && (
                    <div className="text-center py-10 px-4 text-xs text-gray-400">
                        <p className="mb-2">Start a chat with the + button</p>
                    </div>
                )}

                {/* Groups rendering (if tab is All or Groups) */}
                {(filterTab === 'All' || filterTab === 'Groups') &&
                    filteredGroups.map((grp) => {
                        const isSelected = selectedGroup?._id === grp._id;
                        return (
                            <div
                                key={grp._id}
                                onClick={() => {
                                    setSelectedGroup(grp);
                                    setSelectedUser(null);
                                    setUnseenGroupMessages((prev) => ({ ...prev, [grp._id]: 0 }));
                                }}
                                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-colors ${
                                    isSelected
                                        ? isDark
                                            ? 'bg-emerald-950/50 text-white'
                                            : 'bg-emerald-50 text-gray-900'
                                        : isDark
                                            ? 'hover:bg-white/5 text-gray-300'
                                            : 'hover:bg-gray-100/70 text-gray-800'
                                }`}
                            >
                                <img
                                    src={grp.groupPic || assets.avatar_icon}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/40 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-semibold truncate">{grp.name}</p>
                                        <span className="text-[10px] text-gray-400 shrink-0">Group</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        {grp.members?.length || 0} members
                                    </p>
                                </div>
                                {unseenGroupMessages[grp._id] > 0 && (
                                    <span className="text-[10px] w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                                        {unseenGroupMessages[grp._id]}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                {/* 1-on-1 Users rendering */}
                {filterTab !== 'Groups' &&
                    filteredUsers.map((user) => {
                        const isSelected = selectedUser?._id === user._id;
                        const isOnline = onlineUsers.includes(user._id);

                        return (
                            <div
                                key={user._id}
                                onClick={() => {
                                    setSelectedUser(user);
                                    setSelectedGroup(null);
                                    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
                                }}
                                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-colors ${
                                    isSelected
                                        ? isDark
                                            ? 'bg-emerald-950/50 text-white'
                                            : 'bg-emerald-50 text-gray-900'
                                        : isDark
                                            ? 'hover:bg-white/5 text-gray-300'
                                            : 'hover:bg-gray-100/70 text-gray-800'
                                }`}
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={user?.profilePic || assets.avatar_icon}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151c19]"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-semibold truncate">{user.fullName}</p>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {isOnline ? 'Active' : ''}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                        {user.bio || 'Tap to start conversation'}
                                    </p>
                                </div>
                                {unseenMessages[user._id] > 0 && (
                                    <span className="text-[10px] w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                                        {unseenMessages[user._id]}
                                    </span>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* 7. Footer Status */}
            <div className={`p-3 px-4 border-t flex justify-between items-center text-[10px] transition-colors ${
                isDark ? 'border-emerald-950/60 text-gray-500' : 'border-emerald-100 text-gray-400'
            }`}>
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Online
                </span>
                <span>reachat • Private & personal</span>
            </div>

            <CreateGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
            />
        </div>
    );
};

export default Sidebar;
