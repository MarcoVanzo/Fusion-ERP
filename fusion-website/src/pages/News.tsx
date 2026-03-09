import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';

interface NewsArticle {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    cover_image_url?: string;
    published_at: string;
    category_name: string;
    color_hex?: string;
}

const News = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/ERP/api/?module=website&action=getPublicNews&limit=50');
                const data = await res.json();
                if (data.status === 'success') {
                    setNews(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 pb-24">
            <header className="mb-12 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                    News & <span className="text-brand-500">Eventi</span>
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl">
                    Tutte le ultime novità, i risultati e le iniziative dal mondo Fusion Team Volley.
                </p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-panel p-6 animate-pulse h-[400px]">
                            <div className="h-48 bg-white/5 rounded-lg mb-6 w-full"></div>
                            <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                            <div className="h-6 bg-white/10 rounded w-full mb-3"></div>
                            <div className="h-6 bg-white/10 rounded w-4/5"></div>
                        </div>
                    ))}
                </div>
            ) : news.length === 0 ? (
                <div className="glass-panel p-16 text-center">
                    <p className="text-zinc-400 text-lg">Non ci sono news disponibili al momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map(article => (
                        <Link
                            to={`/news/${article.slug}`}
                            key={article.id}
                            className="glass-panel overflow-hidden border border-white/5 group hover:border-brand-500/30 transition-all hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(234,179,8,0.2)] flex flex-col h-full"
                        >
                            <div className="h-56 overflow-hidden relative bg-zinc-900">
                                {article.cover_image_url ? (
                                    <img
                                        src={article.cover_image_url}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                        <span className="text-zinc-700 font-extrabold text-6xl">F</span>
                                    </div>
                                )}
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {article.category_name && (
                                    <div
                                        className="absolute top-4 right-4 px-3 py-1 rounded bg-zinc-950/90 backdrop-blur text-xs font-bold text-white border border-white/10 shadow-lg"
                                        style={{ borderLeftColor: article.color_hex || '#eab308' }}
                                    >
                                        {article.category_name}
                                    </div>
                                )}
                            </div>
                            <div className="p-8 flex flex-col flex-grow relative">
                                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-4 font-bold uppercase tracking-wider">
                                    <Calendar size={14} className="text-brand-500/70" />
                                    {new Date(article.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-brand-500 transition-colors line-clamp-2 leading-tight">
                                    {article.title}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                                    {article.excerpt}
                                </p>
                                <div className="pt-6 border-t border-white/5 text-brand-500 text-sm font-bold flex items-center justify-between group-hover:text-white transition-colors mt-auto uppercase tracking-wider">
                                    <span>Leggi Articolo</span>
                                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-zinc-950 transition-all">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default News;
