# QuickChat — Real-Time Messaging Application

> **Software Requirements Specification (SRS) & Project Documentation**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features (Functional Requirements)](#3-system-features-functional-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Architecture](#5-system-architecture)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [API Documentation](#7-api-documentation)
8. [Data Models](#8-data-models)
9. [Environment Configuration](#9-environment-configuration)
10. [Installation & Setup](#10-installation--setup)
11. [Deployment](#11-deployment)
12. [Future Enhancements](#12-future-enhancements)
13. [Conclusion](#13-conclusion)

---

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to provide a complete Software Requirements Specification (SRS) and project documentation for **QuickChat**, a full-stack real-time messaging web application. This document describes the functional and non-functional requirements, system architecture, external interfaces, data models, API documentation, environment configuration, and installation instructions for developers, testers, and stakeholders.

### 1.2 Document Conventions

- The words "shall", "must", and "will" indicate mandatory requirements.
- The words "should" and "may" indicate recommended or optional features.
- All API routes are prefixed with `/api` on the backend server.
- File paths are absolute within the project root `/home/tarun/code/chatapp/QuickChat-main`.

### 1.3 Intended Audience

- **Developers** — front-end and back-end engineers implementing or maintaining the system.
- **Testers** — QA engineers validating functional and non-functional behavior.
- **Project Managers / Stakeholders** — for scope, timeline, and requirement traceability.
- **DevOps / Deployment Engineers** — for environment setup and production deployment.

### 1.4 Product Scope

QuickChat is a real-time, one-to-one chat application that enables registered users to:
- Sign up, log in, log out, and recover passwords via email OTP.
- Create and update personal profiles (name, bio, profile picture).
- Browse a list of other registered users with online/offline presence indicators.
- Open a conversation with any user and exchange text messages in real time.
- Send and receive image and voice (audio) messages.
- See message read receipts and unread message counts.
- View shared media in a conversation-specific gallery.

The application is built as a **monorepo** with two separate packages:
- `client/` — React 19 + Vite + Tailwind CSS front-end.
- `server/` — Node.js + Express + Socket.io + MongoDB back-end.

Out of scope for this release: group chats, video calls, file attachments (non-image/audio), message editing/deletion, push notifications, and end-to-end encryption.

### 1.5 References

- React documentation: https://react.dev
- Vite documentation: https://vitejs.dev
- Tailwind CSS documentation: https://tailwindcss.com
- Socket.io documentation: https://socket.io
- Express documentation: https://expressjs.com
- Mongoose documentation: https://mongoosejs.com
- Nodemailer documentation: https://nodemailer.com
- Cloudinary documentation: https://cloudinary.com
- JSON Web Token (jwt) documentation: https://github.com/auth0/node-jsonwebtoken

---

## 2. Overall Description

### 2.1 Product Perspective

QuickChat is a standalone web application. The client is a single-page application (SPA) served via Vite (development) or a static build (production). The server is a Node.js/Express application exposing REST APIs and a WebSocket layer via Socket.io. Data is persisted in MongoDB. Media (images/audio) can be stored either as base64 data URIs (no Cloudinary configured) or uploaded to Cloudinary when credentials are provided. Password-reset emails are sent via SMTP (Mailtrap configured by default) or simulated by printing the OTP to the server console when SMTP is not configured.

The application is container-agnostic and includes `vercel.json` files for both client and server to support deployment on Vercel.

### 2.2 Product Functions

| ID | Function | Description |
|----|----------|-------------|
| F1 | User Signup | Register a new account with fullName, email, password, and bio. |
| F2 | User Login | Authenticate with email and password; receive a JWT token. |
| F3 | User Logout | Clear session token, disconnect socket, and redirect to login. |
| F4 | Auth Check | Validate an existing JWT token and restore the user session. |
| F5 | Password Reset OTP | Request a 6-digit OTP sent to the user's email for password recovery. |
| F6 | Reset Password | Verify OTP and set a new password. |
| F7 | Update Profile | Edit full name, bio, and profile picture (compressed client-side, optionally uploaded to Cloudinary). |
| F8 | List Users | Retrieve all other users with unseen message counts and online status. |
| F9 | Get Messages | Fetch conversation history between the logged-in user and a selected user. |
| F10 | Send Message | Send text, image, and/or audio messages; emitted in real time via Socket.io. |
| F11 | Mark Message Seen | Mark a specific message as read by its ID. |
| F12 | Online Presence | Track connected users via Socket.io and broadcast the online user list to all clients. |
| F13 | Media Gallery | Display all images shared in the current conversation in a side panel. |

### 2.3 User Characteristics

| User Type | Description | Privileges |
|-----------|-------------|------------|
| **Guest / Unauthenticated** | Visitor without a valid JWT token | Can view login/signup pages; cannot access chat or profile. |
| **Registered User** | User with a valid account and JWT token | Full access to chat, profile, messaging, and media gallery. |

### 2.4 Constraints

- **Browser constraint:** Voice recording requires the `MediaRecorder` API and `navigator.mediaDevices.getUserMedia` (secure context / HTTPS in production).
- **Mobile constraint:** Sidebar and RightSidebar are hidden on `max-md` screens; layout adapts via Tailwind responsive classes.
- **File size:** Client-side image upload limited to 25 MB; server body parser limit set to 50 MB.
- **Password:** Minimum length of 6 characters enforced on both client and server.
- **OTP validity:** 15 minutes from generation.
- **Network:** Client must be able to reach the backend URL configured in `VITE_BACKEND_URL`.
- **Database:** MongoDB connection string (`MONGODB_URI`) must be provided.

### 2.5 Assumptions and Dependencies

- MongoDB Atlas (or self-hosted MongoDB) is available and accessible.
- SMTP credentials are optional; if absent, OTPs are printed to the server console.
- Cloudinary credentials are optional; if absent, media is stored as base64 data URIs.
- The client runs on port 5173 (Vite default) in development; the server runs on port 4000.
- CORS is enabled for all origins (`cors({ origin: "*" })`) — suitable for development; restrict in production.
- All users can see and message all other users (no blocking, no friend requests).


---

## 3. System Features (Functional Requirements)

### 3.1 User Authentication

**FR-1.1 Signup**
- **Input:** `fullName`, `email`, `password`, `bio` (all required).
- **Validation:** All fields required; password must be at least 6 characters; email must be unique.
- **Process:** Password hashed with bcrypt (salt rounds = 10); user created in MongoDB; JWT token generated; token returned and stored in `localStorage` under key `"token"`.
- **Endpoint:** `POST /api/auth/signup`
- **Success response:** `{ success: true, userData: User, token: string, message: "Account created successfully" }`

**FR-1.2 Login**
- **Input:** `email`, `password` (both required).
- **Process:** Lookup user by email; compare password with bcrypt; generate JWT; return token and user data.
- **Endpoint:** `POST /api/auth/login`
- **Success response:** `{ success: true, userData: User, token: string, message: "Login successful" }`

**FR-1.3 Logout**
- **Process:** Remove token from `localStorage` and Axios headers; clear socket connection; clear online users; redirect to `/login`.
- **Triggered from:** RightSidebar / Sidebar menu.

**FR-1.4 Auth Check (Session Restore)**
- **Process:** On app mount, if a token exists in `localStorage`, call `GET /api/auth/check`; on success restore `authUser` and connect Socket.io; on failure clear token.

### 3.2 User Profile Management

**FR-2.1 View Profile**
- Route: `/profile` (protected; redirects to `/login` if unauthenticated).
- Displays current `fullName`, `bio`, and `profilePic`.

**FR-2.2 Update Profile**
- **Input:** `fullName`, `bio` (required); optional `profilePic` (image file).
- **Process:** Image compressed client-side via `compressImage()` (max 512×512, quality 0.85); if Cloudinary configured, upload to Cloudinary and store `secure_url`; otherwise store base64. Update MongoDB document.
- **Endpoint:** `PUT /api/auth/update-profile` (protected by `protectRoute`).
- **Success response:** `{ success: true, user: UpdatedUser }`

### 3.3 Contact Discovery & User Listing

**FR-3.1 Get All Users**
- **Endpoint:** `GET /api/messages/users` (protected).
- **Process:** Fetch all users except the logged-in user; for each user count unread messages (`seen: false` where `senderId = user`, `receiverId = me`).
- **Success response:** `{ success: true, users: User[], unseenMessages: { [userId]: number } }`
- Displayed in the **Sidebar** with online/offline badge, search filter, and unread count bubble.

### 3.4 Real-Time Messaging

**FR-4.1 Send Message**
- **Input:** `text` (optional), `image` (base64, optional), `audio` (base64, optional).
- **Image:** Max 25 MB; compressed client-side (max 1200×1200, quality 0.8); uploaded to Cloudinary if configured.
- **Audio:** Recorded via `MediaRecorder` (WebM/Opus); converted to base64; uploaded to Cloudinary (resource_type: "video", folder: "voice_messages") if configured.
- **Endpoint:** `POST /api/messages/send/:receiverId` (protected).
- **Real-time:** After saving, if the receiver is online (`userSocketMap[receiverId]`), emit `newMessage` to the receiver's socket room.
- **Success response:** `{ success: true, newMessage: Message }`

**FR-4.2 Get Conversation**
- **Endpoint:** `GET /api/messages/:userId` (protected).
- **Process:** Fetch messages where the pair is `(senderId=me, receiverId=user)` OR `(senderId=user, receiverId=me)`; mark all messages from the selected user as seen.
- **Success response:** `{ success: true, messages: Message[] }`

**FR-4.3 Receive Real-Time Message**
- Socket event: `newMessage`.
- If the message is from the currently selected user, append to message list and mark as seen via `PUT /api/messages/mark/:messageId`.
- Otherwise, increment the unseen counter for that sender in the Sidebar.

### 3.5 Message Read Status & Unseen Counts

**FR-5.1 Mark Message as Seen**
- **Endpoint:** `PUT /api/messages/mark/:id` (protected).
- **Process:** Set `seen: true` on the message document.
- **Success response:** `{ success: true }`

**FR-5.2 Unseen Message Count**
- Computed server-side in `getUserForSidebar` and maintained client-side in `unseenMessages` state.
- Displayed as a violet badge on the user's row in the Sidebar.

### 3.6 Online Presence Tracking

**FR-6.1 Socket Connection**
- On login/auth-check, client connects to Socket.io with query param `userId`.
- Server stores mapping `userSocketMap[userId] = socket.id`.
- On connect/disconnect, server broadcasts `getOnlineUsers` with `Object.keys(userSocketMap)` to all clients.

**FR-6.2 Online/Offline Indicator**
- Sidebar shows a green "Online" badge if the user's `_id` is in the `onlineUsers` array; otherwise "Offline".
- RightSidebar shows a green dot next to the selected user's name if online.

### 3.7 Media Gallery

**FR-7.1 Media Gallery**
- Located in the **RightSidebar**.
- Extracts all messages with an `image` URL from the current conversation.
- Displays images in a 2-column grid; clicking an image opens it in a new tab.

### 3.8 Password Reset via OTP

**FR-8.1 Send Reset OTP**
- **Input:** `email`.
- **Process:** Verify user exists; generate 6-digit OTP; store `resetOtp` and `resetOtpExpiresAt` (15 minutes) on the user document; send email via nodemailer (or simulate by logging to console).
- **Endpoint:** `POST /api/auth/send-reset-otp`
- **Success response:** `{ success: true, message }`

**FR-8.2 Reset Password**
- **Input:** `email`, `otp`, `newPassword`.
- **Validation:** OTP must match and not be expired; new password min 6 characters.
- **Process:** Hash new password; clear OTP fields; save user.
- **Endpoint:** `POST /api/auth/reset-password`
- **Success response:** `{ success: true, message: "Password reset successful! You can now login" }`


---

## 4. External Interface Requirements

### 4.1 User Interfaces

The front-end is built with **React 19**, **Vite**, and **Tailwind CSS**. Font: "Outfit" (Google Fonts). Custom scrollbars are hidden (`::-webkit-scrollbar { display: none }`).

| Page / Component | Path | Purpose |
|------------------|------|---------|
| **LoginPage** | `client/src/pages/LoginPage.jsx` | Combined Sign up / Login / Forgot Password form with OTP reset flow. |
| **HomePage** | `client/src/pages/HomePage.jsx` | Main layout: Sidebar + ChatContainer + RightSidebar grid. |
| **ProfilePage** | `client/src/pages/ProfilePage.jsx` | Edit profile (name, bio, avatar image). |
| **Sidebar** | `client/src/components/Sidebar.jsx` | User list with search, online/offline status, unread badges, profile/logout menu. |
| **ChatContainer** | `client/src/components/ChatContainer.jsx` | Message list, text input, image attachment, voice recording (MediaRecorder), send UI. |
| **RightSidebar** | `client/src/components/RightSidebar.jsx` | Selected user profile, media gallery, logout button. |
| **App** | `client/src/App.jsx` | Route protection and navigation (`/`, `/login`, `/profile`). |
| **AuthContext** | `client/context/AuthContext.jsx` | Global auth state: token, authUser, onlineUsers, socket, login/logout/updateProfile. |
| **ChatContext** | `client/context/ChatContext.jsx` | Global chat state: messages, users, selectedUser, unseenMessages, getUsers/getMessages/sendMessage. |

UI theme: dark background (`bg-[#110f1e]`), violet/purple gradient accents (`from-purple-400 to-violet-600`), backdrop blur, rounded cards.

### 4.2 Hardware Interfaces

- **Microphone:** Required for voice message recording (`navigator.mediaDevices.getUserMedia({ audio: true })`).
- **Camera / File input:** Optional, for selecting profile picture and image attachments via `<input type="file">`.
- **Display:** Responsive design; collapsible sidebars on screens below `md` breakpoint.

### 4.3 Software Interfaces

| Layer | Technology | Version (from package.json) |
|-------|------------|-----------------------------|
| Client runtime | React | ^19.1.0 |
| Client build tool | Vite | ^6.3.5 |
| Client styling | Tailwind CSS | ^4.1.6 |
| HTTP client | axios | ^1.9.0 |
| Real-time client | socket.io-client | ^4.8.1 |
| Routing | react-router-dom | ^7.6.0 |
| Notifications | react-hot-toast | ^2.5.2 |
| Server runtime | Node.js | (express ^5.1.0) |
| Web framework | Express | ^5.1.0 |
| Real-time server | socket.io | ^4.8.1 |
| ODM | mongoose | ^8.14.3 |
| Password hashing | bcryptjs | ^3.0.2 |
| JWT | jsonwebtoken | ^9.0.2 |
| Email | nodemailer | ^10.2.1 |
| Media storage | cloudinary | ^2.6.1 |
| Dev server | nodemon | ^3.1.10 |
| Linting | ESLint | ^9.25.0 |

### 4.4 Communications Interfaces

**Protocol:** HTTP/1.1 for REST; WebSocket (Socket.io v4) for real-time events.

**Base URL:** `http://localhost:4000` (development), configurable via `VITE_BACKEND_URL`.

**CORS:** Enabled for all origins (`cors()` with `origin: "*"`).

**Authentication:** Bearer-style token sent as custom header `token` (not standard `Authorization` header) on every protected request.

**Request body limits:** 50 MB (JSON and URL-encoded) to accommodate base64 media.


---

## 5. System Architecture

### 5.1 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React + Vite)                   │
│  React 19 · Tailwind CSS 4 · Axios · Socket.io-client       │
│  React Router DOM · React Hot Toast · Vite                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP + WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node + Express)                  │
│  Express · Socket.io · Mongoose · bcryptjs · jsonwebtoken   │
│  Nodemailer · Cloudinary · dotenv · cors                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ MongoDB driver (Mongoose)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (MongoDB)                        │
│  Collections: users, messages                                 │
└─────────────────────────────────────────────────────────────┘
```

Optional external services:
- **Cloudinary** — image/audio storage (returns `secure_url`).
- **SMTP (Mailtrap)** — password-reset email delivery.

### 5.2 Folder Structure

```
/home/tarun/code/chatapp/QuickChat-main/
├── README.md                              <- This document
├── .gitignore
├── client/                                <- Frontend (React + Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env                               <- VITE_BACKEND_URL
│   ├── vercel.json
│   ├── public/
│   │   ├── favicon.svg, vite.svg, bgImage.svg
│   ├── dist/                              <- Production build
│   └── src/
│       ├── main.jsx                       <- Entry point (BrowserRouter + providers)
│       ├── App.jsx                        <- Routes & auth guards
│       ├── index.css                      <- Tailwind + Outfit font
│       ├── assets/
│       │   ├── assets.js                  <- Image imports + dummy data
│       │   └── (images, svgs, icons)
│       ├── lib/
│       │   └── utils.js                   <- formatMessageTime, compressImage
│       ├── context/
│       │   ├── AuthContext.jsx            <- Auth + socket provider
│       │   └── ChatContext.jsx            <- Chat state provider
│       ├── pages/
│       │   ├── LoginPage.jsx              <- Signup / Login / Forgot password
│       │   ├── HomePage.jsx               <- Main chat layout
│       │   └── ProfilePage.jsx            <- Edit profile
│       └── components/
│           ├── Sidebar.jsx                <- User list + search + status
│           ├── ChatContainer.jsx          <- Chat window + voice recorder
│           └── RightSidebar.jsx           <- User profile + media gallery + logout
├── server/                                <- Backend (Node + Express)
│   ├── server.js                          <- Express app + Socket.io + DB connect
│   ├── package.json
│   ├── package-lock.json
│   ├── .env                               <- MONGODB_URI, JWT_SECRET, Cloudinary, SMTP
│   ├── vercel.json
│   ├── lib/
│   │   ├── db.js                          <- Mongoose connection
│   │   ├── utils.js                       <- generateToken (JWT)
│   │   ├── nodemailer.js                  <- SMTP transporter + sendResetOtpEmail
│   │   └── cloudinary.js                  <- Cloudinary config
│   ├── middleware/
│   │   └── auth.js                        <- protectRoute (JWT verification)
│   ├── models/
│   │   ├── User.js                        <- User schema
│   │   └── Message.js                     <- Message schema
│   ├── controllers/
│   │   ├── userController.js              <- signup/login/checkAuth/updateProfile/sendResetOtp/resetPassword
│   │   └── messageController.js           <- getUserForSidebar/getMessages/markMessageAsSenn/sendMessage
│   └── routes/
│       ├── userRoutes.js                  <- /api/auth/*
│       └── messageRoutes.js               <- /api/messages/*
```


### 5.3 Data Flow

1. **App startup:** `client/src/main.jsx` mounts `<BrowserRouter>` → `<AuthProvider>` → `<ChatProvider>` → `<App>`.
2. **Auth restore:** `AuthProvider` checks `localStorage.token`; if present, calls `GET /api/auth/check`; on success connects Socket.io with `userId`.
3. **Login/Signup:** `LoginPage` calls `login('signup'|'login', credentials)`; server validates, hashes password, generates JWT; client stores token and connects socket.
4. **Home:** `HomePage` renders grid; `Sidebar` calls `getUsers()` → `GET /api/messages/users`; listens to socket `getOnlineUsers`.
5. **Open chat:** User clicks a contact → `setSelectedUser` → `ChatContainer` calls `getMessages(userId)` → `GET /api/messages/:id`; socket subscribes to `newMessage`.
6. **Send message:** `ChatContainer` calls `sendMessage({text/image/audio})` → `POST /api/messages/send/:id`; server saves to MongoDB, uploads media to Cloudinary if configured, emits `newMessage` to receiver's socket if online.
7. **Receive message:** Socket `newMessage` handler appends message or increments unseen count; marks as seen via `PUT /api/messages/mark/:id`.
8. **Profile update:** `ProfilePage` compresses image, optionally uploads to Cloudinary, calls `updateProfile()` → `PUT /api/auth/update-profile`.
9. **Password reset:** `LoginPage` (Forgot Password) → `POST /api/auth/send-reset-otp` → server emails/logs OTP → `POST /api/auth/reset-password` → verify OTP, hash new password.

### 5.4 Database Schema

Database name: `chat-app` (configured in `server/lib/db.js`).

#### 5.4.1 Users Collection (`users`)

Defined in `server/models/User.js`:

```js
const userSchema = new mongoose.Schema({
    email:        { type: String, required: true, unique: true },
    fullName:     { type: String, required: true },
    password:     { type: String, required: true, minlength: 6 },
    profilePic:   { type: String, default: "" },
    bio:          { type: String, default: "" },
    resetOtp:     { type: String, default: "" },
    resetOtpExpiresAt: { type: Date, default: null },
}, { timestamps: true });
```

Fields:
- `email` — unique login identifier.
- `fullName` — display name shown in Sidebar and RightSidebar.
- `password` — bcrypt hash.
- `profilePic` — URL (Cloudinary) or base64 data URI.
- `bio` — short user biography.
- `resetOtp` / `resetOtpExpiresAt` — password-reset OTP and expiry.
- `timestamps` — `createdAt`, `updatedAt` auto-managed by Mongoose.

#### 5.4.2 Messages Collection (`messages`)

Defined in `server/models/Message.js`:

```js
const messageSchema = new mongoose.Schema({
    senderId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:        { type: String },
    image:       { type: String },
    audio:       { type: String },
    seen:        { type: Boolean, default: false },
}, { timestamps: true });
```

Fields:
- `senderId` / `receiverId` — references to `User` collection.
- `text` — message text (nullable if media-only).
- `image` — image URL (Cloudinary `secure_url` or base64).
- `audio` — audio URL (Cloudinary `secure_url` or base64).
- `seen` — read receipt flag; set to `true` when recipient opens the conversation or marks individually.
- `timestamps` — `createdAt`, `updatedAt`.


---

## 6. Non-Functional Requirements

### 6.1 Performance

- **NFR-1:** Client-side image compression before upload to reduce payload size (profile: 512×512 @ 0.85; chat image: 1200×1200 @ 0.8).
- **NFR-2:** Voice messages recorded as WebM/Opus for efficient audio compression.
- **NFR-3:** Socket.io used for real-time message delivery instead of polling.
- **NFR-4:** Page transitions handled client-side (React Router) for fast navigation.

### 6.2 Security

- **NFR-5:** Passwords hashed with bcrypt (salt rounds = 10) before storage.
- **NFR-6:** JWT used for stateless authentication; token stored in `localStorage` and sent via custom `token` header.
- **NFR-7:** Protected routes (`/api/auth/check`, `/api/auth/update-profile`, all `/api/messages/*`) require valid JWT via `protectRoute` middleware.
- **NFR-8:** OTP expired after 15 minutes; OTP cleared after successful reset.
- **NFR-9:** CORS enabled (currently `origin: "*"` — restrict to trusted domains in production).
- **NFR-10:** Request body size capped at 50 MB; server returns 413 for oversized payloads.

### 6.3 Reliability

- **NFR-11:** OTP email delivery falls back to console logging when SMTP is not configured (simulated delivery).
- **NFR-12:** Media upload falls back to base64 storage when Cloudinary is not configured.
- **NFR-13:** Socket disconnect handled; `userSocketMap` entry removed and online list rebroadcast.
- **NFR-14:** Error boundaries via try/catch with `react-hot-toast` user-facing error messages.

### 6.4 Usability

- **NFR-15:** Responsive layout: 3-column grid on desktop, stacked on mobile; sidebars hidden below `md` breakpoint.
- **NFR-16:** Toast notifications for success/error states (sent OTP, login failures, profile updates, etc.).
- **NFR-17:** Online/offline presence indicators help users know who is available.
- **NFR-18:** Search bar in Sidebar to filter contacts by name.
- **NFR-19:** Unread message badges draw attention to new conversations.

### 6.5 Scalability

- **NFR-20:** `userSocketMap` is in-memory — suitable for a single server instance; for multi-instance deployment, replace with Redis adapter (Socket.io Redis adapter).
- **NFR-21:** MongoDB can scale via sharding; indexes not yet defined (add indexes on `email`, `senderId`, `receiverId`, `seen` for production scale).
- **NFR-22:** Media offloaded to Cloudinary reduces server storage load.

### 6.6 Maintainability

- **NFR-23:** Separation of concerns: routes → controllers → models → lib utilities.
- **NFR-24:** React Context API for global state (Auth + Chat) reduces prop drilling.
- **NFR-25:** Centralized error-handling middleware in `server.js`.
- **NFR-26:** ESLint configured with React hooks and refresh rules.
- **NFR-27:** Environment variables in `.env` files for config separation.

### 6.7 Portability

- **NFR-28:** Runs on any platform supporting Node.js (Linux, macOS, Windows).
- **NFR-29:** Vercel configuration files (`vercel.json`) included for both client and server.
- **NFR-30:** Client build output in `client/dist`; server entry `server/server.js`.


---

## 7. API Documentation

All routes are mounted under the Express app in `server/server.js`:

```js
app.use("/api/auth",  userRouter);   // server/routes/userRoutes.js
app.use("/api/messages", messageRouter); // server/routes/messageRoutes.js
app.use("/api/status", (req, res) => res.send("Server is live"));
```

### 7.1 Authentication Routes

| Method | Endpoint | Description | Auth Required | Body |
|--------|----------|-------------|---------------|------|
| POST | `/api/auth/signup` | Register new user | No | `{ fullName, email, password, bio }` |
| POST | `/api/auth/login` | Authenticate user | No | `{ email, password }` |
| GET | `/api/auth/check` | Verify session / restore user | Yes (header `token`) | — |
| PUT | `/api/auth/update-profile` | Update name, bio, avatar | Yes | `{ fullName, bio, profilePic? }` |
| POST | `/api/auth/send-reset-otp` | Send password-reset OTP to email | No | `{ email }` |
| POST | `/api/auth/reset-password` | Verify OTP and set new password | No | `{ email, otp, newPassword }` |

### 7.2 Message Routes

| Method | Endpoint | Description | Auth Required | Params / Body |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/messages/users` | List users + unseen counts | Yes | — |
| GET | `/api/messages/:id` | Get conversation with user | Yes | `id` = receiver user ID |
| PUT | `/api/messages/mark/:id` | Mark message as seen | Yes | `id` = message ID |
| POST | `/api/messages/send/:id` | Send text/image/audio message | Yes | `id` = receiver ID; body `{ text?, image?, audio? }` |

### 7.3 Socket.io Events

**Server → Client:**

| Event | Data | Description |
|-------|------|-------------|
| `getOnlineUsers` | `string[]` | Array of online user IDs; emitted on connect/disconnect. |
| `newMessage` | `Message` | New message object; sent to receiver's socket room if online. |

**Client → Server:**

- Connection query: `{ userId: string }` passed via `io(url, { query: { userId } })`.
- No custom client-emitted events; messaging uses REST POST + server-emitted socket broadcast.

### 7.4 Response Format

All API responses follow this envelope:

```json
{
  "success": boolean,
  "message": "string (optional)",
  "userData": User | null,      // signup/login
  "token": "string",             // signup/login
  "user": User,                  // check/update-profile
  "users": User[],               // /users
  "unseenMessages": { [userId]: number },
  "messages": Message[],         // /:id
  "newMessage": Message          // send
}
```

Error responses:
```json
{ "success": false, "message": "error description" }
```

### 7.5 Request/Response Examples

**Signup**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "Alice Smith",
  "email": "alice@example.com",
  "password": "secure123",
  "bio": "Hello, I am using QuickChat"
}
```

```json
{
  "success": true,
  "userData": { "_id": "...", "fullName": "Alice Smith", "email": "alice@example.com", "bio": "...", "profilePic": "" },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Account created successfully"
}
```

**Send message**
```http
POST /api/messages/send/680f50e4f10f3cd28382ecf9
Headers: token: <jwt>
Content-Type: application/json

{
  "text": "Hello there!",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

```json
{
  "success": true,
  "newMessage": {
    "_id": "...",
    "senderId": "...",
    "receiverId": "...",
    "text": "Hello there!",
    "image": "https://res.cloudinary.com/...",
    "audio": null,
    "seen": false,
    "createdAt": "2025-...",
    "updatedAt": "2025-..."
  }
}
```

**Get online users (socket)**
```js
// Emitted by server to all clients on connect/disconnect
socket.on("getOnlineUsers", (userIds) => {
  // userIds = ["680f50aa...", "680f50e4..."]
});
```


---

## 8. Data Models

### 8.1 User Model

File: `server/models/User.js`

```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    resetOtp: { type: String, default: "" },
    resetOtpExpiresAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
```

### 8.2 Message Model

File: `server/models/Message.js`

```js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    image: { type: String },
    audio: { type: String },
    seen: { type: Boolean, default: false },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
```

---

## 9. Environment Configuration

### 9.1 Server (.env)

File: `server/.env`

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@cluster.mongodb.net` | MongoDB connection string |
| `JWT_SECRET` | `asdfgvvhhvhx` | Secret for signing JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | `rbta92wn` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `965735861445117` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `CfjQ6oB32nSpM9-3Jb2CVAwcDeE` | Cloudinary API secret |
| `CLOUDINARY_URL` | `cloudinary://...` | Full Cloudinary URL |
| `SMTP_HOST` | `sandbox.smtp.mailtrap.io` | SMTP host (Mailtrap) |
| `SMTP_PORT` | `2525` | SMTP port |
| `SMTP_USER` | `45b187d5e79526` | SMTP username |
| `SMTP_PASS` | `47d5c5c1b98bc8` | SMTP password |

### 9.2 Client (.env)

File: `client/.env`

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:4000` | Backend base URL for Axios and Socket.io |

> **Note:** `.env` files are listed in `.gitignore` and must be created manually per environment. Production values should be set via the hosting provider's environment variable settings (e.g., Vercel project settings).


---

## 10. Installation & Setup

### 10.1 Prerequisites

- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)
- **MongoDB** database (MongoDB Atlas cluster or local MongoDB)
- Optional: **Cloudinary** account (for media storage)
- Optional: **SMTP** credentials (for real password-reset emails; Mailtrap sandbox works for testing)

### 10.2 Backend Setup

```bash
# 1. Navigate to the server directory
cd /home/tarun/code/chatapp/QuickChat-main/server

# 2. Install dependencies
npm install

# 3. Create the environment file
# Edit server/.env with your MONGODB_URI, JWT_SECRET, Cloudinary, and SMTP values

# 4. Start the development server
npm run server     # uses nodemon
# or
npm start          # uses node
```

The server will run on `http://localhost:4000` (or the `PORT` environment variable).

### 10.3 Frontend Setup

```bash
# 1. Navigate to the client directory
cd /home/tarun/code/chatapp/QuickChat-main/client

# 2. Install dependencies
npm install

# 3. Create the environment file
# Edit client/.env and set:
# VITE_BACKEND_URL = http://localhost:4000

# 4. Start the development server
npm run dev        # Vite dev server, typically http://localhost:5173
```

### 10.4 Running the Application

1. Start the backend server (step 10.2).
2. Start the frontend dev server (step 10.3).
3. Open `http://localhost:5173` in your browser.
4. Sign up for a new account (or open two browsers/incognito windows for two users).
5. Start chatting — send text, images, or voice messages in real time.


---

## 11. Deployment

### 11.1 Vercel Configuration

**Client:** `client/vercel.json` — rewrites all routes to `/` for SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Server:** `server/vercel.json` — deploys `server.js` as a Vercel Node function:

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node", "config": { "includeFiles": ["dist/**"] } }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ]
}
```

To deploy:
1. Push the repository to GitHub.
2. Import `client` and `server` as separate Vercel projects (or use a monorepo setup).
3. Add environment variables in Vercel project settings (`MONGODB_URI`, `JWT_SECRET`, `VITE_BACKEND_URL`, Cloudinary, SMTP).
4. Set `VITE_BACKEND_URL` to your deployed server URL on the client project.

---

## 12. Future Enhancements

The following features are identified as candidates for future releases:

- **Group chats** — multi-user conversations with group metadata.
- **Message editing & deletion** — edit sent messages or delete for everyone.
- **End-to-end encryption** — client-side encryption so the server cannot read message content.
- **Push notifications** — web push or mobile push for offline users.
- **File attachments** — support for documents, videos, and other file types beyond images/audio.
- **Reactions & read receipts** — emoji reactions and detailed read status.
- **Online status persistence** — store last-seen timestamps in the database.
- **Socket.io Redis adapter** — support for multiple server instances.
- **Database indexes** — add indexes on `email`, `senderId`, `receiverId`, `seen` for query performance.
- **TypeScript** — migrate JavaScript codebase to TypeScript for type safety.
- **Unit/integration tests** — add Jest/Vitest tests for controllers and components.
- **Dockerization** — Dockerfiles and docker-compose for containerized deployment.
- **Rate limiting** — protect auth endpoints against brute-force and OTP abuse.
- **Password strength policy** — enforce stronger password requirements.
- **Account deletion / deactivation** — allow users to delete their accounts.

---

## 13. Conclusion

QuickChat is a complete, full-stack real-time messaging application demonstrating modern web development practices: React 19 with Vite and Tailwind CSS on the front end; Node.js, Express, Socket.io, and Mongoose on the back end; MongoDB for data persistence; JWT for authentication; bcrypt for password hashing; nodemailer for OTP email delivery; and Cloudinary for optional media storage.

This document serves as the single source of truth for the project's requirements, architecture, API contract, data models, environment configuration, and setup instructions. It can be used by developers for implementation, by testers for validation, and by stakeholders for scope and progress tracking.

---

*Document generated for the QuickChat project at `/home/tarun/code/chatapp/QuickChat-main`.*

