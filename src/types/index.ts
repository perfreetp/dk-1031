export interface Site {
    id: number;
    url: string;
    name: string;
    description: string | null;
    status: 'active' | 'paused' | 'error';
    frequency: string;
    rules: CrawlRules;
    created_at: string;
    updated_at: string;
    last_crawl_at: string | null;
    pause_reason: string | null;
    tags?: Tag[];
}

export interface CrawlRules {
    contentType: 'title' | 'summary' | 'content' | 'full';
    captureScreenshot: boolean;
    screenshotType: 'full' | 'viewport';
    timeout: number;
    retryCount: number;
    waitForSelector?: string;
    waitForDelay?: number;
    headers?: Record<string, string>;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
    created_at: string;
}

export interface Version {
    id: number;
    site_id: number;
    title: string | null;
    content: string | null;
    summary: string | null;
    html: string | null;
    is_archived: number;
    created_at: string;
    screenshots?: Screenshot[];
}

export interface Screenshot {
    id: number;
    version_id: number;
    filename: string;
    filepath: string;
    width: number | null;
    height: number | null;
    file_size: number | null;
    created_at: string;
}

export interface Alert {
    id: number;
    site_id: number;
    version_id: number | null;
    level: 'info' | 'warning' | 'critical';
    type: string;
    message: string | null;
    details: string | null;
    is_resolved: number;
    created_at: string;
    resolved_at: string | null;
    site?: {
        id: number;
        name: string;
        url: string;
    };
}

export interface AlertRule {
    id: number;
    name: string;
    conditions: AlertConditions;
    actions: AlertActions;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export interface AlertConditions {
    changeThreshold?: number;
    keywords?: string[];
    excludeKeywords?: string[];
    level?: string;
}

export interface AlertActions {
    notify: boolean;
    channels: ('email' | 'webhook' | 'system')[];
    email?: string;
    webhookUrl?: string;
}

export interface Log {
    id: number;
    site_id: number | null;
    level: 'info' | 'warn' | 'error';
    message: string;
    details: string | null;
    created_at: string;
    site?: {
        id: number;
        name: string;
        url: string;
    };
}

export interface DiffResult {
    title?: DiffLine[];
    content?: DiffLine[];
    added: number;
    removed: number;
    changed: number;
}

export interface DiffLine {
    type: 'add' | 'remove' | 'normal';
    value: string;
    lineNumber?: number;
}

export interface DashboardStats {
    totalSites: number;
    activeSites: number;
    pausedSites: number;
    errorSites: number;
    totalVersions: number;
    totalAlerts: number;
    unresolvedAlerts: number;
    recentAlerts: Alert[];
    sitesByTag: { tag: string; count: number }[];
    crawlTrend: { date: string; count: number }[];
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
