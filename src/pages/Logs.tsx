import { useEffect, useState } from 'react';
import { FileText, Info, AlertTriangle, XCircle, Search, Download } from 'lucide-react';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/common';
import { logApi } from '../services/api';
import type { Log } from '../types';

export default function Logs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 50, totalPages: 0 });
    const [filters, setFilters] = useState({ level: '', search: '' });
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadLogs();
    }, [page, filters]);

    const loadLogs = async () => {
        try {
            setIsLoading(true);
            const params: any = { page, pageSize: 50 };
            if (filters.level) params.level = filters.level;
            if (filters.search) params.search = filters.search;

            const response = await logApi.getLogs(params);
            setLogs(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadLogs();
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'warn':
                return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
            default:
                return <Info className="w-4 h-4 text-blue-600" />;
        }
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'error':
                return <Badge variant="danger">错误</Badge>;
            case 'warn':
                return <Badge variant="warning">警告</Badge>;
            default:
                return <Badge variant="info">信息</Badge>;
        }
    };

    const handleExport = async () => {
        try {
            const data = await logApi.exportLogs(filters);
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export logs:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">运行日志</h1>
                    <p className="text-slate-500 mt-1">查看系统运行日志和调试信息</p>
                </div>
                <Button variant="secondary" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    导出日志
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-slate-200">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="搜索日志内容..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filters.level}
                            onChange={(e) => {
                                setFilters({ ...filters, level: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">全部级别</option>
                            <option value="info">信息</option>
                            <option value="warn">警告</option>
                            <option value="error">错误</option>
                        </select>
                        <Button type="submit">搜索</Button>
                    </form>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : logs.length === 0 ? (
                    <EmptyState
                        icon={<FileText size={48} />}
                        title="暂无日志"
                        description="系统运行日志将显示在这里"
                    />
                ) : (
                    <div className="font-mono text-sm">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getLevelBadge(log.level)}
                                            <span className="text-xs text-slate-400">
                                                {new Date(log.created_at).toLocaleString('zh-CN')}
                                            </span>
                                            {log.site && (
                                                <span className="text-xs text-slate-500">
                                                    [{log.site.name}]
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-700 break-all">{log.message}</p>
                                        {log.details && (
                                            <pre className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600 overflow-x-auto">
                                                {log.details}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            第 {pagination.page} 页，共 {pagination.totalPages} 页，共 {pagination.total} 条
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
