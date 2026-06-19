import { useState, useEffect } from 'react';
import { Shield, Trash2, Copy, Power } from 'lucide-react';
import { listUsers, deleteUser, generateInviteCodes, listInviteCodes, deactivateInviteCode } from '../api/admin';

export default function AdminPage() {
  const [tab, setTab] = useState('users'); // 'users' | 'invites'
  const [users, setUsers] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genCount, setGenCount] = useState(1);
  const [genMaxUses, setGenMaxUses] = useState(3);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const res = await listUsers(1, 100);
      setUsers(res.data.users || []);
    } catch (err) {
      alert('加载用户失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 加载邀请码
  const loadInvites = async () => {
    setLoading(true);
    try {
      const res = await listInviteCodes();
      setInviteCodes(res.data || []);
    } catch (err) {
      alert('加载邀请码失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else loadInvites();
  }, [tab]);

  // 删除用户
  const handleDeleteUser = async (id, username) => {
    if (!confirm(`确定删除用户「${username}」吗？此操作不可撤销。`)) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  // 生成邀请码
  const handleGenerate = async () => {
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await generateInviteCodes(genCount, genMaxUses);
      setGenResult(res.data);
      loadInvites();
    } catch (err) {
      alert('生成失败: ' + err.message);
    } finally {
      setGenLoading(false);
    }
  };

  // 停用邀请码
  const handleDeactivate = async (id) => {
    if (!confirm('确定停用这个邀请码吗？')) return;
    try {
      await deactivateInviteCode(id);
      setInviteCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: 0 } : c))
      );
    } catch (err) {
      alert('停用失败: ' + err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-text-main">管理后台</h2>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub hover:bg-gray-200'
          }`}
        >
          用户管理
        </button>
        <button
          type="button"
          onClick={() => setTab('invites')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'invites' ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub hover:bg-gray-200'
          }`}
        >
          邀请码管理
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : tab === 'users' ? (
        /* 用户列表 */
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-text-sub">共 {users.length} 位用户</p>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-main truncate">
                    {u.username}
                    {u.role === 'admin' && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">管理员</span>
                    )}
                  </p>
                  <p className="text-xs text-text-sub mt-0.5">
                    注册于 {new Date(u.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                {u.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    title="删除用户"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-10 text-text-sub text-sm">暂无用户</div>
            )}
          </div>
        </div>
      ) : (
        /* 邀请码管理 */
        <div className="space-y-4">
          {/* 生成邀请码 */}
          <div className="bg-white rounded-2xl card-shadow p-5 space-y-3">
            <h3 className="text-sm font-semibold text-text-main">生成邀请码</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-sub mb-1 block">数量</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-sub mb-1 block">每个可用次数</label>
                <input
                  type="number"
                  min="1"
                  value={genMaxUses}
                  onChange={(e) => setGenMaxUses(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={genLoading}
              className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {genLoading ? '生成中...' : '生成'}
            </button>

            {genResult && (
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-700 mb-2 font-medium">生成成功：</p>
                <div className="space-y-1">
                  {genResult.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <code className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">{c.code}</code>
                      <span className="text-xs text-green-600">可用 {c.maxUses} 次</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(c.code)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 邀请码列表 */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-text-sub">共 {inviteCodes.length} 个邀请码</p>
            </div>
            <div className="divide-y divide-gray-50">
              {inviteCodes.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className={`text-sm font-bold ${c.is_active ? 'text-primary' : 'text-text-sub line-through'}`}>
                        {c.code}
                      </code>
                      {c.is_active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">有效</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-text-sub px-1.5 py-0.5 rounded-full">已停用</span>
                      )}
                    </div>
                    <p className="text-xs text-text-sub mt-0.5">
                      已用 {c.current_uses}/{c.max_uses} 次 · 创建者：{c.creator_name || '未知'}
                    </p>
                  </div>
                  {c.is_active && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(c.id)}
                      className="p-2 rounded-lg text-yellow-500 hover:bg-yellow-50 transition-colors"
                      title="停用"
                    >
                      <Power size={16} />
                    </button>
                  )}
                </div>
              ))}
              {inviteCodes.length === 0 && (
                <div className="text-center py-10 text-text-sub text-sm">暂无邀请码</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
