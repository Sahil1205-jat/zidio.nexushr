import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, Users, Clock, CalendarDays, Megaphone, ClipboardCheck,
  Banknote, BarChart, ListTodo, User, LogOut, MessageSquare, X, Menu,
  Sparkles,
} from "lucide-react";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from "react-hot-toast";

import StaffDirectory from "./StaffDirectory"; 
import Attendance from "./Attendance"; 
import LeaveManagement from "./LeaveManagement"; 
import NoticeBoard from "./NoticeBoard";
import Chat from "./Chat";
import Tasks from "./Tasks";
import Payroll from "./Payroll";
import Analytics from "./Analytics";
import Profile from "./Profile";
import PerformanceReviews from "./PerformanceReviews";
import AIAssistant from "./AIAssistant";
 
// --- Chat Data Structures ---
interface ChatMessage {
  id: string | number;
  sender: string;
  content: string;
  timestamp: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("directory");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);
  // Memoize user details to prevent re-renders from causing WebSocket reconnects
  const userRole = useMemo(() => localStorage.getItem("user_role") || "EMPLOYEE", []);
  const userDepartment = useMemo(() => localStorage.getItem("user_department") || "General", []);
  const userName = useMemo(() => localStorage.getItem("user_name") || "User", []);
  const isAdmin = useMemo(() => userRole === "ADMIN", [userRole]);

  const stompClientRef = useRef<Client | null>(null);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>({});
  const [isWsConnected, setIsWsConnected] = useState(false);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const navItems = [
    { id: "directory", label: "Staff Directory", icon: Users },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "leaves", label: "Leaves", icon: CalendarDays },
    { id: "notices", label: "Notice Board", icon: Megaphone },
    { id: "chat", label: "Group Chat", icon: MessageSquare },
    { id: "performance", label: "Performance", icon: ClipboardCheck },
    { id: "tasks", label: "Project Tasks", icon: ListTodo },
    { id: "payroll", label: "Payroll", icon: Banknote },
    { id: "analytics", label: "Analytics", icon: BarChart },
    { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
    { id: "profile", label: "My Profile", icon: User },
  ];

  // Mock list of all departments for Admin view. In a real app, this would come from an API.
  const ALL_DEPARTMENTS = ['General', 'Engineering', 'IT', 'Sales', 'HR', 'Finance'];

  // --- WebSocket and Notification Logic ---
  useEffect(() => {
    // This function fetches the entire chat history from a single endpoint
    // and groups messages by their department channel.
    const fetchAllHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/chat/history`);
        if (res.ok) {
          const history: (ChatMessage & { department?: string })[] = await res.json();
          
          // Group messages by department/channel
          const messagesGroupedByChannel = history.reduce((acc, msg) => {
            const channel = msg.department || 'General'; // Fallback to 'General'
            if (!acc[channel]) {
              acc[channel] = [];
            }
            acc[channel].push(msg);
            return acc;
          }, {} as Record<string, ChatMessage[]>);

          // Sort messages within each channel by timestamp
          for (const channel in messagesGroupedByChannel) {
            messagesGroupedByChannel[channel].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          }

          // Use functional update to merge history with any messages that arrived in the meantime.
          // This prevents a race condition where a new message appears and then disappears
          // when the history fetch completes.
          setMessagesByChannel(prevMessages => {
            const newState = { ...prevMessages };
            for (const channel in messagesGroupedByChannel) {
              const existingMessages = newState[channel] || [];
              const existingIds = new Set(existingMessages.map(m => String(m.id)));
              const newHistory = messagesGroupedByChannel[channel].filter(
                hMsg => !existingIds.has(String(hMsg.id))
              );
              if (newHistory.length > 0) {
                newState[channel] = [...existingMessages, ...newHistory]
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              }
            }
            return newState;
          });
          console.log(`[History] Fetched and processed all chat history.`);
        } else {
          console.error(`[History] Failed to fetch master history: ${res.status}`);
        }
      } catch (error) {
        console.error(`[History] Error fetching master history:`, error);
      }
    };

    fetchAllHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/ws-chat`),
      onConnect: () => {
        console.log("Dashboard WebSocket Connected!");
        setIsWsConnected(true);

        const handleNewMessage = (payload: any, topicChannel: string) => {
          try {
            const receivedMessage: ChatMessage & { department?: string } = JSON.parse(payload.body);

            // --- IMPORTANT ---
            // This logic determines which channel the message belongs to.
            // 1. It first looks for a 'department' field inside the message data itself.
            // 2. If that's missing, it falls back to the name of the topic it was received on.
            //
            // If messages are going to the wrong channel, it's likely because the backend
            // is sending to the wrong topic AND not including the 'department' field in the message.
            const targetChannel = receivedMessage.department || topicChannel;

            console.log(`[WebSocket] New Message Received. Topic: #${topicChannel}, Payload Department: ${receivedMessage.department || 'N/A'}. Final Target Channel: #${targetChannel}`);
            console.log('[WebSocket] Full Payload:', payload.body);
            
            // Basic validation
            if (!receivedMessage.id || !receivedMessage.sender) {
              console.error('[WebSocket] Invalid message received (missing id or sender):', receivedMessage);
              return;
            }

            setMessagesByChannel(prev => {
              const currentMessages = prev[targetChannel] || [];
              // Prevent duplicate messages by checking ID
              if (currentMessages.some(msg => String(msg.id) === String(receivedMessage.id))) {
                console.warn(`[WebSocket] Duplicate message ID ${receivedMessage.id} received. Ignoring.`);
                return prev;
              }
              const newChannelMessages = [...currentMessages, receivedMessage]
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              console.log(`[State] Adding message. Channel #${targetChannel} now has ${newChannelMessages.length} messages.`);
              return {
                ...prev,
                [targetChannel]: newChannelMessages,
              };
            });

            if (activeTabRef.current !== 'chat' && receivedMessage.sender !== userName) {
              toast.custom((t) => (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`max-w-md w-full bg-slate-800 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-slate-700`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white">{(receivedMessage.sender || "?").charAt(0)}</div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-white">{receivedMessage.sender} <span className="font-normal text-slate-400">in #{targetChannel}</span></p>
                      <p className="mt-1 text-sm text-slate-300 line-clamp-1">{receivedMessage.content}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-slate-700">
                  <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-cyan-500 hover:text-cyan-400 focus:outline-none">
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            ), { position: 'top-right' });
            }
          } catch (error) {
            console.error("Failed to parse incoming message:", payload.body, error);
          }
        };

        const handleDeleteMessage = (payload: any, topicChannel: string) => {
          try {
            console.log(`[WebSocket] Received delete confirmation on topic #${topicChannel}:`, payload.body);
            let messageIdToDelete;
            let targetChannel;
            try {
              const parsed = JSON.parse(payload.body);
              messageIdToDelete = parsed?.id ?? parsed;
              targetChannel = parsed?.department || topicChannel;
            } catch (e) {
              // If JSON parsing fails, assume the body is the raw ID string itself.
              messageIdToDelete = payload.body;
              targetChannel = topicChannel;
            }

            if (messageIdToDelete && targetChannel) {
                console.log(`[State] Server confirmed delete for message ID ${messageIdToDelete} in channel #${targetChannel}.`);
                // This will ensure consistency if the optimistic update was not used or failed.
                setMessagesByChannel(prev => ({
                    ...prev,
                    [targetChannel]: prev[targetChannel]?.filter(msg => String(msg.id) !== String(messageIdToDelete)) ?? [],
                }));
            } else {
              console.warn('[WebSocket] Delete request received without a message ID.');
            }
          } catch (error) {
            console.error("Failed to parse delete message:", payload.body, error);
          }
        };

        const channelsToSubscribe = isAdmin ? ALL_DEPARTMENTS : [userDepartment];
        channelsToSubscribe.forEach(dept => {
          client.subscribe(`/topic/chat/${dept}`, (payload) => handleNewMessage(payload, dept));
          client.subscribe(`/topic/chat.delete/${dept}`, (payload) => handleDeleteMessage(payload, dept));
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        setIsWsConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Disconnect on component unmount
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        console.log("Dashboard WebSocket Disconnected.");
        stompClientRef.current = null;
        setIsWsConnected(false);
      }
    };
    // The empty dependency array [] ensures this effect runs only once when the
    // component mounts. This creates a stable, persistent WebSocket connection
    // for the entire dashboard session, preventing messages from being lost.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fallback Polling when WebSocket is disconnected (Self-Healing Mode) ---
  useEffect(() => {
    if (isWsConnected) return;

    const fetchAllHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/chat/history`);
        if (res.ok) {
          const history: (ChatMessage & { department?: string })[] = await res.json();
          
          // Group messages by department/channel
          const messagesGroupedByChannel = history.reduce((acc, msg) => {
            const channel = msg.department || 'General';
            if (!acc[channel]) {
              acc[channel] = [];
            }
            acc[channel].push(msg);
            return acc;
          }, {} as Record<string, ChatMessage[]>);

          // Sort messages within each channel by timestamp
          for (const channel in messagesGroupedByChannel) {
            messagesGroupedByChannel[channel].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          }

          setMessagesByChannel(messagesGroupedByChannel);
        }
      } catch (error) {
        console.warn("[Polling] Failed to poll chat history:", error);
      }
    };

    // Run immediately and then every 3 seconds for continuous updates
    fetchAllHistory();
    const interval = setInterval(fetchAllHistory, 3000);

    return () => clearInterval(interval);
  }, [isWsConnected]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      {/* MOBILE BACKDROP Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`
        /* Base Desktop styles (completely untouched layout) */
        hidden md:flex flex-col bg-black/20 border-r border-white/10 backdrop-blur-2xl transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-24'}
        
        /* Mobile styles (slides drawer overlay) */
        fixed md:relative inset-y-0 left-0 w-72 bg-[#0d1527] md:bg-transparent border-r border-white/10 z-[999] md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0
        ${isMobileOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}
      `}>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 border-b border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              {(isSidebarOpen || isMobileOpen) && <h1 className="text-2xl font-black italic tracking-tighter text-white">NEXUSHR</h1>}
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:block p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              {/* Mobile Close Button */}
              <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            {(isSidebarOpen || isMobileOpen) && (
              <span className={`mt-4 inline-block text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded border ${
                userRole === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>
                {userRole} PORTAL
              </span>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${(isSidebarOpen || isMobileOpen) ? '' : 'justify-center' } ${
                  activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              > 
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {(isSidebarOpen || isMobileOpen) && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => {
              setActiveTab('profile');
              setMobileOpen(false);
            }}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 mb-2 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors ${(isSidebarOpen || isMobileOpen) ? '' : 'justify-center'}`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white">
              {(userName || "?").charAt(0)}
            </div>
            {(isSidebarOpen || isMobileOpen) && (
              <div className="truncate text-left">
                <p className="text-xs font-black text-white truncate">{userName}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">View Profile</p>
              </div>
            )}
          </button>
          <button onClick={() => {localStorage.clear(); window.location.href="./Login"}} className={`w-full flex items-center justify-center gap-2 py-3 text-rose-500 font-bold hover:bg-rose-500/10 rounded-xl transition-all`}>
            <LogOut size={18} />
            {(isSidebarOpen || isMobileOpen) && 'Logout'}
          </button>
        </div>
      </aside>

      {/* CONTENT AREA WITH ANIMATION */}
      <main className="flex-1 overflow-y-auto bg-[#020617] relative flex flex-col">
        {/* MOBILE TOP BAR HEADER (Only visible on mobile) */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-white/10 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-black italic tracking-tighter text-white">NEXUSHR</span>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${
            userRole === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
          }`}>
            {userRole}
          </span>
        </div>

        {/* BACKGROUND DECORATIVE ELEMENTS */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20rem] left-[-20rem] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10rem] right-[-15rem] w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>
            <div className="absolute top-[10rem] right-[5rem] w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
            transition={{ duration: 0.3 }} className="relative z-10"
          >
            {activeTab === "directory" && <StaffDirectory />}
            {activeTab === "attendance" && <Attendance />}
            {activeTab === "leaves" && <LeaveManagement />}
            {activeTab === "notices" && <NoticeBoard />}
            {activeTab === "chat" && <Chat
              
              isWsConnected={isWsConnected}
              stompClient={stompClientRef.current}
              messagesByChannel={messagesByChannel}
              isAdmin={isAdmin}
              userDepartment={userDepartment}
              allDepartments={ALL_DEPARTMENTS}
            />}
            {activeTab === "performance" && <PerformanceReviews />}
            {activeTab === "tasks" && <Tasks />}
            {activeTab === "payroll" && <Payroll />}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "ai-assistant" && <AIAssistant />}
            {activeTab === "profile" && <Profile />}
           
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}