import { create } from 'zustand';
import type { Site, Tag } from '../types';

interface SiteState {
    sites: Site[];
    tags: Tag[];
    selectedSite: Site | null;
    isLoading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
    filters: {
        status?: string;
        tagId?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    };
    setSites: (sites: Site[]) => void;
    setTags: (tags: Tag[]) => void;
    setSelectedSite: (site: Site | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setPagination: (pagination: any) => void;
    setFilters: (filters: any) => void;
    addSite: (site: Site) => void;
    updateSite: (site: Site) => void;
    removeSite: (id: number) => void;
    addTag: (tag: Tag) => void;
    updateTag: (tag: Tag) => void;
    removeTag: (id: number) => void;
}

export const useSiteStore = create<SiteState>((set) => ({
    sites: [],
    tags: [],
    selectedSite: null,
    isLoading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
    },
    filters: {},
    setSites: (sites) => set({ sites }),
    setTags: (tags) => set({ tags }),
    setSelectedSite: (selectedSite) => set({ selectedSite }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setPagination: (pagination) => set({ pagination }),
    setFilters: (filters) => set({ filters }),
    addSite: (site) => set((state) => ({ sites: [site, ...state.sites] })),
    updateSite: (site) =>
        set((state) => ({
            sites: state.sites.map((s) => (s.id === site.id ? site : s)),
            selectedSite: state.selectedSite?.id === site.id ? site : state.selectedSite,
        })),
    removeSite: (id) =>
        set((state) => ({
            sites: state.sites.filter((s) => s.id !== id),
            selectedSite: state.selectedSite?.id === id ? null : state.selectedSite,
        })),
    addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
    updateTag: (tag) =>
        set((state) => ({
            tags: state.tags.map((t) => (t.id === tag.id ? tag : t)),
        })),
    removeTag: (id) =>
        set((state) => ({
            tags: state.tags.filter((t) => t.id !== id),
        })),
}));

interface AlertState {
    alerts: any[];
    isLoading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
    filters: {
        level?: string;
        isResolved?: boolean;
        siteId?: number;
    };
    setAlerts: (alerts: any[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setPagination: (pagination: any) => void;
    setFilters: (filters: any) => void;
    addAlert: (alert: any) => void;
    updateAlert: (alert: any) => void;
    removeAlert: (id: number) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    alerts: [],
    isLoading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
    },
    filters: {},
    setAlerts: (alerts) => set({ alerts }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setPagination: (pagination) => set({ pagination }),
    setFilters: (filters) => set({ filters }),
    addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
    updateAlert: (alert) =>
        set((state) => ({
            alerts: state.alerts.map((a) => (a.id === alert.id ? alert : a)),
        })),
    removeAlert: (id) =>
        set((state) => ({
            alerts: state.alerts.filter((a) => a.id !== id),
        })),
}));

interface LogState {
    logs: any[];
    isLoading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
    filters: {
        level?: string;
        siteId?: number;
        search?: string;
    };
    setLogs: (logs: any[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setPagination: (pagination: any) => void;
    setFilters: (filters: any) => void;
    addLog: (log: any) => void;
}

export const useLogStore = create<LogState>((set) => ({
    logs: [],
    isLoading: false,
    error: null,
    pagination: {
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
    },
    filters: {},
    setLogs: (logs) => set({ logs }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setPagination: (pagination) => set({ pagination }),
    setFilters: (filters) => set({ filters }),
    addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
}));
