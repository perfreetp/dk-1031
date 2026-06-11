import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertTriangle, XCircle, Filter } from 'lucide-react';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/common';
import { alertApi } from '../services/api';
import type { Alert } from '../types';

export default function Alerts() {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
    const [filters, setFilters] = useState({ level: '', isResolved: '' });
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadAlerts();
    }, [page, filters]);

    const loadAlerts = async () => {
        try {
            setIsLoading(true);
            const params: any = { page, pageSize: 20 };
            if (filters.level) params.level = filters.level;
            if (filters.isResolved) params.isResolved = filters.isResolved === 'resolved';

            const response = await alertApi.getAlerts(params);
            setAlerts(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to load alerts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (id: number) => {
        try {
            await alertApi.resolveAlert(id);
            loadAlerts();
        } catch (error) {
            console.error('Failed to resolve alert:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('确定要删除这条告警吗？')) {
            try {
                await alertApi.deleteAlert(id);
                loadAlerts();
            } catch (error) {
                console.error('Failed to delete alert:', error);
            }
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'critical':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            default:
                return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'critical':
                return <Badge variant="danger">紧急</Badge>;
            case 'warning':
                return <Badge variant="warning">警告</Badge>;
            default:
                return <Badge variant="info">信息</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">告警中心</h1>
                    <p className="text-slate-500 mt-1">查看和处理所有告警信息</p>
                </div>
            </div>

            <Card>
                <div className="p-4 border-b border-slate-200">
                    <div className="flex gap-4">
                        <select
                            value={filters.level}
                            onChange={(e) => {
                                setFilters({ ...filters, level: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">全部级别</option>
                            <option value="critical">紧急</option>
                            <option value="warning">警告</option>
                            <option value="info">信息</option>
                        </select>

                        <select
                            value={filters.isResolved}
                            onChange={(e) => {
                                setFilters({ ...filters, isResolved: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">全部状态</option>
                            <option value="unresolved">未处理</option>
                            <option value="resolved">已处理</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : alerts.length === 0 ? (
                    <EmptyState
                        icon={<Bell size={48} />}
                        title="暂无告警"
                        description="所有站点运行正常，没有检测到异常"
                    />
                ) : (
                    <div className="divide-y divide-slate-200">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">{getLevelIcon(alert.level)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getLevelBadge(alert.level)}
                                            {alert.is_resolved ? (
                                                <Badge variant="success">已处理</Badge>
                                            ) : (
                                                <Badge variant="default">未处理</Badge>
                                            )}
                                        </div>
                                        <p className="font-medium text-slate-900">
                                            {alert.message || alert.type}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {alert.site?.name} • {alert.site?.url}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(alert.created_at).toLocaleString('zh-CN')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!alert.is_resolved && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleResolve(alert.id)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                处理
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(alert.id)}
                                        >
                                            删除
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            第 {pagination.page} 页，共 {pagination.totalPages} 页
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                上一页
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                下一页
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
