import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge, LoadingSpinner } from '../components/common';
import { versionApi } from '../services/api';

interface DiffItem {
    type: 'normal' | 'changed';
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

    const renderDiffLine = (item: DiffItem, index: number) => {
        if (item.type === 'normal') {
            return (
                <span key={index} className="text-slate-700">
                    {item.oldValue}
                </span>
            );
        } else {
            return (
                <span key={index} className="bg-red-100 text-red-800 px-0.5 rounded">
                    {item.oldValue || <span className="text-red-400">-</span>}
                    <span className="text-green-600 mx-0.5">→</span>
                    {item.newValue || <span className="text-green-400">+</span>}
                </span>
            );
        }
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
                    <Button variant="ghost" onClick={() => navigate('/archives')}>
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
                    <Button variant="ghost" onClick={() => navigate('/archives')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回档案库
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">版本对比</h1>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info">版本 {version1?.id}</Badge>
                            {diff?.titleChanged && <Badge variant="warning">已变更</Badge>}
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
                            {diff?.titleChanged && <Badge variant="warning">已变更</Badge>}
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
                    </div>
                    <div className="p-4 space-y-6">
                        {diff?.titleChanged && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                                    <FileText size={16} />
                                    标题变更
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm leading-relaxed">
                                    {diff.titleDiff.map((item, index) => renderDiffLine(item, index))}
                                </div>
                            </div>
                        )}

                        {diff?.contentChanged && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
                                    <FileText size={16} />
                                    正文变更
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                                    {diff.contentDiff.map((item, index) => renderDiffLine(item, index))}
                                    {' '}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {!diff?.titleChanged && !diff?.contentChanged && (
                <Card>
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">两个版本完全相同</h3>
                        <p className="text-slate-500">标题和正文内容均未发生变化</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
