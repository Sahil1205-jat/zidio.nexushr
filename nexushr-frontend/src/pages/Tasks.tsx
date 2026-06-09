import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, Plus, CheckCircle2, Calendar, Send, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assignedTo: "", priority: "MEDIUM", dueDate: "" });
  const [showCompleted, setShowCompleted] = useState(false); // Admin toggle for completed tasks

  const userRole = localStorage.getItem("user_role");
  const empCode = localStorage.getItem("user_id");
  const isAdmin = userRole === "ADMIN";

  const fetchTasks = async () => {
    const token = localStorage.getItem("auth_token");
    const url = isAdmin ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/tasks/all` : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/tasks/emp/${empCode}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) setTasks(await res.json());
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/tasks`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newTask)
    });
    if (res.ok) {
      toast.success("Task Assigned!");
      setShowForm(false);
      fetchTasks();
      setNewTask({ title: "", description: "", assignedTo: "", priority: "MEDIUM", dueDate: "" });
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: status }) // Send as a JSON object for robustness
      });

      if (res.ok) {
        toast.success("Status Updated!");
        fetchTasks();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (error) {
      toast.error("A server error occurred while updating status.");
    }
  };

  // Filter tasks based on role and admin preference
  const displayedTasks = tasks.filter(task => {
    if (isAdmin) {
      return showCompleted ? true : task.status !== 'COMPLETED';
    }
    return task.status !== 'COMPLETED'; // Employees only see non-completed tasks
  });

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white italic flex items-center gap-3">
            <ListTodo className="text-blue-500" size={32} /> Task Console
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Manage Deliverables</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-4">
            <button onClick={() => setShowCompleted(!showCompleted)} className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-xs transition-all">
              {showCompleted ? <EyeOff size={16}/> : <Eye size={16}/>}
              {showCompleted ? "HIDE COMPLETED" : "SHOW COMPLETED"}
            </button>
            <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <Plus size={20}/> {showForm ? "CLOSE" : "ASSIGN NEW"}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-10 overflow-hidden">
            <form onSubmit={handleCreate} className="bg-black/20 border-white/10 backdrop-blur-lg rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Task Name" className="w-full bg-white/5 border-white/10 text-white rounded-xl p-4 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-400" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <input required placeholder="Emp Code (e.g. emp101)" className="w-full bg-white/5 border-white/10 text-white rounded-xl p-4 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-400" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})} />
              <textarea required placeholder="Description" className="w-full md:col-span-2 bg-white/5 border-white/10 text-white rounded-xl p-4 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-400" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              <select className="w-full bg-white/5 border-white/10 text-white rounded-xl p-4 outline-none focus:ring-1 focus:ring-blue-400 appearance-none" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
              <input required type="date" className="w-full bg-white/5 border-white/10 text-white rounded-xl p-4 outline-none focus:ring-1 focus:ring-blue-400" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              <button className="md:col-span-2 bg-blue-600 h-14 rounded-xl font-black flex items-center justify-center gap-2"><Send size={18}/> DEPLOY TASK</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedTasks.map((task, i) => (
          <motion.div 
            key={task.id} 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: i * 0.05 }}
            className="bg-black/20 border-white/10 backdrop-blur-lg p-6 rounded-[2rem] relative group hover:border-blue-400/50 transition-all shadow-lg hover:shadow-blue-500/10"
          >
            <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black ${task.priority === 'HIGH' ? 'bg-rose-500' : 'bg-blue-500'}`}>{task.priority}</div>
            <h3 className={`text-xl font-black mb-2 ${task.status === 'COMPLETED' ? 'text-slate-600 line-through' : 'text-white'}`}>{task.title}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-2">{task.description}</p>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Calendar size={12}/> {task.dueDate}</span>
              {task.status !== 'COMPLETED' ? (
                <button onClick={() => updateStatus(task.id, "COMPLETED")} className="text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-emerald-500 hover:text-white">MARK DONE</button>
              ) : (
                <span className="text-emerald-500 text-[10px] font-black flex items-center gap-1"><CheckCircle2 size={14}/> FINISHED</span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}