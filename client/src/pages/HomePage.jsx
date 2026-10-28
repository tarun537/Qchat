import React, { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'
import { ThemeContext } from '../../context/ThemeContext'

const HomePage = () => {
    const { selectedUser, selectedGroup } = useContext(ChatContext);
    const { theme } = useContext(ThemeContext);
    const activeChat = selectedUser || selectedGroup;

    return (
        <div className={`w-full h-[100dvh] sm:h-screen sm:p-5 md:p-8 flex items-center justify-center overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f1412]' : 'bg-[#e3e8e5]'}`}>
            <div className={`w-full max-w-[1440px] h-full sm:h-[94vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border transition-colors duration-300 grid grid-cols-1 relative ${
                theme === 'dark'
                    ? 'bg-[#151c19] border-emerald-950/60 shadow-black/40'
                    : 'bg-[#fcfdfc] border-emerald-100/80 shadow-emerald-950/5'
            } ${
                activeChat
                    ? selectedUser
                        ? 'md:grid-cols-[380px_1fr_320px]'
                        : 'md:grid-cols-[380px_1fr]'
                    : 'md:grid-cols-[380px_1fr]'
            }`}>
                <Sidebar />
                <ChatContainer />
                {selectedUser && <RightSidebar />}
            </div>
        </div>
    );
};

export default HomePage;
