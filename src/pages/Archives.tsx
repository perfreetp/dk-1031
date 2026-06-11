import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Archive, Calendar, Search, Eye, GitCompare, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/common';
import { siteApi, versionApi, tagApi } from '../services/api';
import type { Site, Version, Tag } from '../types';

export default function Archives() {
    const navigate = useNavigate();
    const { siteId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [versions, setVersions] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        loadSites();
    }, []);

    useEffect(() => {
        if (siteId) {
            const site = sites.find(s => s.id === parseInt(siteId));
            if (site) {
                setSelectedSite(site);
            }
        }
    }, [siteId, sites]);

    useEffect(() => {
        if (selectedSite) {
            loadVersions(selectedSite.id);
        }
    }, [selectedSite, showArchived]);

    const loadSites = async () => {
        try {
            setIsLoading(true);
            const response = await siteApi.getSites({ pageSize: 100 });
            setSites(response.data.data);
        } catch (error: any) {
            showNotification('error', error.message || '加载站点列表失败');
        } finally {
            setIsLoading(false);
        }
    };

    const loadVersions = async (siteId: number) => {
        try {
            setIsLoadingVersions(true);
            const response = await versionApi.getVersions(siteId, { 
                pageSize: 50,
                archived: showArchived ? true : undefined 
            });
            setVersions(response.data.data);
            setPagination(response.data.pagination);
        } catch (error: any) {
            showNotification('error', error.message || '加载版本列表失败');
        } finally {
            setIsLoadingVersions(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleArchiveVersion = async (id: number) => {
        try {
            await versionApi.archiveVersion(id);
            showNotification('success', '版本已归档');
            if (selectedSite) {
                loadVersions(selectedSite.id);
            }
        } catch (error: any) {
            showNotification('error', error.message || '归档失败');
        }
    };

    const handleUnarchiveVersion = async (id: number) => {
        try {
            await versionApi.unarchiveVersion(id);
            showNotification('success', '版本已取消归档');
            if (selectedSite) {
                loadVersions(selectedSite.id);
            }
        } catch (error: any) {
            showNotification('error', error.message || '取消归档失败');
        }
    };

    const handleCompare = (version1: Version, version2: Version) => {
        navigate(`/archives/compare?version1=${version1.id}&version2=${version2.id}`);
    };

    const handleSiteSelect = (site: Site) => {
        setSelectedSite(site);
        navigate(`/archives/${site.id}`);
        setSearchQuery('');
    };

    const filteredVersions = versions.filter(v =>
        !searchQuery || 
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">档案库</h1>
                    <p className="text-slate-500 mt-1">浏览和管理所有历史版本</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        显示已归档版本
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-3">
                    <Card>
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-900">选择站点</h3>
                            <p className="text-xs text-slate-500 mt-1">{sites.length} 个站点</p>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {sites.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    暂无站点，请先添加站点
                                </div>
                            ) : (
                                sites.map((site) => (
                                    <div
                                        key={site.id}
                                        onClick={() => handleSiteSelect(site)}
                                        className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors border-l-2 ${
                                            selectedSite?.id === site.id 
                                                ? 'bg-blue-50 border-l-blue-600' 
                                                : 'border-l-transparent'
                                        }`}
                                    >
                                        <p className="font-medium text-slate-900 text-sm truncate">{site.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{site.url}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <div className="col-span-12 lg:col-span-9">
                    <Card>
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900">
                                    {selectedSite ? `${selectedSite.name} 的版本历史` : '请选择一个站点'}
                                </h3>
                                {selectedSite && (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="搜索标题、摘要或内容..."
                                            className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {!selectedSite ? (
                            <EmptyState
                                icon={<Archive size={48} />}
                                title="请选择站点"
                                description="从左侧列表选择一个站点查看其版本历史"
                            />
                        ) : isLoadingVersions ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredVersions.length === 0 ? (
                            <EmptyState
                                icon={<Archive size={48} />}
                                title={searchQuery ? '未找到匹配结果' : '暂无版本'}
                                description={searchQuery ? '尝试调整搜索关键词' : '该站点还没有采集记录'}
                            />
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {filteredVersions.map((version, index) => (
                                    <div key={version.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(version.created_at).toLocaleString('zh-CN')}
                                                    </span>
                                                    <Badge variant={version.is_archived ? 'default' : 'info'}>
                                                        {version.is_archived ? '已归档' : '活跃'}
                                                    </Badge>
                                                    {version.site && (
                                                        <Badge variant="info">
                                                            {version.site.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h4 className="font-medium text-slate-900">
                                                    {version.title || '无标题'}
                                                </h4>
                                                {version.summary && (
                                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                        {version.summary}
                                                    </p>
                                                )}
                                                {version.content && (
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                        {version.content.substring(0, 200)}
                                                        {version.content.length > 200 && '...'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/archives/${version.id}`)}
                                                    title="查看详情"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {index > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCompare(filteredVersions[index - 1], version)}
                                                        title="与上一版本对比"
                                                    >
                                                        <GitCompare className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {version.is_archived ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleUnarchiveVersion(version.id)}
                                                    >
                                                        取消归档
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleArchiveVersion(version.id)}
                                                    >
                                                        归档
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
