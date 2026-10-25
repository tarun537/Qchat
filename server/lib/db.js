import mongoose from "mongoose";

// Function to connect to the database
export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"));

        let uri = (process.env.MONGODB_URI || "").trim();
        if (!uri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        const dbName = "chat-app";

        // Normalize URI to avoid double slashes or malformed namespaces
        if (uri.includes("?")) {
            const [base, query] = uri.split("?");
            const cleanBase = base.replace(/\/+$/, "");
            const parts = cleanBase.split("/");
            if (parts.length <= 3) {
                uri = `${cleanBase}/${dbName}?${query}`;
            } else {
                uri = `${cleanBase}?${query}`;
            }
        } else {
            const cleanUri = uri.replace(/\/+$/, "");
            const parts = cleanUri.split("/");
            if (parts.length <= 3) {
                uri = `${cleanUri}/${dbName}`;
            } else {
                uri = cleanUri;
            }
        }

        await mongoose.connect(uri);
    } catch (error) {
        console.log("Database Connection Error:", error);
    }
};
