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

export const db = new SimpleDB();
export default db;
