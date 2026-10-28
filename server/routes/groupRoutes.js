import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    createGroup,
    getMyGroups,
    getGroupMessages,
    sendGroupMessage
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/create", protectRoute, createGroup);
groupRouter.get("/my-groups", protectRoute, getMyGroups);
groupRouter.get("/:id/messages", protectRoute, getGroupMessages);
groupRouter.post("/:id/send", protectRoute, sendGroupMessage);

export default groupRouter;

