import { useState, useEffect } from 'react';
import { Save, TrendingUp, TrendingDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../api/index';
import { updateAccount } from '../api/auth';
import WeightTrendChart from '../components/WeightTrendChart';

const ACTIVITY_LEVELS = [
  { value: '久坐', label: '久坐不动', desc: '几乎不运动，长时间坐着工作' },
  { value: '轻度活动', label: '轻度活动', desc: '每周轻松运动 1-3 天' },
  { value: '中度活动', label: '中度活动', desc: '每周中等强度运动 3-5 天' },
  { value: '重度活动', label: '重度活动', desc: '每周高强度运动 6-7 天' },
  { value: '运动员', label: '运动员级别', desc: '每天高强度训练或体力劳动' },
];

const GOALS = [
  { value: '减脂', label: '减脂', desc: '减少体脂，热量缺口约 400 kcal', icon: TrendingDown, color: 'text-green-500' },
  { value: '维持体重', label: '维持体重', desc: '保持当前体重和体型', icon: null, color: 'text-blue-500' },
  { value: '增肌', label: '增肌', desc: '增加肌肉量，热量盈余约 300 kcal', icon: TrendingUp, color: 'text-orange-500' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gender: '男',
    age: '',
    height: '',
    weight: '',
    activity_level: '久坐',
    goal: '维持体重',
  });
  const [tdeeData, setTdeeData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        if (res.data) {
          setProfile(res.data);
          setForm({
            gender: res.data.gender,
            age: String(res.data.age),
            height: String(res.data.height),
            weight: String(res.data.weight),
            activity_level: res.data.activity_level,
            goal: res.data.goal,
          });
          setTdeeData({
            bmr: res.data.bmr,
            tdee: res.data.tdee,
            targetCalories: res.data.targetCalories,
          });
        }
      } catch {
        // 忽略
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.age || !form.height || !form.weight) {
      alert('请填写所有身体数据');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({
        ...form,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
      });
      setProfile(res.data);
      setTdeeData({
        bmr: res.data.bmr,
        tdee: res.data.tdee,
        targetCalories: res.data.targetCalories,
      });
      alert('个人画像保存成功！');
    } catch (err) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-main">个人画像</h2>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-text-main">个人画像</h2>

      {/* 用户信息 + 退出 */}
      {user && (
        <div className="bg-white rounded-2xl p-4 card-shadow flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-main">{user.username}</p>
            <p className="text-xs text-text-sub">
              {user.role === 'admin' ? '管理员' : '普通用户'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-medium text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      )}

      {/* 修改账号 */}
      {user && <AccountSettings user={user} />}

      {/* TDEE 结果卡片 */}
      {tdeeData && (
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 shadow-sm border border-primary/10">
          <p className="text-xs text-text-sub mb-2">你的每日热量目标</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{tdeeData.targetCalories}</span>
            <span className="text-text-sub">kcal / 天</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-text-sub">
            <span>基础代谢 BMR: <strong>{tdeeData.bmr}</strong> kcal</span>
            <span>总消耗 TDEE: <strong>{tdeeData.tdee}</strong> kcal</span>
          </div>
        </div>
      )}

      {/* 体重趋势图 */}
      <WeightTrendChart />

      {/* 表单 */}
      <div className="bg-white rounded-2xl p-5 card-shadow space-y-5">
        {/* 性别 */}
        <div>
          <label className="text-sm font-medium text-text-main mb-2 block">性别</label>
          <div className="flex gap-3">
            {['男', '女'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleChange('gender', g)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.gender === g
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-text-sub hover:border-gray-300'
                }`}
              >
                {g === '男' ? '👨 男' : '👩 女'}
              </button>
            ))}
          </div>
        </div>

        {/* 年龄 / 身高 / 体重 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-text-main mb-1.5 block">年龄</label>
            <div className="relative">
              <input
                type="number"
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder="25"
                min="10"
                max="120"
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-sub">岁</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-main mb-1.5 block">身高</label>
            <div className="relative">
              <input
                type="number"
                value={form.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="170"
                min="100"
                max="250"
                className="w-full px-3 py-2.5 pr-10 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-sub">cm</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-main mb-1.5 block">体重</label>
            <div className="relative">
              <input
                type="number"
                value={form.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="65"
                min="30"
                max="300"
                step="0.1"
                className="w-full px-3 py-2.5 pr-10 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-sub">kg</span>
            </div>
          </div>
        </div>

        {/* 活动水平 */}
        <div>
          <label className="text-sm font-medium text-text-main mb-2 block">活动水平</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleChange('activity_level', level.value)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  form.activity_level === level.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    form.activity_level === level.value ? 'text-primary' : 'text-text-main'
                  }`}
                >
                  {level.label}
                </span>
                <span className="text-xs text-text-sub ml-2">{level.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 饮食目标 */}
        <div>
          <label className="text-sm font-medium text-text-main mb-2 block">饮食目标</label>
          <div className="grid grid-cols-3 gap-2">
            {GOALS.map((g) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => handleChange('goal', g.value)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
                    form.goal === g.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {Icon && <Icon size={16} className={g.color} />}
                    <span
                      className={`text-sm font-semibold ${
                        form.goal === g.value ? 'text-primary' : 'text-text-main'
                      }`}
                    >
                      {g.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-sub leading-tight text-center">{g.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? '保存中...' : '保存个人画像'}
        </button>
      </div>
    </div>
  );
}

// 修改账号子组件
function AccountSettings({ user }) {
  const [showEdit, setShowEdit] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    if (!currentPassword) { setMsg('请输入当前密码'); return; }
    if (!newUsername.trim() && !newPassword) { setMsg('至少填写一项要修改的内容'); return; }
    setSaving(true);
    setMsg('');
    try {
      const res = await updateAccount({
        currentPassword,
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword || undefined,
      });
      setMsg('修改成功！');
      setNewPassword('');
      setCurrentPassword('');
      if (res.data.username) user.username = res.data.username;
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <button
        type="button"
        onClick={() => setShowEdit(!showEdit)}
        className="flex items-center gap-2 text-sm font-medium text-text-main w-full"
      >
        <Settings size={16} className="text-text-sub" />
        修改账号
        <span className="text-xs text-text-sub ml-auto">{showEdit ? '收起 ▲' : '展开 ▼'}</span>
      </button>

      {showEdit && (
        <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
          <div>
            <label className="text-xs text-text-sub mb-1 block">新用户名</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={user.username}
              className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-text-sub mb-1 block">当前密码（必填）</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="验证身份"
              className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-text-sub mb-1 block">新密码（不填则不修改）</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少6位"
              className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {msg && (
            <div className={`text-sm rounded-lg px-3 py-2 ${msg.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {msg}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '保存中...' : '确认修改'}
          </button>
        </div>
      )}
    </div>
  );
}
