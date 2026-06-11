import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import AddSite from './pages/AddSite';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import Archives from './pages/Archives';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="sites" element={<Sites />} />
                        <Route path="sites/new" element={<AddSite />} />
                        <Route path="sites/:id" element={<Sites />} />
                        <Route path="sites/:id/edit" element={<AddSite />} />
                        <Route path="archives" element={<Archives />} />
                        <Route path="archives/:siteId" element={<Archives />} />
                        <Route path="archives/compare" element={<Archives />} />
                        <Route path="alerts" element={<Alerts />} />
                        <Route path="logs" element={<Logs />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="settings/:section" element={<Settings />} />
                    </Route>
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
