import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [unseenGroupMessages, setUnseenGroupMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    // Get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get('/api/messages/users');
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Get all groups for sidebar
    const getGroups = async () => {
        try {
            const { data } = await axios.get('/api/groups/my-groups');
            if (data.success) {
                setGroups(data.groups);
                setUnseenGroupMessages(data.unseenGroupMessages || {});
            }
        } catch (error) {
            console.error("Fetch groups error:", error.message);
        }
    };

    // Create a new group
    const createGroup = async ({ name, description, groupPic, memberIds }) => {
        try {
            const { data } = await axios.post('/api/groups/create', {
                name,
                description,
                groupPic,
                memberIds
            });
            if (data.success) {
                toast.success("Group created successfully!");
                setGroups((prev) => [data.group, ...prev]);
                setSelectedGroup(data.group);
                setSelectedUser(null);
                if (socket) {
                    socket.emit("group:join", { groupId: data.group._id });
                }
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    // Get messages for selected 1-on-1 user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Get messages for selected group
    const getGroupMessages = async (groupId) => {
        try {
            const { data } = await axios.get(`/api/groups/${groupId}/messages`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Send 1-on-1 message
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prev) => [...prev, data.newMessage]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Send group message
    const sendGroupMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/groups/${selectedGroup._id}/send`, messageData);
            if (data.success) {
                // If the socket room will broadcast to all, let it update or append if needed
                // data.newMessage already emitted to room
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Subscribe to socket messages
    useEffect(() => {
        if (!socket) return;

        // 1-on-1 messages
        const handleNewMessage = (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prev) => [...prev, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prev) => ({
                    ...prev,
                    [newMessage.senderId]: prev[newMessage.senderId] ? prev[newMessage.senderId] + 1 : 1
                }));
            }
        };

        // Group messages
        const handleNewGroupMessage = (newGroupMsg) => {
            if (selectedGroup && newGroupMsg.groupId === selectedGroup._id) {
                setMessages((prev) => [...prev, newGroupMsg]);
            } else {
                setUnseenGroupMessages((prev) => ({
                    ...prev,
                    [newGroupMsg.groupId]: (prev[newGroupMsg.groupId] || 0) + 1
                }));
            }
        };

        // Newly created group notification
        const handleNewGroup = (newGroup) => {
            setGroups((prev) => {
                if (prev.some((g) => g._id === newGroup._id)) return prev;
                return [newGroup, ...prev];
            });
            if (socket) {
                socket.emit("group:join", { groupId: newGroup._id });
            }
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("newGroupMessage", handleNewGroupMessage);
        socket.on("newGroup", handleNewGroup);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("newGroupMessage", handleNewGroupMessage);
            socket.off("newGroup", handleNewGroup);
        };
    }, [socket, selectedUser, selectedGroup]);

    const value = {
        messages,
        users,
        groups,
        selectedUser,
        selectedGroup,
        setSelectedUser,
        setSelectedGroup,
        unseenMessages,
        unseenGroupMessages,
        setUnseenMessages,
        setUnseenGroupMessages,
        getUsers,
        getGroups,
        createGroup,
        getMessages,
        getGroupMessages,
        sendMessage,
        sendGroupMessage
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
