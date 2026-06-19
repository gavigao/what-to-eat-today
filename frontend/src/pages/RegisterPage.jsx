import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password || !inviteCode.trim()) {
      setError('请填写所有必填项');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), password, null, inviteCode.trim().toUpperCase());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">🍽️ 今天吃什么</h1>
          <p className="text-text-sub text-sm mt-2">使用邀请码注册新账号</p>
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-main mb-1.5 block">用户名 *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="字母、数字，不超过50字"
                autoFocus
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-main mb-1.5 block">密码 *（至少6位）</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位密码"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-main mb-1.5 block">确认密码 *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再输一遍密码"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-main mb-1.5 block">邀请码 *</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="输入你的邀请码"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus size={18} /> {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="text-center text-xs text-text-sub mt-4">
            已有账号？{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              去登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
