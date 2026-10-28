import React, { useState, useContext } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { users, createGroup } = useContext(ChatContext);
    const { authUser } = useContext(AuthContext);

    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupPic, setGroupPic] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePicChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setGroupPic(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const toggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter((id) => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            toast.error('Please provide a group name');
            return;
        }
        if (selectedMembers.length < 1) {
            toast.error('Please select at least 1 member to add to the group');
            return;
        }

        setLoading(true);
        const success = await createGroup({
            name: groupName.trim(),
            description: groupDesc.trim(),
            groupPic,
            memberIds: selectedMembers
        });
        setLoading(false);

        if (success) {
            setGroupName('');
            setGroupDesc('');
            setSelectedMembers([]);
            setGroupPic('');
            onClose();
        }
    };

    const eligibleUsers = users.filter((u) => u._id !== authUser?._id);
    const filteredUsers = searchTerm
        ? eligibleUsers.filter((u) => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
        : eligibleUsers;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1f1b2e] border border-violet-500/30 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span>👥</span> New Group
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Group Icon & Name */}
                    <div className="flex items-center gap-4">
                        <label className="relative cursor-pointer">
                            <img
                                src={groupPic || assets.avatar_icon}
                                alt="Group"
                                className="w-14 h-14 rounded-full object-cover border-2 border-violet-500"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity">
                                📷
                            </div>
                            <input type="file" accept="image/*" onChange={handlePicChange} hidden />
                        </label>
                        <div className="flex-1 flex flex-col gap-1">
                            <input
                                type="text"
                                placeholder="Group Name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="bg-[#282142] p-2.5 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-violet-500"
                                maxLength={30}
                                required
                            />
                        </div>
                    </div>

                    {/* Member Selection Search */}
                    <div>
                        <div className="flex justify-between items-center mb-1 text-xs text-gray-400">
                            <span>Add Members ({selectedMembers.length} selected)</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#282142] p-2 rounded-lg text-xs w-full border border-gray-600 focus:outline-none focus:border-violet-500 mb-2"
                        />
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 p-1 bg-black/20 rounded-lg border border-gray-700/60">
                            {filteredUsers.length === 0 ? (
                                <p className="text-xs text-gray-400 p-3 text-center">No friends found</p>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedMembers.includes(user._id);
                                    return (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleMember(user._id)}
                                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                                                isSelected ? 'bg-violet-600/30 border border-violet-500/50' : 'hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={user.profilePic || assets.avatar_icon}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <span className="text-sm">{user.fullName}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="w-4 h-4 accent-violet-600 cursor-pointer"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 rounded-lg font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-lg"
                    >
                        {loading ? 'Creating Group...' : 'Create Group'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;

