import { useState } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/sites?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索站点、标签..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </form>

            <div className="flex items-center gap-4 ml-6">
                <button
                    onClick={() => navigate('/alerts')}
                    className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <User size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">管理员</span>
                </div>
            </div>
        </header>
    );
}
