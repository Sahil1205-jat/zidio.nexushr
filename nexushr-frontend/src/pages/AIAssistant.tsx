import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Send, User, Bot, AlertTriangle, ShieldCheck, 
  ArrowRight, BookOpen, BrainCircuit, RefreshCw, X, Award, Target, MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface AttritionRisk {
  empCode: string;
  name: string;
  department: string;
  attritionScore: number;
  riskLevel: string;
  riskFactors: string[];
  recommendation: string;
  salary?: number;
}

interface SkillItem {
  name: string;
  required: number;
  actual: number;
}

interface ChatMessage {
  sender: "user" | "bot";
  content: string;
  timestamp: string;
  sources?: string[];
}

const parseBoldText = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-extrabold text-white">{part}</strong>;
    }
    return part;
  });
};

const renderMessageContent = (content: string) => {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h4 key={idx} className="text-sm font-black text-white mt-3 mb-1.5 flex items-center gap-1.5">{line.substring(4)}</h4>;
    }
    if (line.startsWith('#### ')) {
      return <h5 key={idx} className="text-xs font-bold text-slate-200 mt-2 mb-1">{line.substring(5)}</h5>;
    }
    // Bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      const isBullet = line.startsWith('• ');
      const cleanLine = line.substring(2);
      return (
        <div key={idx} className="pl-4 flex items-start gap-1.5 my-1">
          <span className="text-cyan-400 mt-1">{isBullet ? '•' : '-'}</span>
          <span className="text-xs text-slate-300">{parseBoldText(cleanLine)}</span>
        </div>
      );
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    // Normal text
    return <p key={idx} className="text-xs text-slate-300 leading-relaxed my-1">{parseBoldText(line)}</p>;
  });
};

