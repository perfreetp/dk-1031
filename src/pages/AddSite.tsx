import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, Button } from '../components/common';
import { siteApi, tagApi } from '../services/api';
import type { Tag } from '../types';

export default function AddSite() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
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
    });

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const response = await tagApi.getTags();
            setTags(response.data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await siteApi.createSite(formData);
            navigate('/sites');
        } catch (error: any) {
            alert(error.message || '创建失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
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

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/sites')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">添加站点</h1>
                    <p className="text-slate-500 mt-1">添加新的监控站点</p>
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

                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" type="button" onClick={() => navigate('/sites')}>
                        取消
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? '保存中...' : '保存'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
