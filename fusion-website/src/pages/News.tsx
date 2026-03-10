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

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';

/** Prefix relative /uploads/... URLs with the ERP base so they resolve correctly from the demo subdomain */
const getImgUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('/')) return ERP_BASE + url;
    return url;
};

const News = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=website&action=getPublicNews&limit=50');
                const data = await res.json();
                if (data.status === 'success' || data.success === true) {
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
        <div className="flex flex-col min-h-screen pb-24">
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/Gemini_Generated_Image_8ikilj8ikilj8iki.jpeg')" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-zinc-950/70 z-10 transition-colors"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-brand-primary/40 blur-[150px] rounded-full z-0 mix-blend-screen opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

                {/* Content */}
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-8">
                    <h1 className="font-heading text-5xl md:text-7xl tracking-tighter mb-4 text-white uppercase drop-shadow-xl">
                        News & <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]">Eventi</span>
                    </h1>
                    <p className="font-subheading text-xl md:text-2xl text-zinc-200 mt-2 max-w-2xl leading-snug drop-shadow-md">
                        Tutte le ultime novità, i risultati e le iniziative dal mondo Fusion Team Volley.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 w-full flex-grow">

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass-panel p-6 animate-pulse h-[400px]">
                                <div className="h-48 bg-white/5 rounded-none mb-6 w-full"></div>
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
                                    {getImgUrl(article.cover_image_url) ? (
                                        <img
                                            src={getImgUrl(article.cover_image_url)}
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
        </div>
    );
};

export default News;
