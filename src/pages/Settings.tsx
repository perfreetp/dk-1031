import { useState, useEffect } from 'react';
import { Settings, Bell, Database, Tag, Shield, Download, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../components/common';
import { tagApi, logApi, siteApi, versionApi } from '../services/api';
import type { Tag as TagType } from '../types';

export default function SettingsPage() {
    const [tags, setTags] = useState<TagType[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');
    const [isLoadingTags, setIsLoadingTags] = useState(true);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isExportingLogs, setIsExportingLogs] = useState(false);
    const [isExportingResults, setIsExportingResults] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            setIsLoadingTags(true);
            const response = await tagApi.getTags();
            setTags(response.data);
        } catch (error: any) {
            showNotification('error', error.message || '加载标签失败');
        } finally {
            setIsLoadingTags(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) {
            showNotification('error', '请输入标签名称');
            return;
        }

        try {
            setIsAddingTag(true);
            const response = await tagApi.createTag({ name: newTagName.trim(), color: newTagColor });
            setTags([...tags, response.data]);
            setNewTagName('');
            setNewTagColor('#3b82f6');
            showNotification('success', '标签添加成功');
        } catch (error: any) {
            showNotification('error', error.message || '添加标签失败');
        } finally {
            setIsAddingTag(false);
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm('确定要删除这个标签吗？')) return;

        try {
            await tagApi.deleteTag(id);
            setTags(tags.filter(t => t.id !== id));
            showNotification('success', '标签已删除');
        } catch (error: any) {
            showNotification('error', error.message || '删除标签失败');
        }
    };

    const handleExportLogs = async () => {
        try {
            setIsExportingLogs(true);
            const response = await logApi.exportLogs();
            
            if (response.success && response.data) {
                const logs = response.data;
                const csvContent = generateLogsCSV(logs);
                downloadFile(csvContent, '运行日志导出', 'logs_export.csv', 'text/csv');
                showNotification('success', `成功导出 ${logs.length} 条日志`);
            } else {
                showNotification('error', response.error || '导出日志失败');
            }
        } catch (error: any) {
            showNotification('error', error.message || '导出日志失败');
        } finally {
            setIsExportingLogs(false);
        }
    };

    const generateLogsCSV = (logs: any[]) => {
        const headers = ['ID', '站点ID', '级别', '消息', '详情', '时间'];
        const rows = logs.map(log => [
            log.id,
            log.site_id || '',
            log.level,
            log.message,
            log.details || '',
            new Date(log.created_at).toLocaleString('zh-CN')
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    };

    const handleExportResults = async () => {
        try {
            setIsExportingResults(true);
            
            const sitesResponse = await siteApi.getSites({ pageSize: 1000 });
            const sites = sitesResponse.data.data;
            
            const sitePolicies = new Map(sites.map(s => [s.id, {
                retention_policy: s.retention_policy,
                archive_rules: s.archive_rules
            }]));
            
            const allVersions: any[] = [];
            for (const site of sites) {
                try {
                    const versionResponse = await versionApi.getVersions(site.id, { pageSize: 100 });
                    if (versionResponse.data?.data) {
                        allVersions.push(...versionResponse.data.data.map((v: any) => ({
                            ...v,
                            site_name: site.name,
                            site_url: site.url,
                            site_retention_policy: site.retention_policy,
                            site_archive_rules: site.archive_rules
                        })));
                    }
                } catch (error) {
                    console.error(`Failed to load versions for site ${site.id}:`, error);
                }
            }

            const csvContent = generateResultsCSV(allVersions);
            downloadFile(csvContent, '巡检结果导出', 'inspection_results.csv', 'text/csv');
            showNotification('success', `成功导出 ${allVersions.length} 条巡检记录`);
        } catch (error: any) {
            showNotification('error', error.message || '导出巡检结果失败');
        } finally {
            setIsExportingResults(false);
        }
    };

    const generateResultsCSV = (versions: any[]) => {
        const headers = [
            '版本ID', 
            '站点名称', 
            '站点URL', 
            '标题', 
            '摘要', 
            '是否归档',
            '是否重要',
            '状态',
            '内容长度',
            '保留策略_最大版本数',
            '保留策略_保留天数',
            '保留策略_自动归档',
            '归档规则_自动归档',
            '归档规则_归档天数',
            '归档规则_重要关键词',
            '采集时间',
            '版本创建时间'
        ];
        const rows = versions.map(v => {
            const retentionPolicy = typeof v.site_retention_policy === 'string' 
                ? JSON.parse(v.site_retention_policy) 
                : v.site_retention_policy || {};
            const archiveRules = typeof v.site_archive_rules === 'string' 
                ? JSON.parse(v.site_archive_rules) 
                : v.site_archive_rules || {};
            
            return [
                v.id,
                v.site_name || '',
                v.site_url || '',
                v.title || '',
                v.summary || '',
                v.is_archived ? '是' : '否',
                v.is_important ? '是' : '否',
                v.is_archived ? '已归档' : (v.is_important ? '重要' : '活跃'),
                v.content ? v.content.length : 0,
                retentionPolicy.maxVersions || 30,
                retentionPolicy.retainDays || 90,
                retentionPolicy.autoArchive ? '是' : '否',
                archiveRules.autoArchive ? '是' : '否',
                archiveRules.archiveAfterDays || 30,
                (archiveRules.importantKeywords || []).join('; '),
                new Date(v.created_at).toLocaleString('zh-CN'),
                v.created_at
            ];
        });
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    };

    const downloadFile = (content: string, title: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-4xl">
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

            <div>
                <h1 className="text-2xl font-bold text-slate-900">设置</h1>
                <p className="text-slate-500 mt-1">管理系统的各项配置</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">标签管理</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="新标签名称"
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <input
                                type="color"
                                value={newTagColor}
                                onChange={(e) => setNewTagColor(e.target.value)}
                                className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                            />
                            <Button 
                                onClick={handleAddTag} 
                                disabled={isAddingTag}
                            >
                                {isAddingTag ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    '添加'
                                )}
                            </Button>
                        </div>

                        {isLoadingTags ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                            </div>
                        ) : tags.length === 0 ? (
                            <div className="text-center text-slate-500 py-4">
                                暂无标签
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="flex items-center gap-2 px-3 py-1 rounded-full"
                                        style={{ backgroundColor: `${tag.color}20` }}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="text-sm font-medium" style={{ color: tag.color }}>
                                            {tag.name}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                            title="删除标签"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">数据导出</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">运行日志导出</p>
                                <p className="text-sm text-slate-500">导出所有系统运行日志（CSV格式）</p>
                            </div>
                            <Button 
                                variant="secondary" 
                                onClick={handleExportLogs}
                                disabled={isExportingLogs}
                            >
                                {isExportingLogs ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        导出中...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        导出日志
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">巡检结果导出</p>
                                <p className="text-sm text-slate-500">导出所有站点的巡检记录（CSV格式）</p>
                            </div>
                            <Button 
                                variant="secondary" 
                                onClick={handleExportResults}
                                disabled={isExportingResults}
                            >
                                {isExportingResults ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        导出中...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        导出结果
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">通知设置</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">邮件通知</p>
                                <p className="text-sm text-slate-500">当检测到重要变化时发送邮件通知</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">系统通知</p>
                                <p className="text-sm text-slate-500">在应用内显示实时告警通知</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">存储管理</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">存储空间</p>
                                <p className="text-sm text-slate-500">已使用 128 MB / 1 GB</p>
                            </div>
                            <Button variant="secondary" size="sm">
                                清理缓存
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">版本保留策略</p>
                                <p className="text-sm text-slate-500">自动保留最近 30 个版本</p>
                            </div>
                            <Button variant="secondary" size="sm">
                                修改
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">安全设置</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                SMTP 服务器配置
                            </label>
                            <input
                                type="text"
                                placeholder="smtp.example.com"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            />
                            <input
                                type="email"
                                placeholder="notification@example.com"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button>保存配置</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
