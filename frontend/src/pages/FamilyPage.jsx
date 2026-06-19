import { useState, useEffect } from 'react';
import { Users, Plus, LogOut, Copy } from 'lucide-react';
import { createFamily, joinFamily, getMyFamily, leaveFamily } from '../api/family';

export default function FamilyPage() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 创建
  const [showCreate, setShowCreate] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);

  // 加入
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const res = await getMyFamily();
      setFamilies(res.data || []);
    } catch (err) {
      console.error('加载家庭失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFamilies(); }, []);

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setCreating(true);
    try {
      await createFamily(familyName.trim());
      await loadFamilies();
      setShowCreate(false);
      setFamilyName('');
    } catch (err) {
      alert('创建失败: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await joinFamily(joinCode.trim());
      await loadFamilies();
      setJoinCode('');
    } catch (err) {
      alert('加入失败: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (familyId, familyName) => {
    if (!confirm(`确定退出「${familyName}」吗？`)) return;
    try {
      await leaveFamily(familyId);
      await loadFamilies();
    } catch (err) {
      alert('退出失败: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2"><Users size={20} className="text-primary" /><h2 className="text-lg font-bold text-text-main">家庭</h2></div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-text-main">家庭</h2>
        <span className="text-xs text-text-sub ml-auto">{families.length} 个家庭</span>
      </div>

      {/* 操作区：创建 + 加入 */}
      <div className="bg-white rounded-2xl card-shadow p-4 space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> 创建新家庭
          </button>
        </div>

        {showCreate && (
          <div className="space-y-2 pt-1">
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="给家庭起个名字"
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <button
                type="button" onClick={handleCreate} disabled={creating}
                className="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? '创建中...' : '确认'}
              </button>
              <button
                type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-100 text-text-sub text-sm rounded-xl hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="输入6位配对码加入"
            maxLength={6}
            className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-widest text-center"
          />
          <button
            type="button" onClick={handleJoin} disabled={joining}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {joining ? '...' : '加入'}
          </button>
        </div>
      </div>

      {/* 家庭列表 */}
      {families.length === 0 && (
        <div className="bg-white rounded-2xl card-shadow p-5 text-center">
          <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
          <p className="text-text-main font-medium mb-1">还没有加入家庭</p>
          <p className="text-text-sub text-sm">创建或加入家庭，与家人互看饮食记录</p>
        </div>
      )}

      {families.map((f) => (
        <div key={f.id} className="bg-white rounded-2xl card-shadow overflow-hidden">
          {/* 家庭头部 */}
          <div className="p-5 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                {f.name}
                {f.pairing_code && (
                  <span className="text-xs font-normal text-text-sub">· {f.members?.length || 0} 人</span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(f.pairing_code)}
                className="flex items-center gap-1 text-xs text-primary px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Copy size={12} /> 复制配对码
              </button>
            </div>
            <p className="text-sm text-text-sub">
              配对码：<code className="bg-gray-100 px-2 py-1 rounded text-primary font-bold tracking-widest">{f.pairing_code}</code>
            </p>
          </div>

          {/* 成员列表 */}
          <div className="divide-y divide-gray-50">
            {f.members?.map((m) => (
              <div key={m.id || m.username} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-base">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main flex items-center gap-2">
                    {m.username}
                    {m.role === 'owner' && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">创建者</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 退出 */}
          <div className="px-5 py-3 bg-gray-50/50">
            <button
              type="button"
              onClick={() => handleLeave(f.id, f.name)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={13} /> 退出此家庭
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
