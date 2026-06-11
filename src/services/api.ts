import type { Site, Tag, Version, Alert, Log, DashboardStats } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || '请求失败');
    }

    return data;
}

export const siteApi = {
    getSites: (params?: any) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

        return fetchApi<{ success: boolean; data: { data: Site[]; pagination: any } }>(`/sites?${searchParams}`);
    },

    getSite: (id: number) =>
        fetchApi<{ success: boolean; data: Site }>(`/sites/${id}`),

    createSite: (data: any) =>
        fetchApi<{ success: boolean; data: Site }>('/sites', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateSite: (id: number, data: any) =>
        fetchApi<{ success: boolean; data: Site }>(`/sites/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteSite: (id: number) =>
        fetchApi<any>(`/sites/${id}`, { method: 'DELETE' }),

    pauseSite: (id: number, reason?: string) =>
        fetchApi<any>(`/sites/${id}/pause`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),

    resumeSite: (id: number) =>
        fetchApi<any>(`/sites/${id}/resume`, { method: 'POST' }),

    importSites: (sites: any[]) =>
        fetchApi<any>(`/sites/import`, {
            method: 'POST',
            body: JSON.stringify({ sites }),
        }),

    exportSites: () => fetchApi<any>('/sites/export'),
};

export const versionApi = {
    getVersions: (siteId: number, params?: any) => {
        const searchParams = new URLSearchParams({ siteId: String(siteId) });
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
        if (params?.archived !== undefined) searchParams.set('archived', String(params.archived));

        return fetchApi<any>(`/versions?${searchParams}`);
    },

    getVersion: (id: number) => fetchApi<any>(`/versions/${id}`),
    getVersionContent: (id: number) => fetchApi<any>(`/versions/${id}/content`),
    deleteVersion: (id: number) => fetchApi<any>(`/versions/${id}`, { method: 'DELETE' }),
    archiveVersion: (id: number) => fetchApi<any>(`/versions/${id}/archive`, { method: 'POST' }),
    unarchiveVersion: (id: number) => fetchApi<any>(`/versions/${id}/unarchive`, { method: 'POST' }),
    compareVersions: (versionId1: number, versionId2: number) =>
        fetchApi<any>(`/versions/compare`, {
            method: 'POST',
            body: JSON.stringify({ versionId1, versionId2 }),
        }),
    searchVersions: (siteId: number, keyword: string) =>
        fetchApi<any>(`/versions/search?siteId=${siteId}&keyword=${encodeURIComponent(keyword)}`),
};

export const alertApi = {
    getAlerts: (params?: any) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
        if (params?.level) searchParams.set('level', params.level);
        if (params?.isResolved !== undefined) searchParams.set('isResolved', String(params.isResolved));

        return fetchApi<{ success: boolean; data: { data: Alert[]; pagination: any } }>(`/alerts?${searchParams}`);
    },

    getAlertStats: () => fetchApi<any>('/alerts/stats'),
    getAlert: (id: number) => fetchApi<any>(`/alerts/${id}`),
    resolveAlert: (id: number) => fetchApi<any>(`/alerts/${id}/resolve`, { method: 'POST' }),
    unresolveAlert: (id: number) => fetchApi<any>(`/alerts/${id}/unresolve`, { method: 'POST' }),
    deleteAlert: (id: number) => fetchApi<any>(`/alerts/${id}`, { method: 'DELETE' }),
    getRules: () => fetchApi<any>('/alerts/rules'),
    createRule: (data: any) => fetchApi<any>('/alerts/rules', { method: 'POST', body: JSON.stringify(data) }),
    updateRule: (id: number, data: any) => fetchApi<any>(`/alerts/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRule: (id: number) => fetchApi<any>(`/alerts/rules/${id}`, { method: 'DELETE' }),
};

export const tagApi = {
    getTags: () => fetchApi<{ success: boolean; data: Tag[] }>('/tags'),
    getTagUsage: () => fetchApi<any>('/tags/usage'),
    createTag: (data: any) => fetchApi<{ success: boolean; data: Tag }>('/tags', { method: 'POST', body: JSON.stringify(data) }),
    updateTag: (id: number, data: any) => fetchApi<any>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTag: (id: number) => fetchApi<any>(`/tags/${id}`, { method: 'DELETE' }),
};

export const logApi = {
    getLogs: (params?: any) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
        if (params?.level) searchParams.set('level', params.level);
        if (params?.search) searchParams.set('search', params.search);

        return fetchApi<{ success: boolean; data: { data: Log[]; pagination: any } }>(`/logs?${searchParams}`);
    },

    getLogStats: (params?: any) => fetchApi<any>(`/logs/stats`),
    exportLogs: (params?: any) => fetchApi<any>(`/logs/export`),
};

export const statsApi = {
    getDashboard: () => fetchApi<{ success: boolean; data: DashboardStats }>('/stats/dashboard'),
    getMonthlyStats: (year: number, month: number) => fetchApi<any>(`/stats/monthly?year=${year}&month=${month}`),
};
