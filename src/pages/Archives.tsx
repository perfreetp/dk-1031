import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Calendar, Search, Filter, Eye, GitCompare } from 'lucide-react';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/common';
import { siteApi, versionApi } from '../services/api';
import type { Site, Version } from '../types';

export default function Archives() {
    const navigate = useNavigate();
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [versions, setVersions] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSites();
    }, []);

    useEffect(() => {
        if (selectedSite) {
            loadVersions(selectedSite.id);
        }
    }, [selectedSite]);

    const loadSites = async () => {
        try {
            setIsLoading(true);
            const response = await siteApi.getSites({ pageSize: 100 });
            setSites(response.data.data);
        } catch (error) {
            console.error('Failed to load sites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadVersions = async (siteId: number) => {
        try {
            const response = await versionApi.getVersions(siteId, { pageSize: 50 });
            setVersions(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to load versions:', error);
        }
    };

    const handleArchiveVersion = async (id: number) => {
        try {
            await versionApi.archiveVersion(id);
            if (selectedSite) {
                loadVersions(selectedSite.id);
            }
        } catch (error) {
            console.error('Failed to archive version:', error);
        }
    };

    const handleCompare = (version1: Version, version2: Version) => {
        navigate(`/archives/compare?version1=${version1.id}&version2=${version2.id}`);
    };

    const filteredVersions = versions.filter(v =>
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">档案库</h1>
                    <p className="text-slate-500 mt-1">浏览和管理所有历史版本</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-3">
                    <Card>
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-900">选择站点</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {sites.map((site) => (
                                <div
                                    key={site.id}
                                    onClick={() => setSelectedSite(site)}
                                    className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                                        selectedSite?.id === site.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                                    }`}
                                >
                                    <p className="font-medium text-slate-900 text-sm truncate">{site.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{site.url}</p>
                                </div>
                            ))}
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
                                            placeholder="搜索版本内容..."
                                            className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        ) : filteredVersions.length === 0 ? (
                            <EmptyState
                                icon={<Archive size={48} />}
                                title="暂无版本"
                                description="该站点还没有采集记录"
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
                                                    {version.is_archived ? (
                                                        <Badge variant="default">已归档</Badge>
                                                    ) : (
                                                        <Badge variant="info">活跃</Badge>
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
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/archives/${version.id}`)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {index > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCompare(filteredVersions[index - 1], version)}
                                                    >
                                                        <GitCompare className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {!version.is_archived && (
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
