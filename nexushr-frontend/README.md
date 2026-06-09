# 🚀 SyncWork — Frontend Client 

> The elegant, responsive, and high-performance user interface layer for the SyncWork collaboration ecosystem. Built using React.js and powered by Vite for lightning-fast development and optimized production builds. ✨

---

## ⚡ Key Features Built-In

*   📋 **Dynamic Task Boards:** Interactive Kanban views and sprint managers for agile tracking.
*   🔄 **Real-Time Context Sync:** Immediate visual updates on tasks and team actions without page reloads.
*   🔐 **Secure Route Protection:** Client-side route guarding linked directly with JWT user sessions.
*   📱 **Fluid Responsive Layout:** Pixel-perfect UI design optimized for desktops, tablets, and mobile views.
*   🎨 **Modern Workspace UI:** Minimalist, clean, and interactive dashboard built for high-speed workflows.

---

## 🛠️ Tech Stack & Dependencies

*   ⚛️ **Core Framework:** React.js (Scaffolded with Vite)
*   🎨 **Styling Engine:** Tailwind CSS
*   📡 **API Client:** Axios
*   🔌 **Real-Time Traffic:** WebSockets (STOMP / SockJS client configured for Java Backend integration)

---

## 💻 Local Setup & Installation

Follow these quick steps to spin up the frontend client on your local machine:

### 1️⃣ Clone the Repository
git clone <your-frontend-repo-url>
cd syncwork-frontend

### 2️⃣ Install Dependencies
npm install

### 3️⃣ Setup Environment Variables
Create a `.env` file in the root directory and map your Java backend endpoints:

VITE_BACKEND_API_URL=http://localhost:8080
VITE_WEBSOCKET_URL=ws://localhost:8080/ws

### 4️⃣ Launch Development Server
npm run dev

🚀 Open http://localhost:5173 in your browser to interact with the system!

---

## 📦 Production Deployment Guide (Vercel)

This frontend client is 100% cloud-ready for lightning-fast deployment on Vercel:

1. 🌐 Connect this GitHub repository to your Vercel Dashboard.
2. 🔑 Inject your production environment variables (.env) under Project Settings.
3. ⚙️ Ensure Build Command is set to "npm run build" and Output Directory is set to "dist".
4. 🚀 Hit "Deploy" and go live in seconds!

---
🛠️ Engineered with passion by the SyncWork Founder Team. Clean code, zero technical debt, ready to scale!
