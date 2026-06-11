import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner } from '../components/common';
import { versionApi } from '../services/api';

interface DiffItem {
    type: 'normal' | 'changed' | 'added' | 'removed';
    oldValue: string;
    newValue: string;
}

export default function VersionCompare() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [version1, setVersion1] = useState<any>(null);
    const [version2, setVersion2] = useState<any>(null);
    const [diff, setDiff] = useState<{
        titleChanged: boolean;
        contentChanged: boolean;
        titleDiff: DiffItem[];
        contentDiff: DiffItem[];
    } | null>(null);
    const [showTitleDiff, setShowTitleDiff] = useState(true);
    const [showContentDiff, setShowContentDiff] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const v1Id = params.get('version1');
        const v2Id = params.get('version2');

        if (v1Id && v2Id) {
            loadVersions(parseInt(v1Id), parseInt(v2Id));
        } else {
            setError('请选择两个版本进行对比');
            setIsLoading(false);
        }
    }, [location.search]);

    const loadVersions = async (v1Id: number, v2Id: number) => {
        try {
            setIsLoading(true);
            const response = await versionApi.compareVersions(v1Id, v2Id);
            
            if (response.success) {
                setVersion1(response.data.version1);
                setVersion2(response.data.version2);
                setDiff(response.data.diff);
            } else {
                setError(response.error || '加载版本数据失败');
            }
        } catch (error: any) {
            setError(error.message || '加载版本数据失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        const params = new URLSearchParams(location.search);
        const siteId = params.get('siteId');
        if (siteId) {
            navigate(`/archives/${siteId}`);
        } else {
            navigate('/archives');
        }
    };

    const renderDiffLine = (item: DiffItem, index: number, isOld: boolean) => {
        if (item.type === 'normal') {
            return (
                <span key={`normal-${index}`} className="text-slate-700">
                    {isOld ? item.oldValue : item.newValue}
                </span>
            );
        } else if (item.type === 'changed') {
            if (isOld) {
                return (
                    <span key={`old-${index}`} className="bg-red-100 text-red-800 px-0.5 rounded">
                        {item.oldValue}
                    </span>
                );
            } else {
                return (
                    <span key={`new-${index}`} className="bg-green-100 text-green-800 px-0.5 rounded">
                        {item.newValue}
                    </span>
                );
            }
        } else if (item.type === 'removed') {
            return (
                <span key={`removed-${index}`} className="bg-red-100 text-red-800 px-0.5 rounded line-through">
                    {item.oldValue}
                </span>
            );
        } else if (item.type === 'added') {
            return (
                <span key={`added-${index}`} className="bg-green-100 text-green-800 px-0.5 rounded">
                    {item.newValue}
                </span>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回档案库
                    </Button>
                </div>
                
                <Card>
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">加载失败</h2>
                        <p className="text-slate-500">{error}</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回版本列表
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">版本对比</h1>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info">版本 {version1?.id}</Badge>
                            {diff?.titleChanged && <Badge variant="warning">标题已变更</Badge>}
                            {diff?.contentChanged && <Badge variant="warning">正文已变更</Badge>}
                        </div>
                        <h3 className="font-semibold text-slate-900">{version1?.title || '无标题'}</h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                            <Calendar size={14} />
                            {new Date(version1?.created_at).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                            <FileText size={16} />
                            正文内容
                        </div>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {version1?.content || '无内容'}
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="success">版本 {version2?.id}</Badge>
                            {diff?.titleChanged && <Badge variant="warning">标题已变更</Badge>}
                            {diff?.contentChanged && <Badge variant="warning">正文已变更</Badge>}
                        </div>
                        <h3 className="font-semibold text-slate-900">{version2?.title || '无标题'}</h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                            <Calendar size={14} />
                            {new Date(version2?.created_at).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                            <FileText size={16} />
                            正文内容
                        </div>
                        <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {version2?.content || '无内容'}
                        </div>
                    </div>
                </Card>
            </div>

            {(diff?.titleChanged || diff?.contentChanged) && (
                <Card>
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-900">差异详情</h3>
                        <p className="text-sm text-slate-500 mt-1">红色标记为删除/变更内容，绿色标记为新增/变更内容</p>
                    </div>
                    <div className="p-4 space-y-6">
                        {diff?.titleChanged && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <FileText size={16} />
                                        标题变更
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setShowTitleDiff(!showTitleDiff)}
                                    >
                                        {showTitleDiff ? '隐藏详情' : '显示详情'}
                                    </Button>
                                </div>
                                {showTitleDiff && (
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <div className="mb-3">
                                            <p className="text-xs text-slate-500 mb-1">旧版本标题：</p>
                                            <div className="font-medium text-slate-900">
                                                {diff.titleDiff.map((item, index) => renderDiffLine(item, index, true))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">新版本标题：</p>
                                            <div className="font-medium text-slate-900">
                                                {diff.titleDiff.map((item, index) => renderDiffLine(item, index, false))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {diff?.contentChanged && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <FileText size={16} />
                                        正文变更
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setShowContentDiff(!showContentDiff)}
                                    >
                                        {showContentDiff ? '隐藏详情' : '显示详情'}
                                    </Button>
                                </div>
                                {showContentDiff && (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-2">旧版本正文（仅显示前500字符）：</p>
                                            <div className="font-mono text-sm text-slate-700 max-h-96 overflow-y-auto">
                                                {diff.contentDiff.slice(0, 100).map((item, index) => renderDiffLine(item, index, true))}
                                                {' '}
                                                {diff.contentDiff.length > 100 && (
                                                    <span className="text-slate-400">...（共 {diff.contentDiff.length} 处变更）</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-2">新版本正文（仅显示前500字符）：</p>
                                            <div className="font-mono text-sm text-slate-700 max-h-96 overflow-y-auto">
                                                {diff.contentDiff.slice(0, 100).map((item, index) => renderDiffLine(item, index, false))}
                                                {' '}
                                                {diff.contentDiff.length > 100 && (
                                                    <span className="text-slate-400">...（共 {diff.contentDiff.length} 处变更）</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {!diff?.titleChanged && !diff?.contentChanged && (
                <Card>
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">两个版本完全相同</h3>
                        <p className="text-slate-500">标题和正文内容均未发生变化</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
