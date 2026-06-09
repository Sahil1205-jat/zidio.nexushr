import { useState, useEffect } from "react";
import { BarChart, Users, TrendingUp, UserCheck, UserMinus, Activity } from "lucide-react";
import toast from "react-hot-toast";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    onLeave: 0,
    departments: [] as { name: string; count: number; percentage: number; color: string }[]
  });

  // Colors for dynamic department bars
  const colors = ["bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500"];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // 1. Database se Employees aur Leaves fetch karo
        const [empRes, leaveRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/leaves`)
        ]);

        const employees = empRes.ok ? await empRes.json() : [];
        const leaves = leaveRes.ok ? await leaveRes.json() : [];

        // --- MATH CALCULATIONS ---
        const total = employees.length;

        // Aaj kitne log leave par hain (Simplification: counting Approved leaves)
        const onLeaveCount = leaves.filter((l: any) => l.status === "Approved").length;
        const present = total > 0 ? total - onLeaveCount : 0;

        // Department Distribution (Kaunse department mein kitne bache hain)
        const deptCounts: Record<string, number> = {};
        employees.forEach((emp: any) => {
          const dept = emp.department || "Unassigned";
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const deptArray = Object.keys(deptCounts).map((key, index) => ({
          name: key,
          count: deptCounts[key],
          percentage: total > 0 ? Math.round((deptCounts[key] / total) * 100) : 0,
          color: colors[index % colors.length] // Assign unique color dynamically
        }));

        // State update karo
        setStats({
          totalStaff: total,
          presentToday: present,
          onLeave: onLeaveCount,
          departments: deptArray
        });

      } catch (error) {
        toast.error("Failed to sync Analytics with Database");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  return (
    <div className="p-6 lg:p-10 font-sans text-slate-200">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10">
        <h2 className="text-4xl font-black text-white flex items-center gap-3 italic mb-2">
          <BarChart className="w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" /> 
          Company Analytics
        </h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Live DB Metrics & Workforce Status</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500 font-bold animate-pulse">
          Syncing Analytics with Database...
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* TOP STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border-slate-800 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl backdrop-blur-lg">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Total Staff</p>
                <h3 className="text-4xl font-black text-white">{stats.totalStaff}</h3>
              </div>
            </div>
            
            <div className="bg-slate-900 border-slate-800 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl backdrop-blur-lg">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Available Today</p>
                <h3 className="text-4xl font-black text-white">{stats.presentToday}</h3>
              </div>
            </div>

            <div className="bg-slate-900 border-slate-800 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl backdrop-blur-lg">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <UserMinus className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">On Leave</p>
                <h3 className="text-4xl font-black text-white">{stats.onLeave}</h3>
              </div>
            </div>
          </div>

          {/* CHARTS AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dynamic Department Distribution */}
            <div className="bg-slate-900/50 border-slate-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-lg">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white flex items-center gap-2"><Activity className="text-amber-500 w-5 h-5"/> Department Strength</h3>
              </div>
              <div className="space-y-6">
                {stats.departments.length === 0 ? (
                  <p className="text-slate-500 font-bold text-sm italic">No department data found.</p>
                ) : (
                  stats.departments.map((dept, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm font-bold mb-2 text-white">
                        <span className="uppercase">{dept.name} <span className="text-slate-500 text-xs">({dept.count} Staff)</span></span>
                        <span>{dept.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                        <div className={`${dept.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${dept.percentage}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overall System Health */}
            <div className="bg-slate-900 border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center items-center text-center backdrop-blur-lg">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Live Workforce Sync</h3>
              <p className="text-slate-500 font-bold max-w-sm">
                Analytics are now pulling data directly from your PostgreSQL Database in real-time. Any changes in Staff Directory or Leaves will reflect here instantly.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}