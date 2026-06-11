import { Router } from 'express';

class SimpleDB {
    private sites: Map<number, any> = new Map();
    private versions: Map<number, any> = new Map();
    private screenshots: Map<number, any> = new Map();
    private alerts: Map<number, any> = new Map();
    private logs: Map<number, any> = new Map();
    private tags: Map<number, any> = new Map();
    private counters = { sites: 0, versions: 0, screenshots: 0, alerts: 0, logs: 0, tags: 4, alert_rules: 0, notifications: 0 };

    constructor() {
        this.tags.set(1, { id: 1, name: '技术博客', color: '#3b82f6', created_at: new Date().toISOString() });
        this.tags.set(2, { id: 2, name: '新闻媒体', color: '#10b981', created_at: new Date().toISOString() });
        this.tags.set(3, { id: 3, name: '电商平台', color: '#f59e0b', created_at: new Date().toISOString() });
        this.tags.set(4, { id: 4, name: '社交媒体', color: '#ef4444', created_at: new Date().toISOString() });
    }

    getSites() { return Array.from(this.sites.values()); }
    getSite(id: number) { return this.sites.get(id); }
    addSite(site: any) { this.sites.set(site.id, site); return site; }
    updateSite(id: number, updates: any) { if (this.sites.has(id)) { const site = this.sites.get(id)!; Object.assign(site, updates); return site; } return null; }
    deleteSite(id: number) { return this.sites.delete(id); }

    getVersions() { return Array.from(this.versions.values()); }
    getVersion(id: number) { return this.versions.get(id); }
    addVersion(version: any) { this.versions.set(version.id, version); return version; }
    updateVersion(id: number, updates: any) { if (this.versions.has(id)) { const v = this.versions.get(id)!; Object.assign(v, updates); return v; } return null; }
    deleteVersion(id: number) { return this.versions.delete(id); }

    getAlerts() { return Array.from(this.alerts.values()); }
    getAlert(id: number) { return this.alerts.get(id); }
    addAlert(alert: any) { this.alerts.set(alert.id, alert); return alert; }
    updateAlert(id: number, updates: any) { if (this.alerts.has(id)) { const a = this.alerts.get(id)!; Object.assign(a, updates); return a; } return null; }
    deleteAlert(id: number) { return this.alerts.delete(id); }

    getLogs() { return Array.from(this.logs.values()); }
    getLog(id: number) { return this.logs.get(id); }
    addLog(log: any) { this.logs.set(log.id, log); return log; }
    deleteLog(id: number) { return this.logs.delete(id); }

    getTags() { return Array.from(this.tags.values()); }
    getTag(id: number) { return this.tags.get(id); }
    addTag(tag: any) { this.tags.set(tag.id, tag); return tag; }
    updateTag(id: number, updates: any) { if (this.tags.has(id)) { const t = this.tags.get(id)!; Object.assign(t, updates); return t; } return null; }
    deleteTag(id: number) { return this.tags.delete(id); }

    getScreenshots() { return Array.from(this.screenshots.values()); }
    addScreenshot(screenshot: any) { this.screenshots.set(screenshot.id, screenshot); return screenshot; }

    nextId(type: keyof typeof this.counters) { return ++this.counters[type]; }
}

const db = new SimpleDB();
const router = Router();

// ==================== SITES ====================

