import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, AlertTriangle, Archive, Activity, Bell, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, StatCard, Badge, Button } from '../components/common';
import { statsApi } from '../services/api';
import type { DashboardStats } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setIsLoading(true);
            const response = await statsApi.getDashboard();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
                    <p className="text-slate-500 mt-1">系统运行状态概览</p>
                </div>
                <Button onClick={() => navigate('/sites/new')}>
                    <Globe className="w-4 h-4 mr-2" />
                    添加站点
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="总站点数"
                    value={stats.totalSites}
                    icon={<Globe size={24} />}
                    color="blue"
                />
                <StatCard
                    title="活跃站点"
                    value={stats.activeSites}
                    icon={<Activity size={24} />}
                    color="green"
                />
                <StatCard
                    title="未处理告警"
                    value={stats.unresolvedAlerts}
                    icon={<AlertTriangle size={24} />}
                    color={stats.unresolvedAlerts > 0 ? 'red' : 'green'}
                />
                <StatCard
                    title="历史版本"
                    value={stats.totalVersions}
                    icon={<Archive size={24} />}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                采集趋势
                            </h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.crawlTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-red-600" />
                                最近告警
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')}>
                                查看全部
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stats.recentAlerts.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">暂无告警</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentAlerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/alerts`)}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full mt-2 ${
                                                alert.level === 'critical'
                                                    ? 'bg-red-500'
                                                    : alert.level === 'warning'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-blue-500'
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {alert.message || alert.type}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {alert.site?.name} •{' '}
                                                {new Date(alert.created_at).toLocaleString('zh-CN')}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                alert.level === 'critical'
                                                    ? 'danger'
                                                    : alert.level === 'warning'
                                                    ? 'warning'
                                                    : 'info'
                                            }
                                        >
                                            {alert.level === 'critical'
                                                ? '紧急'
                                                : alert.level === 'warning'
                                                ? '警告'
                                                : '信息'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        站点分布（按标签）
                    </h3>
                </CardHeader>
                <CardContent>
                    {stats.sitesByTag.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">暂无数据</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {stats.sitesByTag.map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden"
                                    style={{ borderLeft: `4px solid ${item.color}` }}
                                    onClick={() => navigate(`/sites?tagId=${item.tagId}`)}
                                >
                                    <p className="text-2xl font-bold text-slate-900">{item.count}</p>
                                    <p className="text-sm text-slate-600 mt-1">{item.tag}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/sites')}
                >
                    <CardContent className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">管理站点</p>
                            <p className="text-sm text-slate-500">查看和管理监控站点</p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/archives')}
                >
                    <CardContent className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Archive className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">档案库</p>
                            <p className="text-sm text-slate-500">浏览历史版本记录</p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate('/logs')}
                >
                    <CardContent className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">运行日志</p>
                            <p className="text-sm text-slate-500">查看系统运行日志</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
