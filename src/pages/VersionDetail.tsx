import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Globe, Image, FileText, Star, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner } from '../components/common';
import { versionApi } from '../services/api';

export default function VersionDetail() {
    const { versionId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState<any>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (versionId) {
            loadVersion(parseInt(versionId));
        }
    }, [versionId]);

    const loadVersion = async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await versionApi.getVersion(id);
            
            if (response.success) {
                setVersion(response.data);
            } else {
                setError(response.error || '加载版本详情失败');
            }
        } catch (error: any) {
            setError(error.message || '加载版本详情失败');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleMarkImportant = async () => {
        try {
            await versionApi.markImportant(version.id);
            showNotification('success', '已标记为重要更新');
            loadVersion(version.id);
        } catch (error: any) {
            showNotification('error', error.message || '标记失败');
        }
    };

    const handleUnmarkImportant = async () => {
        try {
            await versionApi.unmarkImportant(version.id);
            showNotification('success', '已取消重要更新标记');
            loadVersion(version.id);
        } catch (error: any) {
            showNotification('error', error.message || '取消标记失败');
        }
    };

    const handleBack = () => {
        const siteId = searchParams.get('siteId');
        if (siteId) {
            navigate(`/archives/${siteId}`);
        } else {
            navigate('/archives');
        }
    };

    const handleCompareWithPrevious = () => {
        if (version?.site_id) {
            navigate(`/archives/${version.site_id}?compareWith=${version.id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !version) {
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
                
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回档案库
                </Button>
                
                <Card>
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">加载失败</h2>
                        <p className="text-slate-500">{error || '版本不存在'}</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
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
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回{version.site ? `${version.site.name}的版本列表` : '档案库'}
                </Button>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleCompareWithPrevious}>
                        与历史版本对比
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">版本详情</h1>
                    <p className="text-slate-500 mt-1">查看采集记录的完整信息</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={version.is_archived ? 'default' : 'info'}>
                        {version.is_archived ? '已归档' : '活跃'}
                    </Badge>
                    {version.is_important === 1 && (
                        <Badge variant="warning">
                            <Star size={12} className="mr-1" />
                            重要
                        </Badge>
                    )}
                </div>
            </div>

            <Card>
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-slate-900 mb-3">
                                {version.title || '无标题'}
                            </h2>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                {version.site && (
                                    <div className="flex items-center gap-2">
                                        <Globe size={16} />
                                        <span>{version.site.name}</span>
                                        <a 
                                            href={version.site.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            ({version.site.url})
                                        </a>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{new Date(version.created_at).toLocaleString('zh-CN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {version.summary && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={18} className="text-slate-600" />
                                <h3 className="font-semibold text-slate-900">摘要</h3>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg text-slate-700">
                                {version.summary}
                            </div>
                        </div>
                    )}

                    {version.content && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={18} className="text-slate-600" />
                                <h3 className="font-semibold text-slate-900">正文内容</h3>
                            </div>
                            <div className="bg-white border border-slate-200 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                                    {version.content}
                                </pre>
                            </div>
                        </div>
                    )}

                    {version.screenshots && version.screenshots.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Image size={18} className="text-slate-600" />
                                <h3 className="font-semibold text-slate-900">截图</h3>
                                <span className="text-sm text-slate-500">({version.screenshots.length}张)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {version.screenshots.map((screenshot: any) => (
                                    <div key={screenshot.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-slate-100 h-48 flex items-center justify-center">
                                            <div className="text-center">
                                                <Image size={48} className="text-slate-400 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">截图预览</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50">
                                            <p className="text-xs text-slate-600">
                                                {screenshot.width} × {screenshot.height}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {screenshot.file_size ? `${(screenshot.file_size / 1024).toFixed(1)} KB` : '未知大小'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!version.summary && !version.content && !version.screenshots?.length && (
                        <div className="text-center py-12 text-slate-500">
                            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                            <p>暂无详细内容</p>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">版本信息</h3>
                </div>
                <div className="p-4">
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-slate-500">版本ID</dt>
                            <dd className="font-medium text-slate-900 mt-1">#{version.id}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">所属站点ID</dt>
                            <dd className="font-medium text-slate-900 mt-1">#{version.site_id}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">创建时间</dt>
                            <dd className="font-medium text-slate-900 mt-1">
                                {new Date(version.created_at).toLocaleString('zh-CN')}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">归档状态</dt>
                            <dd className="font-medium mt-1">
                                <Badge variant={version.is_archived ? 'default' : 'success'}>
                                    {version.is_archived ? '已归档' : '活跃'}
                                </Badge>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">重要更新</dt>
                            <dd className="font-medium mt-1">
                                {version.is_important ? (
                                    <Badge variant="warning">
                                        <Star size={12} className="mr-1" />
                                        是
                                    </Badge>
                                ) : (
                                    <Badge variant="default">否</Badge>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">操作</dt>
                            <dd className="mt-1">
                                {version.is_important ? (
                                    <Button variant="secondary" size="sm" onClick={handleUnmarkImportant}>
                                        取消重要标记
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" onClick={handleMarkImportant}>
                                        标记为重要
                                    </Button>
                                )}
                            </dd>
                        </div>
                        {version.site && (
                            <>
                                <div>
                                    <dt className="text-slate-500">站点名称</dt>
                                    <dd className="font-medium text-slate-900 mt-1">{version.site.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500">站点URL</dt>
                                    <dd className="font-medium text-slate-900 mt-1">
                                        <a 
                                            href={version.site.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {version.site.url}
                                        </a>
                                    </dd>
                                </div>
                            </>
                        )}
                    </dl>
                </div>
            </Card>
        </div>
    );
}
