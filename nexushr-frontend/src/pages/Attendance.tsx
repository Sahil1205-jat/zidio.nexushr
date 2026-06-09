import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, UserCheck, LogIn, LogOut, Calendar, Timer, Search, Download, FileText, Users } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Ensure this is imported if used

export default function Attendance() {
  const [stats, setStats] = useState<any>({ totalDays: 0, totalHours: "0h 0m", history: [] });
  const [allLogs, setAllLogs] = useState<any[]>([]); // Sabki list ke liye
  const [targetEmpCode, setTargetEmpCode] = useState("");
  const [viewMode, setViewMode] = useState("all"); // 'all' ya 'specific'

  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const myEmpCode = localStorage.getItem("user_id") || "";
  const isAdmin = userRole === "ADMIN";

  // 1. Data Fetching
  const fetchAllLogs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/attendance/all`);
      if (res.ok) setAllLogs(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSpecificStats = async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/attendance/stats/${code}`);
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isAdmin) fetchAllLogs();
    else fetchSpecificStats(myEmpCode);
  }, []);

  // 2. Download PDF Logic
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("NexusHR - Attendance Report", 14, 15);
    const data = viewMode === "all" ? allLogs : stats.history;
    const tableData = data.map((row: any) => [
      row.empCode, row.date, row.checkInTime, row.checkOutTime || "--", row.totalHours || "Active", row.status
    ]);

    autoTable(doc, {
      head: [['Emp Code', 'Date', 'In', 'Out', 'Hours', 'Status']],
      body: tableData,
      startY: 20
    });
    doc.save(`Attendance_Report_${new Date().toLocaleDateString()}.pdf`);
    toast.success("Report Downloaded!");
  };

  const handlePunch = async (type: 'in' | 'out') => {
    if (!targetEmpCode) return toast.error("Enter Emp Code!");
    const method = type === 'in' ? "POST" : "PUT";
    const endpoint = type === 'in' ? "check-in" : "check-out";
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/attendance/${endpoint}/${targetEmpCode}`, { method });
      if (res.ok) {
        toast.success(`${type === 'in' ? 'Check-in' : 'Check-out'} done!`);
        isAdmin ? fetchAllLogs() : fetchSpecificStats(myEmpCode);
      } else {
        toast.error("Operation failed. Check if already done.");
      }
    } catch (e) { toast.error("Server Error"); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto text-slate-200">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black text-white italic flex items-center gap-3">
            <Clock className="text-blue-500" size={36} /> Attendance Center
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Personnel Tracking & Reports</p>
        </div>

        <div className="flex gap-3">
          <button onClick={downloadPDF} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-700 transition-all">
            <Download size={20}/> DOWNLOAD PDF
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-slate-900 border-slate-800 rounded-[2.5rem] p-8 mb-10 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Admin Control (Punch & Search)</label>
              <div className="relative">
                <UserCheck className="absolute left-4 top-4 text-slate-500" size={20} />
                <input 
                  value={targetEmpCode} 
                  onChange={(e) => setTargetEmpCode(e.target.value.toUpperCase())}
                  placeholder="Employee Code..." 
                  className="w-full bg-slate-950 border-slate-800 text-white rounded-2xl p-4 pl-12 font-black outline-none focus:border-blue-500 placeholder:text-slate-400"
                />
              </div>
            </div>
            <button onClick={() => { fetchSpecificStats(targetEmpCode); setViewMode("specific"); }} className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-600/20"><Search size={24} /></button>
            <button onClick={() => handlePunch('in')} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20"><LogIn size={20}/> IN</button>
            <button onClick={() => handlePunch('out')} className="bg-rose-600 hover:bg-rose-500 px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-rose-600/20"><LogOut size={20}/> OUT</button>
          </div>
        </div>
      )}

      {/* VIEW TOGGLE FOR ADMIN */}
      {isAdmin && (
        <div className="flex gap-4 mb-6">
          <button onClick={() => setViewMode("all")} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Master View (All)</button>
          <button onClick={() => setViewMode("specific")} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'specific' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Employee Search Result</button>
        </div>
      )}

      <div className="bg-slate-900 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-lg">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-6">Employee</th>
              <th className="p-6">Date</th>
              <th className="p-6">In Time</th>
              <th className="p-6">Out Time</th>
              <th className="p-6">Total Hours</th>
              <th className="p-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm font-bold">
            {(viewMode === "all" ? allLogs : stats.history)?.map((log: any, i: number) => (
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="p-6 text-blue-500">{log.empCode}</td>
                <td className="p-6 text-white">{log.date}</td>
                <td className="p-6 text-slate-400 font-mono">{log.checkInTime}</td>
                <td className="p-6 text-slate-400 font-mono">{log.checkOutTime || "--:--"}</td>
                <td className="p-6 text-emerald-500">{log.totalHours || "Active"}</td>
                <td className="p-6 text-right">
                  <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-emerald-500/20">{log.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}