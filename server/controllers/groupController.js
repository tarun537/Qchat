import cloudinary from "../lib/cloudinary.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, description, groupPic, memberIds } = req.body;
        const adminId = req.user._id;

        if (!name || !name.trim()) {
            return res.json({ success: false, message: "Group name is required" });
        }

        // Include admin in members list
        let members = [adminId];
        if (Array.isArray(memberIds)) {
            memberIds.forEach((id) => {
                if (id && id.toString() !== adminId.toString() && !members.includes(id)) {
                    members.push(id);
                }
            });
        }

        if (members.length < 2) {
            return res.json({ success: false, message: "A group must have at least 2 members" });
        }

        let uploadedPicUrl = "";
        if (groupPic && groupPic.startsWith("data:image")) {
            if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
                const uploadRes = await cloudinary.uploader.upload(groupPic, {
                    folder: "group_pics"
                });
                uploadedPicUrl = uploadRes.secure_url;
            } else {
                uploadedPicUrl = groupPic;
            }
        }

        const newGroup = await Group.create({
            name: name.trim(),
            description: description || "",
            groupPic: uploadedPicUrl,
            admin: adminId,
            members
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate("members", "-password")
            .populate("admin", "-password");

        // Notify all online group members via socket to join room & receive group event
        members.forEach((memberId) => {
            const socketId = userSocketMap[memberId.toString()];
            if (socketId) {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (targetSocket) {
                    targetSocket.join(`group:${newGroup._id}`);
                }
                io.to(socketId).emit("newGroup", populatedGroup);
            }
        });

        res.json({ success: true, group: populatedGroup });
    } catch (error) {
        console.error("Create group error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all groups for the logged-in user
export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate("members", "-password")
            .populate("admin", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        // Unseen group message counters
        const unseenGroupMessages = {};
        for (const grp of groups) {
            const count = await Message.countDocuments({
                groupId: grp._id,
                senderId: { $ne: userId },
                seenBy: { $ne: userId }
            });
            unseenGroupMessages[grp._id] = count;
        }

        res.json({ success: true, groups, unseenGroupMessages });
    } catch (error) {
        console.error("Get groups error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get message history for a group
export const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
            return res.json({ success: false, message: "Group not found or you are not a member" });
        }

        const messages = await Message.find({ groupId })
            .populate("senderId", "fullName profilePic email")
            .sort({ createdAt: 1 });

        // Mark messages as seen by this user
        await Message.updateMany(
            { groupId, seenBy: { $ne: userId } },
            { $addToSet: { seenBy: userId } }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Get group messages error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image, audio } = req.body;
        const { id: groupId } = req.params;
        const senderId = req.user._id;

        const group = await Group.findOne({ _id: groupId, members: senderId });
        if (!group) {
            return res.json({ success: false, message: "Group not found or you are not a member" });
        }

        let imageUrl = "";
        if (image) {
            if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
                const uploadResponse = await cloudinary.uploader.upload(image);
                imageUrl = uploadResponse.secure_url;
            } else {
                imageUrl = image;
            }
        }

        let audioUrl = "";
        if (audio) {
            if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
                const uploadResponse = await cloudinary.uploader.upload(audio, {
                    resource_type: "video",
                    folder: "voice_messages"
                });
                audioUrl = uploadResponse.secure_url;
            } else {
                audioUrl = audio;
            }
        }

        const newMessage = await Message.create({
            senderId,
            groupId,
            text,
            image: imageUrl,
            audio: audioUrl,
            seenBy: [senderId]
        });

        // Update group last message and timestamps
        await Group.findByIdAndUpdate(groupId, {
            lastMessage: newMessage._id
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic email");

        // Broadcast to group room
        io.to(`group:${groupId}`).emit("newGroupMessage", populatedMessage);

        res.json({ success: true, newMessage: populatedMessage });
    } catch (error) {
        console.error("Send group message error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

