import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Users, Search, Trash2 } from "lucide-react";
import { Client } from '@stomp/stompjs';

// --- Data Structures ---
interface ChatMessage {
  id: string | number;
  sender: string;
  content: string;
  timestamp: string;
}

interface ChatProps {
  isWsConnected: boolean;
  stompClient: Client | null;
  messagesByChannel: Record<string, ChatMessage[]>;
  isAdmin: boolean;
  userDepartment: string;
  allDepartments: string[];
}

export default function Chat({ isWsConnected, stompClient, messagesByChannel, isAdmin, userDepartment, allDepartments }: ChatProps) {
  const channels = isAdmin ? allDepartments : [userDepartment];
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [message, setMessage] = useState('');
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const userName = localStorage.getItem("user_name") || "Anonymous";

  // --- Scroll to bottom of chat ---
  const scrollToBottom = () => {
    setTimeout(() => {
      chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // --- Auto-scroll when new messages arrive or channel changes ---
  useEffect(() => {
    scrollToBottom();
  }, [messagesByChannel, activeChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;

    const chatMessage = {
      sender: userName,
      content: message,
      timestamp: new Date().toISOString(),
      department: activeChannel, // Include department for backend routing
    };

    if (isWsConnected && stompClient) {
      stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage),
      });
    } else {
      // Self-healing HTTP REST fallback
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatMessage)
      }).catch(err => console.error("[HTTP Fallback] Send failed:", err));
    }

    setMessage('');
  };

  const handleUnsendMessage = (messageId: string | number) => {
    if (!messageId) {
      console.error("Cannot unsend message without ID.");
      return;
    }

    if (isWsConnected && stompClient) {
      // Publish a delete request to the backend WebSocket topic.
      stompClient.publish({
        destination: '/app/chat.deleteMessage',
        body: JSON.stringify({ id: messageId, department: activeChannel }),
      });
    } else {
      // Self-healing HTTP REST fallback
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/chat/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, department: activeChannel })
      }).catch(err => console.error("[HTTP Fallback] Delete failed:", err));
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 lg:p-10 font-sans text-slate-200 h-full flex flex-col">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex-shrink-0 w-full">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-black text-white flex items-center gap-3 italic">
              <MessageSquare className="w-10 h-10 text-cyan-500" /> Group Chat
            </h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Team Collaboration</p>
          </div>
        </motion.div>
      </div>

      {/* CHAT LAYOUT */}
      <div className="flex-1 max-w-7xl w-full mx-auto bg-black/20 border-white/10 rounded-[2.5rem] flex overflow-hidden shadow-2xl backdrop-blur-lg">
        {/* Sidebar */}
        <aside className="w-1/3 md:w-1/4 bg-black/10 border-r border-white/10 p-6 flex flex-col">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Users size={20}/> Channels</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input placeholder="Search channels..." className="w-full bg-white/5 border-white/10 text-white rounded-xl p-2 pl-10 text-sm outline-none focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-400" />
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {channels.map(channel => (
              <button
                key={channel}
                onClick={() => setActiveChannel(channel)}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-bold transition-all text-sm ${
                  activeChannel === channel
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                # {channel}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col">
          {/* Message display area */}
          <div ref={chatBoxRef} className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {(messagesByChannel[activeChannel] || []).map((msg) => (
                <div key={msg.id} className={`group flex items-center gap-3 ${msg.sender === userName ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${msg.sender === userName ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    {(msg.sender || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-lg ${msg.sender === userName ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-slate-300 rounded-bl-none'}`}>
                    <div className="flex items-baseline gap-3">
                      <p className="font-bold text-sm">{msg.sender}</p>
                      <p className={`text-xs ${msg.sender === userName ? 'text-blue-200' : 'text-slate-400'}`}>{formatTime(msg.timestamp)}</p>
                    </div>
                    <p className="mt-1">{msg.content}</p>
                  </div>
                  {/* Unsend Button for own messages */}
                  {msg.sender === userName && (
                    <button
                      onClick={() => handleUnsendMessage(msg.id)}
                      className="p-2 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 hover:bg-rose-500/10"
                      title="Unsend message"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message input form */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message in #${activeChannel}...`}
                className="flex-1 bg-white/5 border-white/10 text-white rounded-xl p-4 outline-none focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-400"
              />
              <button type="submit" className="w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-cyan-600/20 disabled:bg-slate-700 disabled:shadow-none" disabled={message.trim() === ''}>
                <Send size={24} />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}