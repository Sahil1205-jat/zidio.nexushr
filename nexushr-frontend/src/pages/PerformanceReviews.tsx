import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, Plus, User, Star, Send, X, BarChart2, Calendar, 
  CheckSquare, Activity, ChevronDown, Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

// --- Types ---
interface Employee {
  id: number;
  empCode: string;
  name: string;
  department: string;
  email: string;
}

export default function PerformanceReviews() {
  // Core States
  const [activeTab, setActiveTab] = useState<"metrics" | "appraisals">("metrics");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState<string>("");
  const [selectedEmpName, setSelectedEmpName] = useState<string>("");

  // Hard KPI Metric States
  const [tasksKPI, setTasksKPI] = useState<any[]>([]);
  const [leavesKPI, setLeavesKPI] = useState<any[]>([]);
  const [attendanceKPI, setAttendanceKPI] = useState<any[]>([]);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);
  const [kpiSummary, setKpiSummary] = useState({
    taskCompletionRate: 0,
    presentDays: 0,
    totalLeaveDays: 0,
    approvedLeaves: 0
  });

  // Appraisals / Reviews States
  const [reviews, setReviews] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [newReview, setNewReview] = useState({ empCode: '', period: '', goals: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Form state for review appraisal modal
  const [assessment, setAssessment] = useState('');
  const [managerFeedback, setManagerFeedback] = useState('');
  const [rating, setRating] = useState(0);
  
  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const myEmpCode = localStorage.getItem("user_id") || "";
  const isAdmin = userRole === "ADMIN";

  // Chart Colors (Premium Tailwind Harmonious Palette)
  const TASK_COLORS = ["#3b82f6", "#fbbf24", "#ef4444"]; // Blue (Completed), Amber (Pending/In Progress), Red (Other)
  const LEAVE_COLORS = ["#10b981", "#fbbf24", "#f43f5e"]; // Emerald (Approved), Amber (Pending), Rose (Rejected)
  const ATTENDANCE_COLORS = ["#06b6d4", "#475569"]; // Cyan (Present), Slate (Absent/Unrecorded)

  // 1. Fetch All Employees (For Selector Menu)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees`);
        if (res.ok) {
          const data: Employee[] = await res.json();
          setEmployees(data);
          
          // Set initial employee
          if (data.length > 0) {
            if (isAdmin) {
              setSelectedEmpCode(data[0].empCode);
              setSelectedEmpName(data[0].name);
            } else {
              const matched = data.find(e => e.empCode.toUpperCase() === myEmpCode.toUpperCase());
              setSelectedEmpCode(matched ? matched.empCode : myEmpCode);
              setSelectedEmpName(matched ? matched.name : localStorage.getItem("user_name") || "Me");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load staff list for metrics selector");
      }
    };

    fetchEmployees();
  }, [isAdmin, myEmpCode]);

  // 2. Fetch Employee KPI Stats whenever selected Employee changes
  useEffect(() => {
    if (!selectedEmpCode) return;
    
    const fetchKPIMetrics = async () => {
      setMetricsLoading(true);
      try {
        // Fetch Tasks, Leaves and Attendance Stats in parallel
        const [tasksRes, leavesRes, attendanceRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/tasks/emp/${selectedEmpCode}`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/leaves/${selectedEmpCode}`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/attendance/stats/${selectedEmpCode}`)
        ]);

        // Process Tasks Data
        let completedTasks = 0;
        let pendingTasks = 0;
        let otherTasks = 0;
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          tasks.forEach((task: any) => {
            const status = (task.status || "").toUpperCase();
            if (status === "COMPLETED" || status === "DONE") {
              completedTasks++;
            } else if (status === "PENDING" || status === "IN_PROGRESS" || status === "IN PROGRESS") {
              pendingTasks++;
            } else {
              otherTasks++;
            }
          });
        }
        const taskChart = [
          { name: "Completed", value: completedTasks },
          { name: "Pending", value: pendingTasks },
          { name: "Other", value: otherTasks }
        ].filter(t => t.value > 0);
        setTasksKPI(taskChart.length > 0 ? taskChart : [{ name: "No Tasks Assigned", value: 1 }]);

        // Process Leaves Data
        let approvedLeaves = 0;
        let pendingLeaves = 0;
        let rejectedLeaves = 0;
        if (leavesRes.ok) {
          const leaves = await leavesRes.json();
          leaves.forEach((leave: any) => {
            const status = (leave.status || "").toLowerCase();
            if (status === "approved") {
              approvedLeaves++;
            } else if (status === "pending") {
              pendingLeaves++;
            } else {
              rejectedLeaves++;
            }
          });
        }
        const leaveChart = [
          { name: "Approved", value: approvedLeaves },
          { name: "Pending", value: pendingLeaves },
          { name: "Rejected", value: rejectedLeaves }
        ].filter(l => l.value > 0);
        setLeavesKPI(leaveChart.length > 0 ? leaveChart : [{ name: "No Leaves Applied", value: 1 }]);

        // Process Attendance Data
        let presentDays = 0;
        if (attendanceRes.ok) {
          const attStats = await attendanceRes.json();
          presentDays = attStats.totalDays || 0;
        }
        // Assume standard 22 working days per month for tracking metrics
        const totalWorkingDays = Math.max(presentDays, 22);
        const absentDays = Math.max(0, totalWorkingDays - presentDays);
        setAttendanceKPI([
          { name: "Days Present", value: presentDays },
          { name: "Absent / Rest Days", value: absentDays }
        ]);

        // Set KPI Summary Calculations
        const totalTasks = completedTasks + pendingTasks + otherTasks;
        setKpiSummary({
          taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          presentDays: presentDays,
          totalLeaveDays: approvedLeaves + pendingLeaves + rejectedLeaves,
          approvedLeaves: approvedLeaves
        });

      } catch (error) {
        console.error("Error generating dynamic KPI charts:", error);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchKPIMetrics();
  }, [selectedEmpCode]);

  // 3. Fetch Appraisals & Formal Reviews
  const fetchReviews = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    // Fetch appraisals for currently selected employee in the metric selection scope
    const url = isAdmin 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/reviews/all` 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/reviews/emp/${selectedEmpCode}`;
    
    try {
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            let data = await res.json();
            // If admin, only show reviews belonging to the currently selected employee code to keep dashboard clean
            if (isAdmin && selectedEmpCode) {
              data = data.filter((r: any) => r.empCode.toUpperCase() === selectedEmpCode.toUpperCase());
            }
            setReviews(data);
        }
    } catch (error) {
        console.error("Failed to load formal reviews");
    }
  };

  useEffect(() => {
    if (selectedEmpCode) {
      fetchReviews();
    }
  }, [selectedEmpCode, isAdmin]);

  // Appraisal Form helper
  useEffect(() => {
      if (selectedReview) {
          setAssessment(selectedReview.selfAssessment || '');
          setManagerFeedback(selectedReview.managerFeedback || '');
          setRating(selectedReview.rating || 0);
      }
  }, [selectedReview]);

  const getStatusColor = (status: string) => {
      if (status.includes('Pending Self')) return 'bg-amber-500/10 text-amber-500';
      if (status.includes('Pending Manager')) return 'bg-blue-500/10 text-blue-500';
      if (status === 'Completed') return 'bg-emerald-500/10 text-emerald-500';
      return 'bg-slate-700 text-slate-400';
  };

  const handleCreateReview = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreateLoading(true);
      const token = localStorage.getItem("auth_token");
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({
                empCode: selectedEmpCode,
                period: newReview.period,
                goals: newReview.goals
              })
          });
          if (res.ok) {
              toast.success("Formal review process initiated!");
              setShowCreateForm(false);
              setNewReview({ empCode: '', period: '', goals: '' });
              fetchReviews();
          } else {
              toast.error("Failed to create review.");
          }
      } catch (error) {
          toast.error("Server error initiating appraisal.");
      } finally {
          setCreateLoading(false);
      }
  };

  const handleUpdateReview = async () => {
      if (!selectedReview) return;
      setUpdateLoading(true);
      const token = localStorage.getItem("auth_token");

      let payload = {};
      let newStatus = selectedReview.status;

      if (isAdmin && selectedReview.status === 'Pending Manager Review') {
          payload = { managerFeedback, rating: Number(rating) };
          newStatus = 'Completed';
      } else if (!isAdmin && selectedReview.status === 'Pending Self-Assessment') {
          payload = { selfAssessment: assessment };
          newStatus = 'Pending Manager Review';
      } else {
          setUpdateLoading(false);
          return;
      }

      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/reviews/${selectedReview.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ ...payload, status: newStatus })
          });

          if (res.ok) {
              toast.success("Review updated successfully!");
              setSelectedReview(null);
              fetchReviews();
          } else {
              toast.error("Failed to submit review.");
          }
      } catch (error) {
          toast.error("Server error submitting appraisal.");
      } finally {
          setUpdateLoading(false);
      }
  };

  const handleEmpSelectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedEmpCode(code);
    const empObj = employees.find(emp => emp.empCode === code);
    if (empObj) {
      setSelectedEmpName(empObj.name);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto text-slate-200">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white italic flex items-center gap-3">
            <ClipboardCheck className="text-purple-500" size={36} /> Performance Center
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Data-Driven Insights & Staff Appraisals</p>
        </div>

        {/* Dynamic Selector Dropdown */}
        <div className="flex items-center gap-4 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl w-full md:w-auto relative group">
          <User className="text-purple-400 w-5 h-5" />
          <div className="flex flex-col w-full md:w-56 text-left">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Scope</span>
            {isAdmin ? (
              <select 
                value={selectedEmpCode} 
                onChange={handleEmpSelectorChange} 
                className="bg-transparent font-bold text-white text-sm focus:outline-none appearance-none cursor-pointer pr-8 w-full"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.empCode} className="bg-slate-900 text-white font-bold">
                    {emp.name} ({emp.empCode})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-white text-sm">{selectedEmpName} ({selectedEmpCode})</span>
            )}
          </div>
          {isAdmin && (
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none transition-transform group-hover:scale-110" />
          )}
        </div>
      </div>

      {/* DUAL MODE NAVIGATION TABS */}
      <div className="flex gap-4 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 max-w-md">
        <button 
          onClick={() => setActiveTab("metrics")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "metrics" 
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart2 size={16} /> Hard KPI Metrics
        </button>
        <button 
          onClick={() => setActiveTab("appraisals")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "appraisals" 
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles size={16} /> Appraisals & Goals
        </button>
      </div>

      {/* TABS CONTAINER */}
      <AnimatePresence mode="wait">
        {activeTab === "metrics" ? (
          <motion.div
            key="metricsTab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {metricsLoading ? (
              <div className="flex flex-col justify-center items-center py-20 text-slate-500 font-bold space-y-4">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="animate-pulse uppercase text-[10px] tracking-widest font-black">Syncing analytics for {selectedEmpName}...</p>
              </div>
            ) : (
              <>
                {/* DYNAMIC METRIC SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Task KPI */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <CheckSquare className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase text-[9px] tracking-widest">Task Completion</p>
                      <h3 className="text-3xl font-black text-white">{kpiSummary.taskCompletionRate}%</h3>
                    </div>
                  </div>

                  {/* Card 2: Attendance KPI */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase text-[9px] tracking-widest">Attendance Stats</p>
                      <h3 className="text-3xl font-black text-white">{kpiSummary.presentDays} <span className="text-sm font-bold text-slate-500">Days</span></h3>
                    </div>
                  </div>

                  {/* Card 3: Leaves KPI */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-xl backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase text-[9px] tracking-widest">Approved Leaves</p>
                      <h3 className="text-3xl font-black text-white">{kpiSummary.approvedLeaves} <span className="text-sm font-bold text-slate-500">Total</span></h3>
                    </div>
                  </div>
                </div>

                {/* CHARTS GRAPHICS BLOCK */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Tasks Pie Chart */}
                  <div className="bg-black/20 border border-white/10 rounded-[2rem] p-6 backdrop-blur-lg flex flex-col items-center">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2"><CheckSquare size={16}/> Tasks Overview</h4>
                    <div className="w-full h-64 flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tasksKPI}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {tasksKPI.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Attendance Bar Chart */}
                  <div className="bg-black/20 border border-white/10 rounded-[2rem] p-6 backdrop-blur-lg flex flex-col items-center col-span-1 lg:col-span-2">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2"><Activity size={16}/> Monthly Attendance Ratio</h4>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={attendanceKPI} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontWeight="bold" width={120} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                          <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]}>
                            {attendanceKPI.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Leaves Pie Chart */}
                  <div className="bg-black/20 border border-white/10 rounded-[2rem] p-6 backdrop-blur-lg flex flex-col items-center col-span-1 lg:col-span-3">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2"><Calendar size={16}/> Leaves Distribution</h4>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={leavesKPI}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {leavesKPI.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="appraisalsTab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Initiate Review Button (Admin Only) */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Appraisal History for {selectedEmpName}</h3>
              {isAdmin && (
                <button 
                  onClick={() => setShowCreateForm(!showCreateForm)} 
                  className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all text-xs"
                >
                  <Plus size={16}/> {showCreateForm ? 'CLOSE' : 'INITIATE NEW REVIEW'}
                </button>
              )}
            </div>

            {/* Create Review Form */}
            <AnimatePresence>
              {showCreateForm && isAdmin && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleCreateReview}
                  className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 mb-10 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input required placeholder="Employee Code" className="w-full bg-white/5 border-white/10 text-white rounded-xl p-4 outline-none focus:ring-1 focus:ring-purple-400" value={selectedEmpCode} disabled />
                  <input required placeholder="Review Period (e.g. Q3 2026)" className="w-full bg-white/5 border-white/10 text-white rounded-xl p-4 outline-none focus:ring-1 focus:ring-purple-400" value={newReview.period} onChange={e => setNewReview({...newReview, period: e.target.value})} />
                  <textarea required placeholder="Initial Goals for this period" className="w-full md:col-span-2 bg-white/5 border-white/10 text-white rounded-xl p-4 outline-none focus:ring-1 focus:ring-purple-400" value={newReview.goals} onChange={e => setNewReview({...newReview, goals: e.target.value})} />
                  <button type="submit" disabled={createLoading} className="md:col-span-2 bg-purple-600 h-14 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                    {createLoading ? "INITIATING..." : <><Send size={18}/> INITIATE APPRAISAL</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Appraisal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(review => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/20 backdrop-blur-lg border border-white/10 p-6 rounded-[2rem] hover:border-purple-400/50 transition-all cursor-pointer shadow-lg hover:shadow-purple-500/10"
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-black text-white">{selectedEmpName}</h3>
                      <p className="text-sm text-slate-400 font-bold">{review.period}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                    <User size={14}/> {review.empCode}
                  </div>
                </motion.div>
              ))}
            </div>

            {reviews.length === 0 && (
              <div className="text-center py-20 bg-slate-900/30 border-dashed border-slate-800 rounded-[2rem]">
                <ClipboardCheck className="mx-auto w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No appraisals found for {selectedEmpName}.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Details Appraisal Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedReview && (
            <>
              {/* Backdrop covering full screen securely */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReview(null)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
              />

              {/* Flex Centering Modal Wrapper */}
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  key="modal"
                  initial={{ opacity: 0, y: 100, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 100, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="bg-[#0f172a] border border-white/10 w-full max-w-2xl relative shadow-2xl overflow-y-auto flex flex-col pointer-events-auto rounded-t-[2rem] rounded-b-none h-[85vh] max-h-[85vh] p-5 mt-auto md:rounded-3xl md:h-auto md:max-h-[80vh] md:p-8 md:my-auto"
                >
                  <button onClick={() => setSelectedReview(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-2.5 rounded-full transition-all">
                    <X size={18} />
                  </button>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-6 pr-8">Review appraisal for {selectedEmpName} ({selectedReview.period})</h3>

                  <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                    {/* Goals */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500">Goals for this Period</label>
                      <p className="bg-white/5 border border-white/10 rounded-lg p-4 mt-1 text-slate-300 font-bold">{selectedReview.goals}</p>
                    </div>

                    {/* Self-Assessment Section */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500">Employee Self-Assessment</label>
                      {selectedReview.status === 'Pending Self-Assessment' && !isAdmin ? (
                        <textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} rows={5} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-1 focus:ring-purple-400" placeholder="Describe your achievements, challenges, and areas for growth..."></textarea>
                      ) : (
                        <p className="bg-white/5 border border-white/10 rounded-lg p-4 mt-1 text-slate-300 min-h-[100px]">{selectedReview.selfAssessment || 'Not yet submitted.'}</p>
                      )}
                    </div>

                    {/* Manager Feedback Section */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500">Manager Feedback & Rating</label>
                      {selectedReview.status === 'Pending Manager Review' && isAdmin ? (
                        <>
                          <textarea value={managerFeedback} onChange={(e) => setManagerFeedback(e.target.value)} rows={5} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-1 focus:ring-purple-400" placeholder="Provide constructive feedback..."></textarea>
                          <div className="flex items-center gap-4 mt-2">
                            <label className="font-bold text-sm">Rating (1-5):</label>
                            <input type="number" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-20 bg-white/5 border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-purple-400 font-bold" />
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 mt-1 text-slate-300 min-h-[100px]">{selectedReview.managerFeedback || 'Not yet submitted.'}</p>
                          <div className="flex items-center gap-2 mt-4 font-black text-lg text-amber-400">
                            <Star className="text-amber-400 fill-amber-400" size={20} /> Rating: {selectedReview.rating > 0 ? `${selectedReview.rating} / 5` : 'N/A'}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-slate-800 flex justify-end">
                      {((!isAdmin && selectedReview.status === 'Pending Self-Assessment') || (isAdmin && selectedReview.status === 'Pending Manager Review')) && (
                        <button onClick={handleUpdateReview} disabled={updateLoading} className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 text-xs">
                          {updateLoading ? "SUBMITTING..." : <><Send size={18} /> SUBMIT APPRAISAL</>}
                        </button>
                      )}
                      {selectedReview.status === 'Completed' && (
                        <span className="text-emerald-500 font-bold flex items-center gap-2 text-sm"><ClipboardCheck size={20} /> APPRAISAL COMPLETED</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </ AnimatePresence>,
        document.body
      )}
    </div>
  );
}