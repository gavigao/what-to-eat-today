import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    // 加载态：显示骨架
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
