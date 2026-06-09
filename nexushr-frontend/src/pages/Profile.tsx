import { useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Mail, Calendar, Key, X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userName = localStorage.getItem("user_name") || "N/A";
  const userRole = localStorage.getItem("user_role") || "N/A";
  const empCode = localStorage.getItem("user_id") || "N/A";
  const email = localStorage.getItem("user_email") || "N/A";
  const hireDate = localStorage.getItem("user_hire_date") || "N/A";

  return (
    <div className="p-10 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-black/20 border-white/10 rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl backdrop-blur-xl"
      >
        {/* Background decorative elements */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"
        />

        <div className="relative text-center">
          {/* Profile Header */}
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl font-black text-white shadow-2xl mb-8 transform -rotate-3">
            {(userName || "?").charAt(0)}
          </div>
          <h2 className="text-4xl font-black text-white mb-2">{userName}</h2>
          <span className="px-4 py-1 bg-slate-800 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">
            {userRole} ? {empCode}
          </span>

          {/* Profile Details */}
          <div className="mt-10 space-y-4 text-left">
            {[
              { icon: Mail, label: "Email Address", val: email },
              { icon: Shield, label: "Access Level", val: userRole },
              { icon: Calendar, label: "Onboarding Date", val: hireDate },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl">
                <item.icon className="text-slate-400" size={20} />
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase">{item.label}</p>
                  <p className="text-sm font-bold text-slate-200">{item.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reset Password Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-8 h-14 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black flex items-center justify-center gap-2 transition-all"
          >
            <Key size={18} /> CHANGE PASSWORD
          </button>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      {isModalOpen && (
        <PasswordChangeModal
          empCode={empCode}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// --- Password Change Modal Component ---
interface PasswordChangeModalProps {
  empCode: string;
  onClose: () => void;
}

function PasswordChangeModal({ empCode, onClose }: PasswordChangeModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States for password visibility
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    const toastId = toast.loading("Changing password...");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/employees/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empCode,
          oldPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to change password.");
      }

      toast.success("Password changed successfully!", { id: toastId });
      onClose();

    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={24} />
        </button>
        <h3 className="text-2xl font-bold text-white mb-6">Change Your Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              placeholder="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-white/5 border-white/10 text-white rounded-lg p-3 pr-10 outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white">
              {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border-white/10 text-white rounded-lg p-3 pr-10 outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white">
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border-white/10 text-white rounded-lg p-3 pr-10 outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg p-3 mt-2"
          >
            Update Password
          </button>
        </form>
      </motion.div>
    </div>
  );
}