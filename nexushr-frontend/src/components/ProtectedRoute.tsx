import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Abhi ke liye hum localStorage mein "token" check kar rahe hain
  // Baad mein hum isko real JWT token se replace karenge [cite: 67]
  const isAuthenticated = localStorage.getItem("auth_token") === "true";

  if (!isAuthenticated) {
    // Agar login nahi hai, toh login page par bhej do
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
