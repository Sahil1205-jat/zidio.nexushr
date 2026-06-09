import { useState, useEffect } from "react";
import { 
  Banknote, FileDown, Edit3, Check, X, Play, History, Calendar, RefreshCw 
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

interface PayrollRun {
  id: number;
  period: string;
  processedEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: string;
  processedAt: string;
}

export default function Payroll() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempCtc, setTempCtc] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("June 2026");

  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const loggedInEmpCode = localStorage.getItem("user_id") || ""; 
  const isAdmin = userRole === "ADMIN";

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = isAdmin 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees` 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees/code/${loggedInEmpCode}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : (data ? [data] : []));
      }

      if (isAdmin) {
        await fetchRuns();
      }
    } catch (error) {
      toast.error("DB Connection Failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payroll/runs`);
      if (res.ok) {
        setPayrollRuns(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [isAdmin, loggedInEmpCode]);

  const saveCTC = async (id: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees/${id}/ctc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Number(tempCtc))
      });
      if (res.ok) {
        toast.success("CTC Updated!");
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleRunBatch = async () => {
    setRunningBatch(true);
    const toastId = toast.loading(`Triggering Spring Batch payroll for ${selectedPeriod}...`);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payroll/run?period=${selectedPeriod}`, {
        method: "POST"
      });

      if (res.ok) {
        const runData = await res.json();
        toast.success(`Batch completed successfully! Processed ${runData.processedEmployees} profiles.`, { id: toastId });
        fetchRuns();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to execute batch run.", { id: toastId });
      }
    } catch (error) {
      toast.error("Network error during batch launch.", { id: toastId });
    } finally {
      setRunningBatch(false);
    }
  };

  const generatePDF = (emp: any) => {
    try {
      const doc = new jsPDF();
      const ctc = Number(emp?.ctc) || 0;
      const tds = Math.round(ctc * 0.10);   // 10% TDS
      const pf = Math.round(ctc * 0.12);    // 12% PF
      const esi = Math.round(ctc * 0.0175); // 1.75% ESI
      const deductions = tds + pf + esi;
      const net = ctc - deductions;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("NEXUSHR ENTERPRISES", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Salary Slip - Monthly Statement", 105, 28, { align: "center" });
      doc.line(14, 35, 196, 35);

      // Details
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Employee Name : ${emp.name || 'N/A'}`, 14, 45);
      doc.text(`Employee ID   : ${(emp.empCode || 'N/A').toUpperCase()}`, 14, 53);
      doc.text(`Email         : ${emp.email || 'N/A'}`, 14, 61);
      doc.text(`Department    : ${emp.department || 'N/A'}`, 115, 45);
      doc.text(`Joining Date  : ${emp.hireDate || 'N/A'}`, 115, 53);

      // Table Logic
      autoTable(doc, {
        startY: 70,
        head: [['Earnings & Description', 'Amount', 'Deductions (Tax/Statutory)', 'Amount']],
        body: [
          ['Monthly Base Salary', `Rs. ${ctc}`, 'Income Tax (10% TDS)', `Rs. ${tds}`],
          ['Special Allowance', 'Included', 'Provident Fund (12% PF)', `Rs. ${pf}`],
          ['', '', 'Employee State Ins (1.75%)', `Rs. ${esi}`],
        ],
        foot: [
          ['Gross Compensation', `Rs. ${ctc}`, 'Total Deductions', `Rs. ${deductions}`],
          ['Take Home Net Salary', '', '', `Rs. ${net}/-`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' }
      });

      doc.save(`${emp.empCode}_Payslip.pdf`);
      toast.success("Download Started!");
    } catch (err) {
      toast.error("PDF Generation Failed");
      console.error(err);
    }
  };

  return (
    <div className="p-6 lg:p-10 text-slate-200 space-y-8">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-white flex items-center gap-3 italic">
            <Banknote className="w-10 h-10 text-emerald-500" /> Payroll Console
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
            {isAdmin ? "Admin: Salary Management & Batch Operations" : "My Compensation Details"}
          </p>
        </div>

        {/* Spring Batch Run Section (Admin Only) */}
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <select 
              value={selectedPeriod} 
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none border-none cursor-pointer"
            >
              <option value="June 2026" className="bg-slate-900">June 2026</option>
              <option value="July 2026" className="bg-slate-900">July 2026</option>
              <option value="August 2026" className="bg-slate-900">August 2026</option>
            </select>
            <button
              onClick={handleRunBatch}
              disabled={runningBatch}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/10"
            >
              <Play size={12} className={runningBatch ? "animate-spin" : ""} /> Run Batch
            </button>
          </div>
        )}
      </div>

      {/* EMPLOYEES COMPENSATION DIRECTORY */}
      <div className="max-w-6xl mx-auto bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-lg">
        <h3 className="text-lg font-black text-white mb-6">Staff Compensation Directory</h3>
        {loading ? <div className="text-center py-10 animate-pulse text-slate-500 text-xs">Loading Data...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                  <th className="pb-4 pl-4">Staff Member</th>
                  <th className="pb-4">Monthly CTC Package</th>
                  <th className="pb-4 text-right pr-4">Document Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-5 pl-4">
                      <div className="font-bold text-white text-sm">{emp.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{emp.empCode} • {emp.department || 'General'}</div>
                    </td>
                    <td className="py-5">
                      {isAdmin ? (
                        editingId === emp.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-28 bg-slate-950 border border-emerald-500 rounded-lg px-2.5 h-8 text-xs text-white" 
                              value={tempCtc} 
                              onChange={e => setTempCtc(e.target.value)} 
                            />
                            <button onClick={() => saveCTC(emp.id)} className="text-emerald-500 hover:text-emerald-400 p-1"><Check size={18}/></button>
                            <button onClick={() => setEditingId(null)} className="text-rose-500 hover:text-rose-400 p-1"><X size={18}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 font-mono text-emerald-400 group text-sm font-bold">
                            ₹{(emp.ctc || 0).toLocaleString()}
                            <button 
                              onClick={() => {setEditingId(emp.id); setTempCtc(emp.ctc || "0")}} 
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-all"
                            >
                              <Edit3 size={12}/>
                            </button>
                          </div>
                        )
                      ) : ( <div className="font-mono text-emerald-400 text-sm font-bold">₹{(emp.ctc || 0).toLocaleString()}</div> )}
                    </td>
                    <td className="py-5 text-right pr-4">
                      <button onClick={() => generatePDF(emp)} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all">
                        <FileDown className="inline mr-1.5 w-3.5 h-3.5" /> DOWNLOAD PAYSLIP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BATCH RUN HISTORY (Admin Only) */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <History size={18} className="text-cyan-400" /> Spring Batch Payroll Log
            </h3>
            <button onClick={fetchRuns} className="p-1 hover:bg-white/5 rounded text-slate-400"><RefreshCw size={14}/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payrollRuns.map((run) => (
              <div key={run.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-white">{run.period}</span>
                    <span className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      {run.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Processed: <span className="text-white">{run.processedEmployees} Employees</span></p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Disbursed Net: <span className="text-emerald-400 font-mono">₹{run.totalNet.toLocaleString()}</span></p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 font-bold uppercase">
                  Batch Run At: {run.processedAt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}