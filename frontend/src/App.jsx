import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { UtensilsCrossed, BarChart3, CalendarDays, UserCircle } from 'lucide-react';
import TodayPage from './pages/TodayPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

const navItems = [
  { to: '/', icon: UtensilsCrossed, label: '今日记录' },
  { to: '/dashboard', icon: BarChart3, label: '仪表盘' },
  { to: '/history', icon: CalendarDays, label: '历史' },
  { to: '/profile', icon: UserCircle, label: '画像' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-main pb-16 md:pb-0 md:flex">
        {/* 桌面端侧边栏 */}
        <aside className="hidden md:flex md:flex-col md:w-56 md:min-h-screen md:bg-white md:border-r md:border-gray-100 md:fixed md:left-0 md:top-0 md:pt-6">
          <div className="px-5 mb-8">
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              🍽️ 今天吃什么
            </h1>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-sub hover:bg-gray-50'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="md:ml-56 flex-1 max-w-3xl mx-auto w-full px-4 pt-4 md:pt-6 md:px-6">
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        {/* 移动端底部导航 — 毛玻璃 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bottom-nav-glass z-40">
          <div className="flex items-center justify-around h-14">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-text-sub'
                  }`
                }
              >
                {({ isActive }) => (<>
                  <Icon size={20} />
                  {label}
                  {isActive && <span className="nav-dot" />}
                </>)}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </BrowserRouter>
  );
}
