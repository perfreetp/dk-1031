import { useState } from 'react';
import { Settings, Bell, Database, Tag, Shield } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../components/common';
import { tagApi } from '../services/api';
import type { Tag as TagType } from '../types';

export default function SettingsPage() {
    const [tags, setTags] = useState<TagType[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;

        try {
            const response = await tagApi.createTag({ name: newTagName, color: newTagColor });
            setTags([...tags, response.data]);
            setNewTagName('');
            setNewTagColor('#3b82f6');
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm('确定要删除这个标签吗？')) return;

        try {
            await tagApi.deleteTag(id);
            setTags(tags.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
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
                            />
                            <input
                                type="color"
                                value={newTagColor}
                                onChange={(e) => setNewTagColor(e.target.value)}
                                className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer"
                            />
                            <Button onClick={handleAddTag}>添加</Button>
                        </div>

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
                                        className="text-slate-400 hover:text-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
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
