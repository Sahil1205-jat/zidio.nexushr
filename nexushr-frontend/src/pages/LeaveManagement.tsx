import { useState, useEffect } from "react";
import { CalendarDays, CalendarPlus, Check, X, FileText, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function LeaveManagement() {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Naya Leave Form State
  const [newLeave, setNewLeave] = useState({ type: "Sick Leave", dates: "", reason: "" });

  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const empCode = localStorage.getItem("user_id") || "admin"; // Ya jo bhi variable tune login mein save kiya hai
  const isAdmin = userRole === "ADMIN";

  // Data Fetch Karna
  const fetchLeaves = async () => {
    try {
      // Agar admin hai toh sabki leaves lao, nahi toh sirf khud ki
      const url = isAdmin ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/leaves` : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/leaves/${empCode}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves");
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // Leave Apply Karna
  const handleApplyLeave = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empCode: empCode,
          name: empCode, // Ya localStorage se naam nikal kar daal de
          type: newLeave.type,
          dates: newLeave.dates,
          reason: newLeave.reason
        })
      });

      if (res.ok) {
        toast.success("Leave Request Submitted Successfully!");
        setShowApplyForm(false);
        setNewLeave({ type: "Sick Leave", dates: "", reason: "" });
        fetchLeaves(); // List refresh karo
      }
    } catch (error) {
      toast.error("Failed to submit leave");
    } finally {
      setLoading(false);
    }
  };

  // Status Update Karna (Admin Only)
  const updateLeaveStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/leaves/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStatus)
      });
      if (res.ok) {
        toast.success(`Leave ${newStatus}!`);
        fetchLeaves(); // List refresh karo
      }
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  return (
    <div className="p-6 lg:p-10 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-white flex items-center gap-3 italic mb-2">
            <CalendarDays className="w-10 h-10 text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" /> 
            Leave Operations
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Absence & Time-Off Requests</p>
        </div>
        
        {!isAdmin && (
          <button onClick={() => setShowApplyForm(!showApplyForm)} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all">
            <CalendarPlus className="w-5 h-5" /> {showApplyForm ? "Cancel Form" : "Apply Leave"}
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* APPLY LEAVE FORM */}
        {showApplyForm && (
          <div className="lg:col-span-3 bg-black/20 border-white/10 backdrop-blur-lg rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6">New Leave Application</h3>
            <form onSubmit={handleApplyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Leave Type</label>
                <select value={newLeave.type} onChange={(e) => setNewLeave({...newLeave, type: e.target.value})} className="w-full h-12 bg-white/5 border-white/10 text-white rounded-xl px-4 font-bold outline-none focus:ring-1 focus:ring-purple-400 appearance-none">
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Unpaid Leave</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Date Range</label>
                <input required type="text" value={newLeave.dates} onChange={(e) => setNewLeave({...newLeave, dates: e.target.value})} placeholder="e.g. 24 Apr - 26 Apr" className="w-full h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-400 rounded-xl px-4 font-bold outline-none focus:ring-1 focus:ring-purple-400" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Reason</label>
                <textarea required value={newLeave.reason} onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} placeholder="Briefly explain your reason..." className="w-full h-24 bg-white/5 border-white/10 text-white placeholder:text-slate-400 rounded-xl p-4 font-bold outline-none focus:ring-1 focus:ring-purple-400"></textarea>
              </div>
              <div className="md:col-span-2">
                <button disabled={loading} type="submit" className="w-full md:w-auto px-8 h-12 bg-white text-slate-900 rounded-xl font-black hover:bg-slate-200">{loading ? "Submitting..." : "Submit Application"}</button>
              </div>
            </form>
          </div>
        )}
        {/* LEAVE REQUESTS LIST (Modified for theme) */}
        <div className="lg:col-span-3 bg-black/20 border-white/10 backdrop-blur-lg rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-black text-white">{isAdmin ? "All Pending Requests" : "My Leave History"}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.length === 0 ? (
              <p className="text-slate-500 font-bold">No leave records found.</p>
            ) : leaves.map((leave) => (
              <div key={leave.id} className="bg-white/5 border-white/10 rounded-2xl p-6 hover:border-purple-400/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-black text-white">{leave.name || leave.empCode}</h4>
                    <span className="text-purple-400 font-bold text-sm">{leave.type}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black ${
                    leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                    leave.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {leave.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-4">
                  <Clock className="w-4 h-4" /> {leave.dates}
                </div>
                <p className="text-slate-400 bg-black/20 text-sm mb-6 p-3 rounded-xl italic">"{leave.reason}"</p>

                {isAdmin && leave.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateLeaveStatus(leave.id, 'Approved')} className="flex-1 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition-all">
                      <Check className="w-4 h-4" /> APPROVE
                    </button>
                    <button onClick={() => updateLeaveStatus(leave.id, 'Rejected')} className="flex-1 h-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition-all">
                      <X className="w-4 h-4" /> REJECT
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}