router.get('/sites', (req, res) => {
    try {
        const { status, tagId, search, sortBy, sortOrder } = req.query;
        let sites = db.getSites();

        // Filter by status
        if (status) {
            const statusMap: Record<string, number> = { active: 1, paused: 2, error: 3 };
            sites = sites.filter(s => s.status === statusMap[status as string]);
        }

        // Filter by tag
        if (tagId) {
            const tagIdNum = parseInt(tagId as string);
            sites = sites.filter(s => s.tagIds && s.tagIds.includes(tagIdNum));
        }

        // Search by name or URL
        if (search) {
            const searchLower = (search as string).toLowerCase();
            sites = sites.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                s.url.toLowerCase().includes(searchLower)
            );
        }

        // Sort
        const sortField = (sortBy as string) || 'created_at';
        const order = (sortOrder as string) === 'asc' ? 1 : -1;
        sites.sort((a, b) => {
            const aVal = a[sortField] || '';
            const bVal = b[sortField] || '';
            return aVal > bVal ? order : -order;
        });

        // Get tags for each site
        const allTags = db.getTags();
        const sitesWithTags = sites.map(site => ({
            ...site,
            status: site.status === 1 ? 'active' : site.status === 2 ? 'paused' : 'error',
            rules: typeof site.rules === 'string' ? JSON.parse(site.rules || '{}') : site.rules || {},
            tags: (site.tagIds || []).map((tagId: number) => allTags.find(t => t.id === tagId)).filter(Boolean)
        }));

        res.json({
            success: true,
            data: {
                data: sitesWithTags,
                pagination: { total: sitesWithTags.length, page: 1, pageSize: 20, totalPages: 1 }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/sites/:id', (req, res) => {
    try {
        const site = db.getSite(parseInt(req.params.id));
        if (!site) return res.status(404).json({ success: false, error: '站点不存在' });

        const allTags = db.getTags();
        const siteTags = (site.tagIds || []).map((tagId: number) => allTags.find(t => t.id === tagId)).filter(Boolean);

        res.json({
            success: true,
            data: {
                ...site,
                status: site.status === 1 ? 'active' : site.status === 2 ? 'paused' : 'error',
                rules: typeof site.rules === 'string' ? JSON.parse(site.rules || '{}') : site.rules || {},
                tags: siteTags
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/sites', (req, res) => {
    try {
        const { url, name, description, frequency, rules, tags } = req.body;
        
        if (!url || !name) {
            return res.status(400).json({ success: false, error: 'URL和名称是必填项' });
        }

        const site = {
            id: db.nextId('sites'),
            url,
            name,
            description: description || null,
            status: 1,
            frequency: frequency || 'daily',
            rules: JSON.stringify(rules || {}),
            tagIds: tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_crawl_at: null,
            pause_reason: null
        };
        db.addSite(site);

        const allTags = db.getTags();
        const siteTags = (tags || []).map((tagId: number) => allTags.find(t => t.id === tagId)).filter(Boolean);

        res.status(201).json({ 
            success: true, 
            data: { 
                ...site, 
                status: 'active', 
                rules: rules || {}, 
                tags: siteTags 
            } 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/sites/:id', (req, res) => {
    try {
        const siteId = parseInt(req.params.id);
        const site = db.getSite(siteId);
        if (!site) return res.status(404).json({ success: false, error: '站点不存在' });

        const { url, name, description, frequency, rules, tagIds } = req.body;
        
        const updates: any = {};
        if (url !== undefined) updates.url = url;
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (frequency !== undefined) updates.frequency = frequency;
        if (rules !== undefined) updates.rules = JSON.stringify(rules);
        if (tagIds !== undefined) updates.tagIds = tagIds;
        updates.updated_at = new Date().toISOString();

        const updated = db.updateSite(siteId, updates);
        
        const allTags = db.getTags();
        const siteTags = ((updated?.tagIds) || []).map((tagId: number) => allTags.find(t => t.id === tagId)).filter(Boolean);

        res.json({ 
            success: true, 
            data: { 
                ...updated,
                status: updated?.status === 1 ? 'active' : updated?.status === 2 ? 'paused' : 'error',
                tags: siteTags
            } 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/sites/:id/pause', (req, res) => {
    try {
        const siteId = parseInt(req.params.id);
        const site = db.getSite(siteId);
        if (!site) return res.status(404).json({ success: false, error: '站点不存在' });

        const { reason } = req.body;
        db.updateSite(siteId, { status: 2, pause_reason: reason || '用户暂停', updated_at: new Date().toISOString() });
        
        const updated = db.getSite(siteId);
        const allTags = db.getTags();
        const siteTags = ((updated?.tagIds) || []).map((tagId: number) => allTags.find(t => t.id === tagId)).filter(Boolean);

        res.json({ success: true, data: { ...updated, status: 'paused', tags: siteTags } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/sites/:id/resume', (req, res) => {
    try {
        const siteId = parseInt(req.params.id);
        const site = db.getSite(siteId);
        if (!site) return res.status(404).json({ success: false, error: '站点不存在' });

        db.updateSite(siteId, { status: 1, pause_reason: null, updated_at: new Date().toISOString() });
        
        const updated = db.getSite(siteId);
        const allTags = db.getTags();
        const siteTags = ((updated?.tagIds) || []).map((tagId: number) => allTags.find(t => t.id === tagId)).filter(Boolean);

        res.json({ success: true, data: { ...updated, status: 'active', tags: siteTags } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/sites/:id/crawl', (req, res) => {
    try {
        const siteId = parseInt(req.params.id);
        const site = db.getSite(siteId);
        if (!site) return res.status(404).json({ success: false, error: '站点不存在' });

        // Simulate crawling - in real app, this would fetch the actual website
        const version = {
            id: db.nextId('versions'),
            site_id: siteId,
            title: `${site.name} - 第 ${(db.getVersions().filter(v => v.site_id === siteId).length + 1)} 次采集`,
            content: `这是 ${site.name} (${site.url}) 的内容摘要。\n\n采集时间: ${new Date().toLocaleString('zh-CN')}\n\n页面内容已成功抓取，等待实际采集任务执行后显示真实内容。`,
            summary: `第 ${(db.getVersions().filter(v => v.site_id === siteId).length + 1)} 次采集记录`,
            html: `<html><body><h1>${site.name}</h1><p>采集时间: ${new Date().toLocaleString('zh-CN')}</p></body></html>`,
            is_archived: 0,
            created_at: new Date().toISOString()
        };
        db.addVersion(version);

        // Add screenshot placeholder
        const screenshot = {
            id: db.nextId('screenshots'),
            version_id: version.id,
            filename: `screenshot_${version.id}.png`,
            filepath: `/screenshots/${siteId}/${version.id}.png`,
            width: 1920,
            height: 1080,
            file_size: 102400,
            created_at: new Date().toISOString()
        };
        db.addScreenshot(screenshot);

        // Update site's last crawl time
        db.updateSite(siteId, { last_crawl_at: new Date().toISOString() });

        // Add log
        db.addLog({
            id: db.nextId('logs'),
            site_id: siteId,
            level: 'info',
            message: `完成站点采集: ${site.name}`,
            details: `版本ID: ${version.id}`,
            created_at: new Date().toISOString()
        });

        res.json({ 
            success: true, 
            data: { 
                version,
                screenshot,
                last_crawl_at: new Date().toISOString()
            } 
        });
    } catch (error: any) {
        // Log error
        db.addLog({
            id: db.nextId('logs'),
            site_id: parseInt(req.params.id),
            level: 'error',
            message: `采集失败: ${error.message}`,
            details: error.stack,
            created_at: new Date().toISOString()
        });
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/sites/:id', (req, res) => {
    try {
        if (!db.getSite(parseInt(req.params.id))) return res.status(404).json({ success: false, error: '站点不存在' });
        db.deleteSite(parseInt(req.params.id));
        res.json({ success: true, message: '站点已删除' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/sites/export', (req, res) => {
    try {
        const sites = db.getSites();
        const allTags = db.getTags();
        
        const exportData = sites.map(site => ({
            url: site.url,
            name: site.name,
            description: site.description,
            frequency: site.frequency,
            status: site.status === 1 ? 'active' : site.status === 2 ? 'paused' : 'error',
            last_crawl_at: site.last_crawl_at,
            tags: (site.tagIds || []).map((tagId: number) => allTags.find(t => t.id === tagId)?.name).filter(Boolean),
            created_at: site.created_at
        }));

        res.json({ success: true, data: exportData });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== VERSIONS ====================

router.get('/versions', (req, res) => {
    try {
        const { siteId, search, archived, page = 1, pageSize = 20 } = req.query;
        let versions = db.getVersions();

        // Filter by site
        if (siteId) {
            versions = versions.filter(v => v.site_id === parseInt(siteId as string));
        }

        // Filter by archived
        if (archived !== undefined) {
            const isArchived = archived === 'true';
            versions = versions.filter(v => v.is_archived === (isArchived ? 1 : 0));
        }

        // Search in title and content
        if (search) {
            const searchLower = (search as string).toLowerCase();
            versions = versions.filter(v => 
                (v.title && v.title.toLowerCase().includes(searchLower)) ||
                (v.content && v.content.toLowerCase().includes(searchLower))
            );
        }

        // Sort by created_at desc
        versions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Add site info
        const sites = db.getSites();
        const versionsWithSites = versions.map(v => {
            const site = sites.find(s => s.id === v.site_id);
            return {
                ...v,
                site: site ? { id: site.id, name: site.name, url: site.url } : null
            };
        });

        res.json({
            success: true,
            data: {
                data: versionsWithSites,
                pagination: { 
                    total: versionsWithSites.length, 
                    page: parseInt(page as string), 
                    pageSize: parseInt(pageSize as string), 
                    totalPages: Math.ceil(versionsWithSites.length / parseInt(pageSize as string))
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/versions/:id', (req, res) => {
    try {
        const version = db.getVersion(parseInt(req.params.id));
        if (!version) return res.status(404).json({ success: false, error: '版本不存在' });

        const site = db.getSite(version.site_id);
        const screenshots = db.getScreenshots().filter(s => s.version_id === version.id);

        res.json({
            success: true,
            data: {
                ...version,
                site: site ? { id: site.id, name: site.name, url: site.url } : null,
                screenshots
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/versions/:id/archive', (req, res) => {
    try {
        const version = db.getVersion(parseInt(req.params.id));
        if (!version) return res.status(404).json({ success: false, error: '版本不存在' });

        db.updateVersion(parseInt(req.params.id), { is_archived: 1 });
        
        const updated = db.getVersion(parseInt(req.params.id));
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/versions/:id/unarchive', (req, res) => {
    try {
        const version = db.getVersion(parseInt(req.params.id));
        if (!version) return res.status(404).json({ success: false, error: '版本不存在' });

        db.updateVersion(parseInt(req.params.id), { is_archived: 0 });
        
        const updated = db.getVersion(parseInt(req.params.id));
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/versions/compare', (req, res) => {
    try {
        const { versionId1, versionId2 } = req.body;
        
        if (!versionId1 || !versionId2) {
            return res.status(400).json({ success: false, error: '需要提供两个版本ID' });
        }

        const version1 = db.getVersion(versionId1);
        const version2 = db.getVersion(versionId2);

        if (!version1 || !version2) {
            return res.status(404).json({ success: false, error: '版本不存在' });
        }

        // Calculate diff
        const diff = {
            titleChanged: version1.title !== version2.title,
            contentChanged: version1.content !== version2.content,
            titleDiff: [] as any[],
            contentDiff: [] as any[]
        };

        // Simple word-level diff for title
        if (diff.titleChanged && version1.title && version2.title) {
            const words1 = version1.title.split('');
            const words2 = version2.title.split('');
            diff.titleDiff = words1.map((char, i) => ({
                type: words2[i] === char ? 'normal' : 'changed',
                oldValue: char,
                newValue: words2[i] || ''
            }));
        }

        // Simple word-level diff for content
        if (diff.contentChanged && version1.content && version2.content) {
            const words1 = version1.content.split(/\s+/);
            const words2 = version2.content.split(/\s+/);
            
            diff.contentDiff = words1.map((word, i) => ({
                type: words2[i] === word ? 'normal' : 'changed',
                oldValue: word,
                newValue: words2[i] || ''
            }));
        }

        res.json({
            success: true,
            data: {
                version1,
                version2,
                diff
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/versions/:id', (req, res) => {
    try {
        if (!db.getVersion(parseInt(req.params.id))) return res.status(404).json({ success: false, error: '版本不存在' });
        db.deleteVersion(parseInt(req.params.id));
        res.json({ success: true, message: '版本已删除' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== TAGS ====================

router.get('/tags', (req, res) => {
    try {
        res.json({ success: true, data: db.getTags() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/tags', (req, res) => {
    try {
        const { name, color } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: '标签名称是必填项' });
        }

        const tag = {
            id: db.nextId('tags'),
            name,
            color: color || '#3b82f6',
            created_at: new Date().toISOString()
        };
        db.addTag(tag);

        res.status(201).json({ success: true, data: tag });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/tags/:id', (req, res) => {
    try {
        const { name, color } = req.body;
        const tag = db.getTag(parseInt(req.params.id));
        
        if (!tag) return res.status(404).json({ success: false, error: '标签不存在' });

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (color !== undefined) updates.color = color;

        const updated = db.updateTag(parseInt(req.params.id), updates);
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/tags/:id', (req, res) => {
    try {
        if (!db.getTag(parseInt(req.params.id))) return res.status(404).json({ success: false, error: '标签不存在' });
        db.deleteTag(parseInt(req.params.id));
        res.json({ success: true, message: '标签已删除' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ALERTS ====================

router.get('/alerts', (req, res) => {
    try {
        const { level, isResolved, page = 1, pageSize = 20 } = req.query;
        let alerts = db.getAlerts();

        if (level) {
            alerts = alerts.filter(a => a.level === level);
        }

        if (isResolved !== undefined) {
            const resolved = isResolved === 'true';
            alerts = alerts.filter(a => (a.is_resolved === 1) === resolved);
        }

        // Sort by created_at desc
        alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Add site info
        const sites = db.getSites();
        const alertsWithSites = alerts.map(a => {
            const site = sites.find(s => s.id === a.site_id);
            return {
                ...a,
                site: site ? { id: site.id, name: site.name, url: site.url } : null
            };
        });

        res.json({
            success: true,
            data: {
                data: alertsWithSites,
                pagination: { 
                    total: alertsWithSites.length, 
                    page: parseInt(page as string), 
                    pageSize: parseInt(pageSize as string), 
                    totalPages: Math.ceil(alertsWithSites.length / parseInt(pageSize as string))
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/alerts/:id/resolve', (req, res) => {
    try {
        const alert = db.getAlert(parseInt(req.params.id));
        if (!alert) return res.status(404).json({ success: false, error: '告警不存在' });

        db.updateAlert(parseInt(req.params.id), { is_resolved: 1, resolved_at: new Date().toISOString() });
        const updated = db.getAlert(parseInt(req.params.id));
        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/alerts/:id', (req, res) => {
    try {
        if (!db.getAlert(parseInt(req.params.id))) return res.status(404).json({ success: false, error: '告警不存在' });
        db.deleteAlert(parseInt(req.params.id));
        res.json({ success: true, message: '告警已删除' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== LOGS ====================

router.get('/logs', (req, res) => {
    try {
        const { level, search, page = 1, pageSize = 50 } = req.query;
        let logs = db.getLogs();

        if (level) {
            logs = logs.filter(l => l.level === level);
        }

        if (search) {
            const searchLower = (search as string).toLowerCase();
            logs = logs.filter(l => l.message.toLowerCase().includes(searchLower));
        }

        // Sort by created_at desc
        logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({
            success: true,
            data: {
                data: logs,
                pagination: { 
                    total: logs.length, 
                    page: parseInt(page as string), 
                    pageSize: parseInt(pageSize as string), 
                    totalPages: Math.ceil(logs.length / parseInt(pageSize as string))
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/logs/export', (req, res) => {
    try {
        const logs = db.getLogs();
        logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        res.json({ success: true, data: logs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== STATS ====================

router.get('/stats/dashboard', (req, res) => {
    try {
        const sites = db.getSites();
        const versions = db.getVersions();
        const alerts = db.getAlerts();

        // Get recent alerts
        const recentAlerts = alerts
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(a => {
                const site = sites.find(s => s.id === a.site_id);
                return {
                    ...a,
                    site: site ? { id: site.id, name: site.name, url: site.url } : null
                };
            });

        // Get sites by tag
        const allTags = db.getTags();
        const sitesByTag = allTags.map(tag => ({
            tag: tag.name,
            count: sites.filter(s => s.tagIds && s.tagIds.includes(tag.id)).length
        }));

        // Get crawl trend (last 7 days)
        const today = new Date();
        const crawlTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = versions.filter(v => v.created_at.startsWith(dateStr)).length;
            crawlTrend.push({ date: dateStr, count });
        }

        res.json({
            success: true,
            data: {
                totalSites: sites.length,
                activeSites: sites.filter(s => s.status === 1).length,
                pausedSites: sites.filter(s => s.status === 2).length,
                errorSites: sites.filter(s => s.status === 3).length,
                totalVersions: versions.length,
                totalAlerts: alerts.length,
                unresolvedAlerts: alerts.filter(a => !a.is_resolved).length,
                recentAlerts,
                sitesByTag,
                crawlTrend
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