export default function AIAssistant() {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "bot",
      content: "Welcome to the NexusHR AI Agent! I have ingested the Employee Handbook, Leave Policies, and Payroll Guidelines. Ask me anything about HR policies.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState("");
  const [employeeSkills, setEmployeeSkills] = useState<SkillItem[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  const [attritionRisks, setAttritionRisks] = useState<AttritionRisk[]>([]);
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [selectedRiskEmp, setSelectedRiskEmp] = useState<AttritionRisk | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const loggedInEmpCode = localStorage.getItem("user_id") || "";
  const isAdmin = userRole === "ADMIN";

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Fetch employees list for dropdown
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployeesList(data);
        if (data.length > 0 && !selectedEmpCode) {
          // Default to logged-in employee or first employee
          const defaultEmp = data.find((e: any) => e.empCode.toLowerCase() === loggedInEmpCode.toLowerCase()) || data[0];
          setSelectedEmpCode(defaultEmp.empCode);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch skills for the selected employee
  const fetchSkills = async (code: string) => {
    if (!code) return;
    setLoadingSkills(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/ai/skills/${code}`);
      if (res.ok) {
        setEmployeeSkills(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchAttrition = async () => {
    if (!isAdmin) return;
    setLoadingRisks(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/ai/attrition`);
      if (res.ok) {
        setAttritionRisks(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisks(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
      fetchAttrition();
    } else {
      setSelectedEmpCode(loggedInEmpCode);
    }
  }, [isAdmin, loggedInEmpCode]);

  useEffect(() => {
    if (selectedEmpCode) {
      fetchSkills(selectedEmpCode);
    }
  }, [selectedEmpCode]);

  // Calculate coordinates for dynamic SVG Radar Chart
  const radarPoints = useMemo(() => {
    if (employeeSkills.length === 0) return null;
    const cx = 150;
    const cy = 135;
    const r = 85;
    const totalAxes = employeeSkills.length;

    const getCoords = (val: number, index: number) => {
      const angle = (index * 2 * Math.PI) / totalAxes - Math.PI / 2;
      const factor = val / 100;
      const x = cx + r * factor * Math.cos(angle);
      const y = cy + r * factor * Math.sin(angle);
      return { x, y };
    };

    const requiredPath = employeeSkills.map((s, i) => {
      const { x, y } = getCoords(s.required, i);
      return `${x},${y}`;
    }).join(" ");

    const actualPath = employeeSkills.map((s, i) => {
      const { x, y } = getCoords(s.actual, i);
      return `${x},${y}`;
    }).join(" ");

    const axes = employeeSkills.map((s, i) => {
      const outer = getCoords(100, i);
      const label = getCoords(122, i);
      return { name: s.name, startX: cx, startY: cy, endX: outer.x, endY: outer.y, labelX: label.x, labelY: label.y };
    });

    const grids = [20, 40, 60, 80, 100].map(val => {
      return employeeSkills.map((_, i) => {
        const { x, y } = getCoords(val, i);
        return `${x},${y}`;
      }).join(" ");
    });

    return { requiredPath, actualPath, axes, grids };
  }, [employeeSkills]);

  const handleSendChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const query = customMsg || chatInput;
    if (!query.trim() || chatLoading) return;

    setChatInput("");
    setChatHistory(prev => [...prev, {
      sender: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setChatLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: query,
          empCode: loggedInEmpCode,
          role: userRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Typing Effect simulation
        setChatHistory(prev => [...prev, {
          sender: "bot",
          content: data.reply,
          sources: data.sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("AI connection failed.");
      setChatHistory(prev => [...prev, {
        sender: "bot",
        content: "I am having trouble connecting to the backend AI. Please verify that the Maven backend server is running successfully on port 8080.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleInitiate1on1 = (empName: string) => {
    toast.success(`1-on-1 retention session requested for ${empName}! Direct manager has been notified.`);
    setSelectedRiskEmp(null);
  };

  return (
    <div className="p-6 lg:p-10 font-sans text-slate-200 h-full flex flex-col">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex-shrink-0 w-full mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-white flex items-center gap-3 italic">
              <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" /> AI & Workforce Intelligence
            </h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Predictive Analytics & RAG Chatbot</p>
          </div>
        </motion.div>
      </div>

      {/* DUAL COLUMN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl w-full mx-auto flex-1 items-stretch">
        
        {/* LEFT COLUMN: RAG CHATBOT (7 cols on lg) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-white/10 rounded-[2.5rem] flex flex-col h-[650px] shadow-2xl backdrop-blur-lg overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/10 bg-black/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="font-black text-white">Policy Chat Assistant</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Retrieval-Augmented Generation (RAG)</p>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                }`}>
                  <div className="space-y-1">{renderMessageContent(msg.content)}</div>
                  
                  {/* Sources List */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                      <p className="text-[8px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                        <BookOpen size={10} /> Sources referenced:
                      </p>
                      {msg.sources.map((src, sIdx) => (
                        <p key={sIdx} className="text-[9px] text-slate-400 font-mono">[{sIdx + 1}] {src}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-[8px] text-slate-500 text-right mt-1.5">{msg.timestamp}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 justify-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs italic">
                  Searching knowledge base and generating reply...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-6 py-3 flex flex-wrap gap-2 bg-black/30 border-t border-white/5">
            <span className="text-[9px] text-slate-500 font-extrabold uppercase w-full mb-1">Database Queries:</span>
            {[
              { label: "📋 My Tasks", query: "my tasks" },
              { label: "📅 Leave History", query: "my leave status" },
              { label: "🏆 Appraisals", query: "my performance reviews" },
              { label: "📢 Announcements", query: "show notices" },
              { label: "👤 My Profile", query: "my profile details" },
              { label: "🔍 Lookup Admin", query: "who is Admin" },
              ...(isAdmin ? [{ label: "⚠️ Attrition Risk Alerts", query: "high risk attrition" }] : [])
            ].map((suggest, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={(e) => handleSendChat(e, suggest.query)}
                className="text-[9px] font-bold text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1"
              >
                {suggest.label}
              </button>
            ))}

            <span className="text-[9px] text-slate-500 font-extrabold uppercase w-full mt-2 mb-1">Policy Questions:</span>
            {[
              { label: "Casual & Sick Leaves", query: "What is the leave policy?" },
              { label: "CTC Statutory Deductions", query: "When is payroll processed and what are the deductions?" },
              { label: "Temporary Password Reset", query: "What are my onboarding tasks and temporary password rules?" },
              { label: "Code of Conduct", query: "What is the code of conduct policy?" }
            ].map((suggest, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={(e) => handleSendChat(e, suggest.query)}
                className="text-[9px] font-bold text-violet-400 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1"
              >
                {suggest.label}
              </button>
            ))}
          </div>

          {/* Chat Footer Input */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about leave rules, CTC structures, security..."
              className="flex-1 bg-white/5 border border-white/10 text-white text-xs rounded-xl px-4 outline-none focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-500"
            />
            <button 
              type="submit" 
              className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 rounded-xl flex items-center justify-center text-white transition-all shadow-lg"
              disabled={chatLoading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: RADAR CHART & ATTRITION (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* Skill Gap Analysis Radar Chart Card */}
          <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-black text-white text-md flex items-center gap-2">
                  <BrainCircuit className="text-blue-400" size={18} /> Role Skill Coverage
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-black">Radar Analysis: Actual vs Job Matrix</p>
              </div>
              
              {/* Employee Selection Dropdown (Admins Only) */}
              {isAdmin && employeesList.length > 0 && (
                <select 
                  value={selectedEmpCode} 
                  onChange={e => setSelectedEmpCode(e.target.value)}
                  className="bg-slate-950 text-[10px] font-bold text-white border border-white/10 rounded-lg p-1.5 outline-none cursor-pointer"
                >
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.empCode} className="bg-slate-900">
                      {emp.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loadingSkills ? (
              <div className="h-[280px] flex items-center justify-center text-slate-500 text-xs italic">
                Loading skill metrics...
              </div>
            ) : radarPoints ? (
              <div className="flex justify-center items-center py-2 relative">
                <svg width="300" height="250" className="overflow-visible">
                  {/* Outer grids */}
                  {radarPoints.grids.map((g, idx) => (
                    <polygon
                      key={idx}
                      points={g}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Axes lines */}
                  {radarPoints.axes.map((a, idx) => (
                    <g key={idx}>
                      <line
                        x1={a.startX}
                        y1={a.startY}
                        x2={a.endX}
                        y2={a.endY}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                      />
                      <text
                        x={a.labelX}
                        y={a.labelY}
                        fill="rgba(148, 163, 184, 0.8)"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {a.name}
                      </text>
                    </g>
                  ))}

                  {/* Required skill shape */}
                  <polygon
                    points={radarPoints.requiredPath}
                    fill="rgba(59, 130, 246, 0.12)"
                    stroke="rgba(59, 130, 246, 0.7)"
                    strokeWidth="2"
                  />

                  {/* Actual skill shape */}
                  <polygon
                    points={radarPoints.actualPath}
                    fill="rgba(16, 185, 129, 0.18)"
                    stroke="rgba(16, 185, 129, 0.85)"
                    strokeWidth="2.5"
                  />

                  {/* Center point */}
                  <circle cx="150" cy="135" r="3" fill="#ffffff" />
                </svg>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500 text-xs italic">
                No skill metrics mapped.
              </div>
            )}

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded"></span> Required Benchmark</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Actual Rating</span>
            </div>
          </div>

          {/* Attrition Risk Card */}
          <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-lg flex-1 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-white text-md flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={18} /> Predictive Attrition Alerts
                </h3>
                {isAdmin && (
                  <button 
                    onClick={fetchAttrition}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                  >
                    <RefreshCw size={14} className={loadingRisks ? "animate-spin" : ""} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-black mb-4">ML Risk Scoring (Pre-Computed)</p>

              {isAdmin ? (
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2">
                  {loadingRisks ? (
                    <div className="text-slate-500 text-xs italic py-4">Re-scoring attrition metrics...</div>
                  ) : attritionRisks.length === 0 ? (
                    <div className="text-slate-500 text-xs italic py-4">No data loaded. Click refresh.</div>
                  ) : (
                    attritionRisks.map((r, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedRiskEmp(r)}
                        className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{r.name}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-black">
                            {r.department} • {r.empCode}
                            {r.salary !== undefined && r.salary !== null && ` • ₹${r.salary.toLocaleString()}/mo`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            r.riskLevel === 'HIGH' 
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                              : r.riskLevel === 'MEDIUM' 
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {r.attritionScore}% RISK
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl text-center my-auto">
                  <ShieldCheck className="mx-auto w-10 h-10 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-200">Retention Assessment: Satisfactory</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Your computed engagement & satisfaction score places you in the green zone (High Retention Probability).</p>
                </div>
              )}
            </div>

            {isAdmin && attritionRisks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                <span>At-Risk Workforce: {attritionRisks.filter(r => r.riskLevel === 'HIGH').length} Critical</span>
                <span className="text-slate-500">Click staff card for drill-down action reports</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 🔴 INTERACTIVE ATTRITION DRILL-DOWN MODAL */}
      <AnimatePresence>
        {selectedRiskEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl p-8 relative"
            >
              <button 
                onClick={() => setSelectedRiskEmp(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1">
                <AlertTriangle className={selectedRiskEmp.riskLevel === 'HIGH' ? "text-rose-500" : "text-amber-500"} />
                Workforce Risk Assessment
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-6">Staff Code: {selectedRiskEmp.empCode}</p>

              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedRiskEmp.name}</h4>
                    <p className="text-[10px] text-slate-400">{selectedRiskEmp.department} Department</p>
                    {selectedRiskEmp.salary !== undefined && selectedRiskEmp.salary !== null && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-1">Salary: ₹{selectedRiskEmp.salary.toLocaleString()}/mo</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Computed Score</p>
                    <p className={`text-2xl font-black ${
                      selectedRiskEmp.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                    }`}>{selectedRiskEmp.attritionScore}%</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Detected Risk Factors</h5>
                  <div className="space-y-1.5">
                    {selectedRiskEmp.riskFactors.map((f, fIdx) => (
                      <div key={fIdx} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Retention Recommendation</h5>
                  <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/20 border border-cyan-500/10 p-4 rounded-2xl">
                    {selectedRiskEmp.recommendation}
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleInitiate1on1(selectedRiskEmp.name)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle size={14} /> Schedule 1-on-1 Session
                  </button>
                  <button 
                    onClick={() => setSelectedRiskEmp(null)}
                    className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-3.5 rounded-2xl border border-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
