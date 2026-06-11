import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Pause, Play, Trash2, Edit, Eye, RefreshCw, Globe } from 'lucide-react';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/common';
import { siteApi, tagApi } from '../services/api';
import { useSiteStore } from '../stores';
import type { Site, Tag } from '../types';

export default function Sites() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { sites, tags, isLoading, pagination, setSites, setTags, setLoading, setPagination } = useSiteStore();
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState<number | null>(null);

    useEffect(() => {
        loadSites();
        loadTags();
    }, [searchParams]);

    useEffect(() => {
        setTags(tags);
    }, [tags]);

    const loadSites = async () => {
        try {
            setLoading(true);
            const params = {
                page: parseInt(searchParams.get('page') || '1'),
                pageSize: 20,
                status: searchParams.get('status') || undefined,
                tagId: searchParams.get('tagId') ? parseInt(searchParams.get('tagId')!) : undefined,
                search: searchParams.get('search') || undefined,
                sortBy: searchParams.get('sortBy') || 'created_at',
                sortOrder: searchParams.get('sortOrder') || 'desc',
            };
            const response = await siteApi.getSites(params);
            setSites(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to load sites:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTags = async () => {
        try {
            const response = await tagApi.getTags();
            setTags(response.data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const newParams = new URLSearchParams(searchParams);
        if (searchQuery) {
            newParams.set('search', searchQuery);
        } else {
            newParams.delete('search');
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleStatusFilter = (status: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (status) {
            newParams.set('status', status);
        } else {
            newParams.delete('status');
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
        setStatusFilter(status);
    };

    const handlePauseSite = async (site: Site) => {
        try {
            await siteApi.pauseSite(site.id, 'Manual pause');
            loadSites();
        } catch (error) {
            console.error('Failed to pause site:', error);
        }
        setMenuOpen(null);
    };

    const handleResumeSite = async (site: Site) => {
        try {
            await siteApi.resumeSite(site.id);
            loadSites();
        } catch (error) {
            console.error('Failed to resume site:', error);
        }
        setMenuOpen(null);
    };

    const handleDeleteSite = async (site: Site) => {
        if (confirm(`确定要删除站点 "${site.name}" 吗？`)) {
            try {
                await siteApi.deleteSite(site.id);
                loadSites();
            } catch (error) {
                console.error('Failed to delete site:', error);
            }
        }
        setMenuOpen(null);
    };

    const handleCrawlSite = async (site: Site) => {
        try {
            await fetch(`/api/sites/${site.id}/crawl`, { method: 'POST' });
            alert('采集任务已触发');
        } catch (error) {
            console.error('Failed to crawl site:', error);
        }
        setMenuOpen(null);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="success">运行中</Badge>;
            case 'paused':
                return <Badge variant="warning">已暂停</Badge>;
            case 'error':
                return <Badge variant="danger">错误</Badge>;
            default:
                return <Badge>未知</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">站点清单</h1>
                    <p className="text-slate-500 mt-1">管理您监控的所有网站</p>
                </div>
                <Button onClick={() => navigate('/sites/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加站点
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索站点名称、URL..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </form>

                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">全部状态</option>
                                <option value="active">运行中</option>
                                <option value="paused">已暂停</option>
                                <option value="error">错误</option>
                            </select>
                        </div>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex gap-2 mt-4 flex-wrap">
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => {
                                        const newParams = new URLSearchParams(searchParams);
                                        if (selectedTags.includes(tag.id)) {
                                            setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                                            newParams.delete('tagId');
                                        } else {
                                            setSelectedTags([...selectedTags, tag.id]);
                                            newParams.set('tagId', String(tag.id));
                                        }
                                        newParams.set('page', '1');
                                        setSearchParams(newParams);
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                        selectedTags.includes(tag.id)
                                            ? 'text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : sites.length === 0 ? (
                    <EmptyState
                        icon={<Globe size={48} />}
                        title="暂无站点"
                        description="添加您的第一个监控站点开始追踪网站变化"
                        action={
                            <Button onClick={() => navigate('/sites/new')}>
                                <Plus className="w-4 h-4 mr-2" />
                                添加站点
                            </Button>
                        }
                    />
                ) : (
                    <div className="divide-y divide-slate-200">
                        {sites.map((site) => (
                            <div
                                key={site.id}
                                className="p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium text-slate-900">{site.name}</h3>
                                            {getStatusBadge(site.status)}
                                            {site.tags?.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="px-2 py-0.5 rounded text-xs text-white"
                                                    style={{ backgroundColor: tag.color }}
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{site.url}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                            <span>频率: {site.frequency}</span>
                                            <span>
                                                最后采集:{' '}
                                                {site.last_crawl_at
                                                    ? new Date(site.last_crawl_at).toLocaleString('zh-CN')
                                                    : '从未'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpen(menuOpen === site.id ? null : site.id)}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {menuOpen === site.id && (
                                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-40 z-10">
                                                <button
                                                    onClick={() => {
                                                        navigate(`/sites/${site.id}`);
                                                        setMenuOpen(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                                                >
                                                    <Eye size={16} />
                                                    查看详情
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigate(`/sites/${site.id}/edit`);
                                                        setMenuOpen(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                                                >
                                                    <Edit size={16} />
                                                    编辑
                                                </button>
                                                <button
                                                    onClick={() => handleCrawlSite(site)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                                                >
                                                    <RefreshCw size={16} />
                                                    立即采集
                                                </button>
                                                {site.status === 'active' ? (
                                                    <button
                                                        onClick={() => handlePauseSite(site)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                                                    >
                                                        <Pause size={16} />
                                                        暂停
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleResumeSite(site)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                                                    >
                                                        <Play size={16} />
                                                        恢复
                                                    </button>
                                                )}
                                                <hr className="my-1" />
                                                <button
                                                    onClick={() => handleDeleteSite(site)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                    删除
                                                </button>
                                            </div>
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
                            显示 {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                            {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，
                            共 {pagination.total} 条
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set('page', String(pagination.page - 1));
                                    setSearchParams(newParams);
                                }}
                            >
                                上一页
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set('page', String(pagination.page + 1));
                                    setSearchParams(newParams);
                                }}
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
