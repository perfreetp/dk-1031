import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Globe,
    Archive,
    Bell,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: '仪表盘' },
    { path: '/sites', icon: Globe, label: '站点清单' },
    { path: '/archives', icon: Archive, label: '档案库' },
    { path: '/alerts', icon: Bell, label: '告警中心' },
    { path: '/logs', icon: FileText, label: '运行日志' },
    { path: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <aside
            className={`bg-slate-900 text-white h-screen fixed left-0 top-0 transition-all duration-300 ${
                collapsed ? 'w-16' : 'w-64'
            }`}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
                {!collapsed && (
                    <h1 className="text-xl font-bold text-blue-400">网站档案馆</h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="p-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {!collapsed && (
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-sm text-slate-400">版本 1.0.0</p>
                        <p className="text-xs text-slate-500 mt-1">Website Archive</p>
                    </div>
                </div>
            )}
        </aside>
    );
}
