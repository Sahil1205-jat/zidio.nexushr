import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Bell, Trash2, Clock, X } from "lucide-react";
import toast from "react-hot-toast";

export default function NoticeBoard() {
  const [notices, setNotices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", content: "" });

  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const isAdmin = userRole === "ADMIN";

  // 1. Fetch Notices
  const fetchNotices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notices`);
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  // 2. Add Notice
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotice)
      });

      if (res.ok) {
        toast.success("Notice Posted & Emails Sent!");
        setNewNotice({ title: "", content: "" });
        setShowForm(false);
        fetchNotices();
      }
    } catch (error) {
      toast.error("Failed to post notice");
    } finally {
      setLoading(false);
    }
  };

  // 3. 🔥 DELETE NOTICE LOGIC
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you really want to delete this Notice?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notices/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Notice deleted successfully!");
        // State update taaki turant UI se gayab ho jaye
        setNotices(notices.filter(n => n.id !== id));
      } else {
        toast.error("Delete failed!");
      }
    } catch (error) {
      toast.error("Server connection error");
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto text-slate-200">
      
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white italic flex items-center gap-3">
            <Megaphone className="text-blue-500" size={36} /> Notice Board
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Official Announcements</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all"
          >
            {showForm ? <X size={24}/> : <Plus size={24}/>}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddNotice}
            className="bg-black/20 border-white/10 rounded-[2.5rem] p-8 mb-10 space-y-4 overflow-hidden backdrop-blur-lg"
          >
            <input 
              required
              placeholder="Notice Title"
              value={newNotice.title}
              onChange={e => setNewNotice({...newNotice, title: e.target.value})}
              className="w-full bg-white/5 border-white/10 text-white rounded-2xl p-4 font-bold outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-400"
            />
            <textarea 
              required
              rows={4}
              placeholder="Write your announcement here..."
              value={newNotice.content}
              onChange={e => setNewNotice({...newNotice, content: e.target.value})}
              className="w-full bg-white/5 border-white/10 text-white rounded-2xl p-4 outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-400"
            />
            <button 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black transition-all disabled:opacity-50"
            >
              {loading ? "BROADCASTING..." : "POST NOTICE"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        <AnimatePresence>
          {notices.length > 0 ? (
            notices.slice().reverse().map((notice) => (
              <motion.div 
                layout
                key={notice.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-black/20 border-white/10 p-8 rounded-[2.5rem] relative group hover:border-blue-400/50 transition-all backdrop-blur-lg"
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                    <Bell size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black text-white mb-2">{notice.title}</h3>
                      
                      {/* 🔥 DELETE BUTTON (Admin Only) */}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-slate-400 leading-relaxed">{notice.content}</p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      <Clock size={12} /> {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Just Now'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-900/20 border-slate-800 border border-dashed rounded-[3rem]">
              <p className="text-slate-600 font-black uppercase tracking-widest italic">No notices posted yet</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}