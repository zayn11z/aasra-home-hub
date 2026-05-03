import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "student" | "owner";
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (allowedRole && user.role !== allowedRole) {
      return <Navigate to={user.role === "owner" ? "/owner" : "/student"} replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
