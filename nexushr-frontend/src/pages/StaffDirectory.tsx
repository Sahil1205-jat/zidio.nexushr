import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Mail, Briefcase, Calendar, Trash2, X, UserCheck, Copy, Check, Share2, Download, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";

interface Employee {
  id: number;
  empCode: string;
  name: string;
  email: string;
  department: string;
  role: "EMPLOYEE" | "ADMIN";
  status: string; // Or a more specific type like "Active" | "Inactive"
  ctc: number;
  hireDate: string;
}

export default function StaffDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success credentials modal states
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [onboardedCredentials, setOnboardedCredentials] = useState<{
    name: string;
    empCode: string;
    tempPassword: string;
    email: string;
    department: string;
    role: string;
    hireDate: string;
  } | null>(null);

  // User details from localStorage
  const userRole = localStorage.getItem("user_role") || "EMPLOYEE";
  const isAdmin = userRole === "ADMIN";

  const [newEmployee, setNewEmployee] = useState({
    empCode: "", name: "", email: "", department: "IT", role: "EMPLOYEE", status: "Active", ctc: "", hireDate: new Date().toISOString().split('T')[0]
  });

  // 1. Fetch Employees from DB
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees`);
      if (res.ok) setEmployees(await res.json());
    } catch (error) {
      toast.error("Failed to sync workforce data");
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // 2. Add New Employee Logic
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEmployee, ctc: Number(newEmployee.ctc) })
      });

      if (res.ok) {
        const onboardedEmp = await res.json();
        toast.success("New Staff Member Onboarded!");
        setShowAddForm(false);
        fetchEmployees();
        
        setOnboardedCredentials({
          name: onboardedEmp.name,
          empCode: onboardedEmp.empCode,
          tempPassword: onboardedEmp.tempPassword || "N/A",
          email: onboardedEmp.email,
          department: onboardedEmp.department || "IT",
          role: onboardedEmp.role || "EMPLOYEE",
          hireDate: onboardedEmp.hireDate || new Date().toISOString().split('T')[0]
        });
        setShowCredentialsModal(true);

        setNewEmployee({
          empCode: "", name: "", email: "", department: "IT", role: "EMPLOYEE", status: "Active", ctc: "", hireDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      toast.error("Error adding employee");
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Employee Logic (🔥 THE NEW FEATURE)
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${name} has been removed from system.`);
        // Local state update for instant animation
        setEmployees(employees.filter(emp => emp.id !== id));
      } else {
        toast.error("Delete failed. Check backend.");
      }
    } catch (error) {
      toast.error("Connection error while deleting");
    }
  };

  // 4. Generate Offer Letter / Welcome Pack PDF
  const generateOfferLetterPDF = (emp: typeof onboardedCredentials) => {
    if (!emp) return;
    try {
      const doc = new jsPDF();
      const pageWidth = 210;
      
      // Sleek Top Header Banner (Corporate Slate Style)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 42, "F");
      
      // Company Brand Logo & Subtitle
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("NEXUSHR", 20, 20);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("ENTERPRISE WORKFORCE PORTAL", 20, 26);
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("OFFICIAL WELCOME PACK", 190, 24, { align: "right" });
      
      // Document Title / Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("LETTER OF ONBOARDING", 20, 60);
      
      // Horizontal Accent Line under Title
      doc.setFillColor(37, 99, 235); // blue-600
      doc.rect(20, 64, 40, 1.5, "F");
      
      // Date and Salutation
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Date: ${emp.hireDate}`, 20, 76);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`Dear ${emp.name},`, 20, 88);
      
      // Welcoming Corporate Body Paragraph
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700
      
      const welcomeText = 
        `On behalf of NexusHR Enterprises, we are absolutely thrilled to welcome you to our team as a ${emp.role}. ` +
        `Your application and qualifications impressed us, and we are confident that your expertise will be a highly valuable asset to the ${emp.department} department.\n\n` +
        `As part of your onboarding, your official employee account has been created on the NexusHR portal. ` +
        `You are requested to login using the credentials listed below, review our workspace guidelines, and update your temporary password immediately upon your first login for security purposes.`;
        
      const splitWelcome = doc.splitTextToSize(welcomeText, 170);
      doc.text(splitWelcome, 20, 96);
      
      // Styled Credentials Box
      const credsStartY = 135;
      
      // Subtle gray background box with a light blue left accent border
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, credsStartY, 170, 72, "F");
      
      doc.setFillColor(37, 99, 235); // blue-600 left-border
      doc.rect(20, credsStartY, 3, 72, "F");
      
      // Credentials Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("YOUR PORTAL CREDENTIALS", 28, credsStartY + 10);
      
      // Details inside box
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      
      doc.text("Portal Link:", 28, credsStartY + 24);
      doc.text("Employee Name:", 28, credsStartY + 32);
      doc.text("Official Email:", 28, credsStartY + 40);
      doc.text("Portal Username (Code):", 28, credsStartY + 48);
      doc.text("Temporary Password:", 28, credsStartY + 58);
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("http://localhost:5173", 80, credsStartY + 24);
      doc.text(emp.name, 80, credsStartY + 32);
      doc.text(emp.email, 80, credsStartY + 40);
      
      doc.setFont("Helvetica", "bold");
      doc.text(emp.empCode, 80, credsStartY + 48);
      
      // Highlight the password in custom color and spacing
      doc.setTextColor(217, 119, 6); // amber-600
      doc.setFont("Courier", "bold");
      doc.setFontSize(12);
      doc.text(emp.tempPassword, 80, credsStartY + 58);
      
      // Reset Font for box subtitle info
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("*Note: Please do not share these details. Passwords must be updated on first access.", 28, credsStartY + 67);
      
      // Signature & Closing Block
      const signStartY = 222;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text("Once again, welcome aboard. We look forward to working together to reach new milestones.", 20, signStartY);
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Sincerely,", 20, signStartY + 14);
      
      // Mock Signature Accent Line
      doc.setFillColor(226, 232, 240); // slate-200
      doc.rect(20, signStartY + 28, 45, 0.5, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("NexusHR Services", 20, signStartY + 34);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("System Generated Onboarding Document", 20, signStartY + 39);
      
      // Footer Accent Bar
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 287, pageWidth, 10, "F");
      
      // Save the PDF
      doc.save(`NexusHR_Welcome_${emp.empCode}.pdf`);
      toast.success("Welcome Pack PDF Downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF welcome pack");
      console.error(err);
    }
  };

  return (
    <div className="p-6 lg:p-10 font-sans text-slate-200 bg-[#020617] min-h-screen">

      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl font-black text-white flex items-center gap-3 italic">
            <Users className="w-10 h-10 text-blue-500" /> Staff Directory
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Core Human Resources</p>
        </motion.div>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />} {showAddForm ? "CANCEL" : "ONBOARD STAFF"}
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* ADD FORM (Animated Slide Down) */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <form onSubmit={handleAddEmployee} className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-4 gap-6 shadow-2xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Full Name</label>
                  <input required value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Emp Code</label>
                  <input required value={newEmployee.empCode} onChange={e => setNewEmployee({ ...newEmployee, empCode: e.target.value.trim().toUpperCase() })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-400 uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Email</label>
                  <input required type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Role</label>
                  <select value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value as "EMPLOYEE" | "ADMIN" })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 appearance-none h-[46px] outline-none focus:ring-1 focus:ring-blue-400">
                    <option>EMPLOYEE</option><option>ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Department</label>
                  <select value={newEmployee.department} onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 appearance-none h-[46px] outline-none focus:ring-1 focus:ring-blue-400">
                    <option>IT</option><option>HR</option><option>Sales</option><option>Finance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Monthly CTC</label>
                  <input required type="number" value={newEmployee.ctc} onChange={e => setNewEmployee({ ...newEmployee, ctc: e.target.value })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Hire Date</label>
                  <input required type="date" value={newEmployee.hireDate} onChange={e => setNewEmployee({ ...newEmployee, hireDate: e.target.value })} className="w-full bg-white/5 border-white/10 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <button disabled={loading} className="md:col-span-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50">
                  {loading ? "PROCESSING..." : "CONFIRM ONBOARDING"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EMPLOYEES GRID */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {employees.map((emp) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-[2.5rem] p-6 hover:border-blue-400/50 transition-all relative group shadow-xl hover:shadow-blue-500/10"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 font-black text-2xl">
                    {(emp.name || "?").charAt(0).toUpperCase()}
                  </div>
                  {/* 🔥 DELETE BUTTON (Admin Only) */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all duration-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-black text-white">{emp.name}</h3>
                  <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-wider">
                    <UserCheck size={12} /> {emp.empCode}
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                    <Briefcase size={14} className="text-slate-600" /> {emp.department}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold truncate">
                    <Mail size={14} className="text-slate-600" /> {emp.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                    <Calendar size={14} className="text-slate-600" /> Joined {emp.hireDate}
                  </div>
                </div>

                <div className="absolute top-6 right-16">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${emp.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                    {emp.role}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {employees.length === 0 && (
          <div className="text-center py-20 bg-slate-900/30 border-slate-800 border border-dashed rounded-[3rem]">
            <Users className="mx-auto w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No personnel data found</p>
          </div>
        )}
      </div>

      {/* Onboarding Credentials Success Modal */}
      <AnimatePresence>
        {showCredentialsModal && onboardedCredentials && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCredentialsModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0f172a] border border-white/10 w-full max-w-md relative shadow-2xl rounded-3xl p-8 z-[10000] overflow-y-auto max-h-[90vh] flex flex-col items-center text-center"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowCredentialsModal(false)} 
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              {/* Glowing Success Badge */}
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                <ShieldCheck size={36} />
              </div>

              <h3 className="text-2xl font-black text-white italic tracking-tight">Onboarding Successful!</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-xs">
                Welcome pack is ready for <strong>{onboardedCredentials.name}</strong>. Bypassed SMTP/Email delivery for reliability.
              </p>

              {/* Credentials Card */}
              <div className="w-full bg-slate-950/70 border border-white/5 rounded-2xl p-5 my-6 space-y-4 text-left">
                {/* Email */}
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Email Address</label>
                  <p className="text-slate-200 font-bold text-sm truncate mt-0.5">{onboardedCredentials.email}</p>
                </div>

                {/* Username / Employee Code */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Username / Employee Code</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(onboardedCredentials.empCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                        toast.success("Username copied!");
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCode ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-white font-black text-base mt-0.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 select-all">{onboardedCredentials.empCode}</p>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Temporary Password</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(onboardedCredentials.tempPassword);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                        toast.success("Password copied!");
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                    >
                      {copiedPass ? <Check size={12} /> : <Copy size={12} />}
                      {copiedPass ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-amber-400 font-black text-base mt-0.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 select-all font-mono tracking-widest">{onboardedCredentials.tempPassword}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                {/* Share on WhatsApp */}
                <button
                  onClick={() => {
                    const text = `Hi ${onboardedCredentials.name},\n\nWelcome to NexusHR! Your account has been successfully created.\n\nHere are your onboarding login credentials:\n• Portal Link: http://localhost:5173\n• Username: ${onboardedCredentials.empCode}\n• Temporary Password: ${onboardedCredentials.tempPassword}\n\nPlease update your password after your first login.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 text-xs"
                >
                  <Share2 size={16} /> SHARE ON WHATSAPP
                </button>

                {/* Download Credentials as PDF */}
                <button
                  onClick={() => generateOfferLetterPDF(onboardedCredentials)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all text-xs"
                >
                  <Download size={16} /> DOWNLOAD WELCOME LETTER (PDF)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}