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

router.get('/sites', (req, res) => {
    const sites = db.getSites().map(site => ({
        ...site,
        status: site.status === 1 ? 'active' : site.status === 2 ? 'paused' : 'error',
        rules: typeof site.rules === 'string' ? JSON.parse(site.rules || '{}') : site.rules || {},
        tags: []
    }));

    res.json({
        success: true,
        data: {
            data: sites,
            pagination: { total: sites.length, page: 1, pageSize: 20, totalPages: 1 }
        }
    });
});

router.get('/sites/:id', (req, res) => {
    const site = db.getSite(parseInt(req.params.id));
    if (!site) return res.status(404).json({ success: false, error: '站点不存在' });

    res.json({
        success: true,
        data: {
            ...site,
            status: site.status === 1 ? 'active' : site.status === 2 ? 'paused' : 'error',
            rules: typeof site.rules === 'string' ? JSON.parse(site.rules || '{}') : site.rules || {},
            tags: []
        }
    });
});

router.post('/sites', (req, res) => {
    const { url, name, description, frequency, rules, tags } = req.body;
    const site = {
        id: db.nextId('sites'),
        url,
        name,
        description: description || null,
        status: 1,
        frequency: frequency || 'daily',
        rules: JSON.stringify(rules || {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_crawl_at: null,
        pause_reason: null
    };
    db.addSite(site);
    res.status(201).json({ success: true, data: { ...site, status: 'active', rules: rules || {}, tags: [] } });
});

router.put('/sites/:id', (req, res) => {
    const site = db.updateSite(parseInt(req.params.id), req.body);
    if (!site) return res.status(404).json({ success: false, error: '站点不存在' });
    res.json({ success: true, data: { ...site, status: site.status === 1 ? 'active' : site.status === 2 ? 'paused' : 'error' } });
});

router.delete('/sites/:id', (req, res) => {
    if (!db.getSite(parseInt(req.params.id))) return res.status(404).json({ success: false, error: '站点不存在' });
    db.deleteSite(parseInt(req.params.id));
    res.json({ success: true, message: '站点已删除' });
});

router.get('/tags', (req, res) => {
    res.json({ success: true, data: db.getTags() });
});

router.get('/alerts', (req, res) => {
    res.json({
        success: true,
        data: {
            data: db.getAlerts(),
            pagination: { total: db.getAlerts().length, page: 1, pageSize: 20, totalPages: 1 }
        }
    });
});

router.get('/logs', (req, res) => {
    res.json({
        success: true,
        data: {
            data: db.getLogs(),
            pagination: { total: db.getLogs().length, page: 1, pageSize: 50, totalPages: 1 }
        }
    });
});

router.get('/stats/dashboard', (req, res) => {
    const sites = db.getSites();
    res.json({
        success: true,
        data: {
            totalSites: sites.length,
            activeSites: sites.filter(s => s.status === 1).length,
            pausedSites: sites.filter(s => s.status === 2).length,
            errorSites: sites.filter(s => s.status === 3).length,
            totalVersions: db.getVersions().length,
            totalAlerts: db.getAlerts().length,
            unresolvedAlerts: db.getAlerts().filter(a => !a.is_resolved).length,
            recentAlerts: [],
            sitesByTag: [],
            crawlTrend: []
        }
    });
});

router.get('/versions', (req, res) => {
    res.json({
        success: true,
        data: {
            data: db.getVersions(),
            pagination: { total: db.getVersions().length, page: 1, pageSize: 20, totalPages: 1 }
        }
    });
});

export default router;
