import { useState, useEffect } from 'react';
import { Users, Plus, LogOut, Copy } from 'lucide-react';
import { createFamily, joinFamily, getMyFamily, leaveFamily } from '../api/family';

export default function FamilyPage() {
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 创建家庭
  const [showCreate, setShowCreate] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);

  // 加入家庭
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // 加载我的家庭
  const loadFamily = async () => {
    setLoading(true);
    try {
      const res = await getMyFamily();
      if (res.data) {
        setFamily(res.data.family);
        setMembers(res.data.members || []);
      } else {
        setFamily(null);
        setMembers([]);
      }
    } catch (err) {
      console.error('加载家庭信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFamily(); }, []);

  // 创建
  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setCreating(true);
    try {
      const res = await createFamily(familyName.trim());
      setFamily(res.data);
      setMembers([{ id: null, username: '我', role: 'owner' }]);
      setShowCreate(false);
      setFamilyName('');
    } catch (err) {
      alert('创建失败: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // 加入
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      await joinFamily(joinCode.trim());
      await loadFamily();
      setJoinCode('');
    } catch (err) {
      alert('加入失败: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  // 退出
  const handleLeave = async () => {
    if (!confirm('确定退出家庭吗？')) return;
    try {
      await leaveFamily();
      setFamily(null);
      setMembers([]);
    } catch (err) {
      alert('退出失败: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-main">家庭</h2>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-text-main">家庭</h2>
      </div>

      {/* 无家庭：创建/加入 */}
      {!family && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl card-shadow p-5 text-center">
            <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
            <p className="text-text-main font-medium mb-1">还没有加入家庭</p>
            <p className="text-text-sub text-sm mb-4">
              创建或加入家庭，与家人互看饮食记录
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(true); setShowCreate(true); }}
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> 创建家庭
              </button>
            </div>
          </div>

          {/* 创建表单 */}
          {showCreate && (
            <div className="bg-white rounded-2xl card-shadow p-5 space-y-3">
              <h3 className="text-sm font-semibold text-text-main">创建新家庭</h3>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="给家庭起个名字"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate} disabled={creating}
                  className="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating ? '创建中...' : '确认创建'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-100 text-text-sub text-sm rounded-xl hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 加入表单 */}
          <div className="bg-white rounded-2xl card-shadow p-5 space-y-3">
            <h3 className="text-sm font-semibold text-text-main">通过配对码加入</h3>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="输入6位配对码"
              maxLength={6}
              className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-widest text-center"
            />
            <button
              type="button"
              onClick={handleJoin} disabled={joining}
              className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50"
            >
              {joining ? '加入中...' : '加入家庭'}
            </button>
          </div>
        </div>
      )}

      {/* 有家庭：详情 */}
      {family && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl card-shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-main">{family.name}</h3>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(family.pairing_code)}
                className="flex items-center gap-1 text-xs text-primary px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                title="复制配对码"
              >
                <Copy size={12} /> 复制配对码
              </button>
            </div>

            <p className="text-sm text-text-sub mb-3">
              配对码：<code className="bg-gray-100 px-2 py-1 rounded text-primary font-bold tracking-widest">{family.pairing_code}</code>
              <span className="ml-2 text-xs">分享给家人即可加入</span>
            </p>
          </div>

          {/* 成员列表 */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-text-sub">家庭成员 · {members.length} 人</p>
            </div>
            <div className="divide-y divide-gray-50">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main flex items-center gap-2">
                      {m.username}
                      {m.role === 'owner' && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">家庭创建者</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLeave}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} /> 退出家庭
          </button>
        </div>
      )}
    </div>
  );
}
