# QuickChat — Real-Time Messaging Application

## Overview

QuickChat is a full-stack, real-time one-to-one messaging web application. It allows registered users to communicate instantly through text, images, and voice messages, with presence indicators, read receipts, and profile management.

## Features and Functions

### User Authentication
- **Account Registration** — New users can sign up by providing a full name, email address, password (minimum 6 characters), and a short bio.
- **User Login** — Registered users can log in using their email and password.
- **Session Persistence** — The app checks for an existing authentication token on load to restore the user's session without requiring re-login.
- **Logout** — Users can log out from the sidebar or right sidebar, which clears the session and disconnects the real-time connection.

### Password Recovery
- **Forgot Password** — Users can request a password reset by entering their registered email address.
- **OTP Delivery** — A 6-digit one-time password is generated and sent to the user's email for verification.
- **Password Reset** — After verifying the OTP (valid for 15 minutes), users can set a new password and regain access to their account.

### User Profile Management
- **Profile Viewing** — Users can view their own profile details, including name, bio, and profile picture.
- **Profile Editing** — Users can update their full name, bio, and profile picture. Profile images are compressed before upload to optimize performance.
- **Avatar Display** — Profile pictures are shown next to the user's name in the chat interface, sidebar, and conversation header.

### Contact Discovery
- **User List** — A sidebar displays all other registered users so users can find and start conversations.
- **Online Presence** — Each contact shows an online or offline status indicator based on their real-time connection.
- **Search** — A search box in the sidebar lets users filter contacts by name.
- **Unread Message Badges** — A badge appears on a contact's row when they have sent unread messages, showing the count of unseen messages.

### Real-Time Messaging
- **Text Messaging** — Users can send and receive text messages instantly in a one-to-one conversation.
- **Image Messaging** — Users can attach and send images (up to 25 MB) within a conversation. Images are compressed before sending and displayed inline in the chat.
- **Voice Messaging** — Users can record and send voice messages using their device's microphone. Recordings are captured as audio and sent as playable voice messages.
- **Instant Delivery** — Messages are delivered in real time using WebSocket connections, so recipients see new messages immediately when they are online.
- **Conversation History** — Opening a contact loads the full message history between the two users.
- **Read Receipts** — Messages are marked as seen when the recipient opens the conversation or views the message.
- **Auto-scroll** — The chat window automatically scrolls to the latest message when new messages arrive.

### Conversation Interface
- **Three-Panel Layout** — The main chat view consists of a contacts sidebar, a central message area, and a right-side information panel.
- **Selected Contact View** — Choosing a contact opens their conversation, showing their profile picture, name, bio, and online status.
- **Media Gallery** — The right panel displays a gallery of all images shared in the current conversation. Clicking an image opens it in a new tab.
- **Logout Button** — Accessible from the right panel for quick sign-out.

### User Interface
- **Responsive Design** — The layout adapts to different screen sizes, with sidebars collapsing on smaller screens (mobile/tablet).
- **Dark Theme** — The application uses a dark-colored theme with violet/purple gradient accents for buttons and interactive elements.
- **Toast Notifications** — Success and error messages appear as non-intrusive toast notifications (e.g., for login failures, message sends, profile updates).
- **Custom Scrollbars** — Scrollbars are hidden for a cleaner visual appearance.
