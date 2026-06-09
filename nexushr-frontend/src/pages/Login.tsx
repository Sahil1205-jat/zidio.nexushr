import { useState, useEffect } from "react";
import { ShieldCheck, Lock, User, LayoutGrid, Mail, BadgeCheck, Briefcase, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function Login() {
  // Existing States
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New States for Request Access Modal
  const [showModal, setShowModal] = useState(false);
  const [reqDetails, setReqDetails] = useState({
    name: "",
    // Added theme state for Login page
    email: "",
    empId: "",
    dept: ""
  });
  const [reqLoading, setReqLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Hardcoded admin logins (case-insensitive)
    if (empCode.toLowerCase() === "sahil@nexushr" && password === "admin123") {
      localStorage.setItem("auth_token", "dummy-admin-token");
      localStorage.setItem("user_role", "ADMIN");
      localStorage.setItem("user_id", "EMP001");
      localStorage.setItem("user_name", "Sahil Sepat");
      localStorage.setItem("user_email", "sahil.sepat@nexushr.com");
      localStorage.setItem("user_hire_date", "2024-01-01");
      localStorage.setItem("user_department", "ADMIN"); // Admins can see all channels

      toast.success("NexusHR: Welcome Boss! 👑", {
        style: { background: '#2563eb', color: '#fff', borderRadius: '10px' }
      });

      setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
      return;
    }
    if (empCode.toLowerCase() === "rudra@nexushr" && password === "admin123") {
      localStorage.setItem("auth_token", "dummy-admin-token");
      localStorage.setItem("user_role", "ADMIN");
      localStorage.setItem("user_id", "EMP002");
      localStorage.setItem("user_name", "Rudra Tiwari");
      localStorage.setItem("user_email", "rudra.tiwari@nexushr.com");
      localStorage.setItem("user_hire_date", "2024-01-01");
      localStorage.setItem("user_department", "ADMIN"); // Admins can see all channels

      toast.success("NexusHR: Welcome Boss! 👑", {
        style: { background: '#2563eb', color: '#fff', borderRadius: '10px' }
      });

      setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
      return;
    }
    if (empCode.toLowerCase() === "aditi@nexushr" && password === "admin123") {
      localStorage.setItem("auth_token", "dummy-admin-token");
      localStorage.setItem("user_role", "ADMIN");
      localStorage.setItem("user_id", "EMP001");
      localStorage.setItem("user_name", "Aditi Gupta");
      localStorage.setItem("user_email", "aditi.gupta@nexushr.com");
      localStorage.setItem("user_hire_date", "2024-01-01");
      localStorage.setItem("user_department", "ADMIN"); // Admins can see all channels

      toast.success("NexusHR: Welcome Boss! 👑", {
        style: { background: '#2563eb', color: '#fff', borderRadius: '10px' }
      });

      setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empCode, password })
      });

      if (res.ok) {
        const data = await res.json();
        // Check if a token or a valid employee profile was returned
        if (data && (data.token || data.empCode)) {
          localStorage.setItem("auth_token", data.token || "dummy-employee-token");
          localStorage.setItem("user_role", data.role);
          localStorage.setItem("user_id", data.empCode);
          localStorage.setItem("user_name", data.name);
          localStorage.setItem("user_email", data.email);
          localStorage.setItem("user_hire_date", data.hireDate);
          localStorage.setItem("user_department", data.department);

          toast.success(`Welcome to NexusHR!`, {
            style: { background: '#2563eb', color: '#fff' }
          });

          setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
        } else {
          // Handle cases where the server returns 200 OK but invalid payload
          toast.error("Login failed: Invalid response from server.", {
            style: { background: '#ef4444', color: '#fff' }
          });
          setLoading(false);
        }
      } else {
        toast.error("Invalid Username or Password!", {
          style: { background: '#ef4444', color: '#fff' }
        });
        setLoading(false);
      }
    } catch (error) {
      toast.error("Server connection failed! Is Spring Boot running?");
      setLoading(false);
    }
  };

  // New Logic to Handle Access Request
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);

    try {
      // Yahan tujhe apne Spring Boot backend par ek naya endpoint banana padega
      // jo JavaMailSender use karke 'syncwork0@gmail.com' par mail bheje.
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqDetails)
      });

      if (res.ok) {
        toast.success("Access request sent to Admin!", {
          style: { background: '#10b981', color: '#fff' }
        });
        setShowModal(false); // Close modal on success
        setReqDetails({ name: "", email: "", empId: "", dept: "" }); // Reset form
      } else {
        toast.error("Failed to send request. Try again.");
      }
    } catch (error) {
      // Fallback for UI testing before backend is ready
      toast.success("Mock: Access request sent to admin!", {
        style: { background: '#10b981', color: '#fff' }
      });
      setShowModal(false);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans relative bg-[#020617]">

      {/* 🟦 LEFT SIDE: DARK BRANDING PANE */}
      <div className="hidden lg:flex w-1/2 bg-[#020617] text-white relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight">NexusHR</span>
        </div>

        <div className="relative z-10 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400 mb-6">
            <ShieldCheck className="w-3 h-3" /> Enterprise Security
          </div>
          <h2 className="text-7xl font-black leading-[1.1] tracking-tighter mb-8 text-white">
            Manage your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Workforce</span> <br />
            Securely.
          </h2>
          <p className="max-w-md text-slate-400 text-lg font-medium leading-relaxed">
            Welcome to the ultimate HR Management System powered by Spring Boot, React, and PostgreSQL.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">API Status:</span>
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ⬜ RIGHT SIDE: LOGIN FORM PANE */}
      <div className="w-full lg:w-1/2 bg-slate-900 flex flex-col items-center justify-center p-8 lg:p-24 relative">

        <div className="w-full max-w-md space-y-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="text-slate-500 font-medium">Enter your credentials to access the secure portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Username / EMP Code</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  required
                  placeholder="EMPLOYEE CODE"
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value.trim())}
                  className="h-14 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-2xl pl-12 font-bold text-lg focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-2xl pl-12 pr-12 font-bold text-lg tracking-widest focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              {loading ? "Syncing..." : "Access Portal →"}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-6 pt-4">
            {/* TRIGGER MODAL BUTTON */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              Don't have an account? Request Access
            </button>

            <div className="pt-8 border-t border-slate-800 w-full text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Developed by Sahil Sepat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 REQUEST ACCESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight">Request Access</h3>
              <p className="text-sm text-slate-400 font-medium">
                Fill details to send an access request to the admin portal.
              </p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    required
                    value={reqDetails.name}
                    onChange={(e) => setReqDetails({ ...reqDetails, name: e.target.value })}
                    placeholder="Name"
                    className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-xl pl-11 font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    required
                    type="email"
                    value={reqDetails.email}
                    onChange={(e) => setReqDetails({ ...reqDetails, email: e.target.value })}
                    placeholder="emp@nexushr.com"
                    className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-xl pl-11 font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Grid for Emp ID and Dept */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Emp ID</Label>
                  <div className="relative group">
                    <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      required
                      value={reqDetails.empId}
                      onChange={(e) => setReqDetails({ ...reqDetails, empId: e.target.value })}
                      placeholder="EMP-1024"
                      className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-xl pl-11 font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      required
                      value={reqDetails.dept}
                      onChange={(e) => setReqDetails({ ...reqDetails, dept: e.target.value })}
                      placeholder="Engineering"
                      className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-xl pl-11 font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={reqLoading}
                className="w-full h-12 mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-md shadow-lg shadow-slate-900/20 transition-all active:scale-95"
              >
                {reqLoading ? "Sending Request..." : "Send Request to Admin"}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}