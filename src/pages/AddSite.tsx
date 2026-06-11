import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Card, Button, Badge } from '../components/common';
import { siteApi, tagApi } from '../services/api';
import type { Tag } from '../types';

export default function AddSite() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    
    const [formData, setFormData] = useState({
        url: '',
        name: '',
        description: '',
        frequency: 'daily',
        rules: {
            contentType: 'content',
            captureScreenshot: true,
            screenshotType: 'full',
            timeout: 30,
            retryCount: 3,
        },
        tags: [] as number[],
        retention_policy: {
            maxVersions: 30,
            retainDays: 90,
            autoArchive: true,
        },
        archive_rules: {
            autoArchive: true,
            archiveAfterDays: 30,
            importantKeywords: [] as string[],
        },
    });

    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        loadTags();
        if (isEdit) {
            loadSite();
        }
    }, [id]);

    const loadTags = async () => {
        try {
            const response = await tagApi.getTags();
            setTags(response.data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const loadSite = async () => {
        try {
            setIsLoading(true);
            const response = await siteApi.getSite(parseInt(id!));
            const site = response.data;
            
            setFormData({
                url: site.url,
                name: site.name,
                description: site.description || '',
                frequency: site.frequency,
                rules: site.rules || formData.rules,
                tags: site.tagIds || [],
                retention_policy: typeof site.retention_policy === 'string' 
                    ? JSON.parse(site.retention_policy) 
                    : site.retention_policy || formData.retention_policy,
                archive_rules: typeof site.archive_rules === 'string' 
                    ? JSON.parse(site.archive_rules) 
                    : site.archive_rules || formData.archive_rules,
            });
        } catch (error: any) {
            showNotification('error', error.message || '加载站点失败');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isEdit) {
                await siteApi.updateSite(parseInt(id!), formData);
                showNotification('success', '站点更新成功');
                setTimeout(() => navigate('/sites'), 1000);
            } else {
                await siteApi.createSite(formData);
                showNotification('success', '站点创建成功');
                setTimeout(() => navigate('/sites'), 1000);
            }
        } catch (error: any) {
            showNotification('error', error.message || (isEdit ? '更新失败' : '创建失败'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            if (name.startsWith('retention_policy.')) {
                const key = name.replace('retention_policy.', '');
                setFormData((prev) => ({
                    ...prev,
                    retention_policy: {
                        ...prev.retention_policy,
                        [key]: checked,
                    },
                }));
            } else if (name.startsWith('archive_rules.')) {
                const key = name.replace('archive_rules.', '');
                setFormData((prev) => ({
                    ...prev,
                    archive_rules: {
                        ...prev.archive_rules,
                        [key]: checked,
                    },
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    [name]: checked,
                }));
            }
        } else if (name.startsWith('retention_policy.')) {
            const key = name.replace('retention_policy.', '');
            setFormData((prev) => ({
                ...prev,
                retention_policy: {
                    ...prev.retention_policy,
                    [key]: type === 'number' ? parseInt(value) : value,
                },
            }));
        } else if (name.startsWith('archive_rules.')) {
            const key = name.replace('archive_rules.', '');
            setFormData((prev) => ({
                ...prev,
                archive_rules: {
                    ...prev.archive_rules,
                    [key]: type === 'number' ? parseInt(value) : value,
                },
            }));
        } else if (name.startsWith('rules.')) {
            const ruleKey = name.replace('rules.', '');
            setFormData((prev) => ({
                ...prev,
                rules: {
                    ...prev.rules,
                    [ruleKey]: type === 'number' ? parseInt(value) : value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleTagToggle = (tagId: number) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.includes(tagId)
                ? prev.tags.filter((id) => id !== tagId)
                : [...prev.tags, tagId],
        }));
    };

    const handleAddKeyword = () => {
        if (newKeyword.trim()) {
            setFormData((prev) => ({
                ...prev,
                archive_rules: {
                    ...prev.archive_rules,
                    importantKeywords: [...prev.archive_rules.importantKeywords, newKeyword.trim()],
                },
            }));
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            archive_rules: {
                ...prev.archive_rules,
                importantKeywords: prev.archive_rules.importantKeywords.filter((_, i) => i !== index),
            },
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    <span>{notification.message}</span>
                </div>
            )}

            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/sites')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{isEdit ? '编辑站点' : '添加站点'}</h1>
                    <p className="text-slate-500 mt-1">{isEdit ? '修改站点配置和策略' : '添加新的监控站点'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                网站地址 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                name="url"
                                value={formData.url}
                                onChange={handleChange}
                                placeholder="https://example.com"
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                站点名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="示例网站"
                                required
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                描述
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="站点的简短描述..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                采集频率
                            </label>
                            <select
                                name="frequency"
                                value={formData.frequency}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="hourly">每小时</option>
                                <option value="daily">每天</option>
                                <option value="weekly">每周</option>
                                <option value="monthly">每月</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                标签
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => handleTagToggle(tag.id)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            formData.tags.includes(tag.id)
                                                ? 'text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                        style={formData.tags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="mt-6">
                    <div className="p-6 space-y-6">
                        <h3 className="font-semibold text-slate-900">采集规则</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                内容类型
                            </label>
                            <select
                                name="rules.contentType"
                                value={formData.rules.contentType}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="title">仅标题</option>
                                <option value="summary">标题 + 摘要</option>
                                <option value="content">标题 + 正文</option>
                                <option value="full">完整内容</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="captureScreenshot"
                                checked={formData.rules.captureScreenshot}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm font-medium text-slate-700">
                                捕获截图
                            </label>
                        </div>

                        {formData.rules.captureScreenshot && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    截图类型
                                </label>
                                <select
                                    name="rules.screenshotType"
                                    value={formData.rules.screenshotType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="full">整页截图</option>
                                    <option value="viewport">视口截图</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                超时时间（秒）
                            </label>
                            <input
                                type="number"
                                name="rules.timeout"
                                value={formData.rules.timeout}
                                onChange={handleChange}
                                min="5"
                                max="300"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                重试次数
                            </label>
                            <input
                                type="number"
                                name="rules.retryCount"
                                value={formData.rules.retryCount}
                                onChange={handleChange}
                                min="0"
                                max="10"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </Card>

                <Card className="mt-6">
                    <div className="p-6 space-y-6">
                        <h3 className="font-semibold text-slate-900">保留策略</h3>
                        <p className="text-sm text-slate-500">配置站点的版本保留规则</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    最大保留版本数
                                </label>
                                <input
                                    type="number"
                                    name="retention_policy.maxVersions"
                                    value={formData.retention_policy.maxVersions}
                                    onChange={handleChange}
                                    min="1"
                                    max="1000"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    保留天数
                                </label>
                                <input
                                    type="number"
                                    name="retention_policy.retainDays"
                                    value={formData.retention_policy.retainDays}
                                    onChange={handleChange}
                                    min="1"
                                    max="3650"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="retention_policy.autoArchive"
                                checked={formData.retention_policy.autoArchive}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm font-medium text-slate-700">
                                超期后自动归档
                            </label>
                        </div>
                    </div>
                </Card>

                <Card className="mt-6">
                    <div className="p-6 space-y-6">
                        <h3 className="font-semibold text-slate-900">归档规则</h3>
                        <p className="text-sm text-slate-500">配置站点的自动归档和重要更新关键词</p>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="archive_rules.autoArchive"
                                checked={formData.archive_rules.autoArchive}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm font-medium text-slate-700">
                                启用自动归档
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                自动归档天数
                            </label>
                            <input
                                type="number"
                                name="archive_rules.archiveAfterDays"
                                value={formData.archive_rules.archiveAfterDays}
                                onChange={handleChange}
                                min="1"
                                max="365"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                重要更新关键词
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                当内容包含这些关键词时，将自动标记为重要更新
                            </p>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                    placeholder="输入关键词后按回车添加"
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Button type="button" onClick={handleAddKeyword}>
                                    添加
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.archive_rules.importantKeywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                                    >
                                        {keyword}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveKeyword(index)}
                                            className="hover:text-red-600"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" type="button" onClick={() => navigate('/sites')}>
                        取消
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? '保存中...' : (isEdit ? '更新' : '创建')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
