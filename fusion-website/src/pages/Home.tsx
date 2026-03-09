import { useState, useEffect } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const Home = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/ERP/api/?module=website&action=getPublicNews&limit=3');
                const data = await res.json();
                if (data.status === 'success') {
                    setNews(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch news:', error);
            } finally {
                setLoadingNews(false);
            }
        };

        fetchNews();
    }, []);

    return (
        <div className="flex flex-col gap-24 pb-20">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Dark Background Overlay */}
                <div className="absolute inset-0 bg-zinc-950 z-10"></div>
                {/* Inter style diagonal lines / graphic elements */}
                <div className="absolute inset-0 z-10 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #001A72 0, #001A72 2px, transparent 2px, transparent 100px)' }}></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-brand-primary/30 blur-[150px] rounded-full z-0"></div>

                <div className="relative z-20 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 border border-brand-500/50 bg-zinc-950/80 mb-8 clip-diagonal uppercase text-xs font-bold text-brand-500 tracking-[0.2em]">
                        Settore Giovanile d'Eccellenza
                    </div>

                    <h1 className="font-heading text-6xl md:text-8xl lg:text-[9rem] tracking-tighter mb-4 text-white leading-[0.8]">
                        FUSION
                        <br />
                        <span className="text-brand-primary drop-shadow-[0_0_15px_rgba(0,26,114,0.8)]">TEAM</span>
                    </h1>

                    <p className="font-subheading text-2xl md:text-3xl text-zinc-300 mt-6 mb-12 max-w-3xl leading-snug">
                        800 ATLETE. UN UNICO GRANDE SOGNO. IL VOLLEY COME NON L'HAI MAI VISTO.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-lg">
                        <Link to="/teams" className="flex-1 py-5 bg-brand-500 text-zinc-950 font-heading text-xl hover:bg-white transition-colors flex items-center justify-center gap-2 clip-diagonal">
                            I ROSTER <ChevronRight size={24} />
                        </Link>
                        <Link to="/shop" className="flex-1 py-5 bg-transparent border-2 border-white text-white font-heading text-xl hover:bg-white hover:text-zinc-950 transition-colors flex items-center justify-center gap-2 clip-diagonal">
                            LO STORE <ChevronRight size={24} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Latest News Widget */}
            <section className="w-full px-4 md:px-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b-2 border-zinc-800 pb-6 gap-6">
                    <div>
                        <h2 className="font-heading text-5xl md:text-7xl">LATEST <span className="text-brand-500">NEWS</span></h2>
                    </div>
                    <Link to="/news" className="text-zinc-400 hover:text-white font-heading text-lg flex items-center gap-2 transition-colors">
                        TUTTE LE NOTIZIE <ChevronRight size={24} />
                    </Link>
                </div>

                {loadingNews ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-zinc-900 h-96 clip-diagonal"></div>
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div className="p-12 text-center border border-zinc-800 clip-diagonal">
                        <p className="font-subheading text-2xl text-zinc-500">Nessuna news pubblicata al momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {news.map(article => (
                            <Link to={`/news/${article.slug}`} key={article.id} className="group flex flex-col h-full overflow-hidden bg-zinc-900 hover:bg-zinc-800 transition-colors clip-diagonal">
                                <div className="h-64 relative bg-zinc-950 overflow-hidden">
                                    {article.cover_image_url ? (
                                        <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                                            <span className="font-heading text-6xl text-brand-primary opacity-50">FUSION</span>
                                        </div>
                                    )}
                                    {article.category_name && (
                                        <div className="absolute top-0 right-0 px-4 py-2 bg-brand-500 font-subheading text-zinc-950 font-bold clip-diagonal">
                                            {article.category_name}
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="font-subheading text-zinc-500 text-sm mb-4 flex items-center gap-2">
                                        <Calendar size={16} />
                                        {new Date(article.published_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                    <h3 className="font-heading text-2xl mb-4 group-hover:text-brand-500 transition-colors leading-tight">
                                        {article.title}
                                    </h3>
                                    <p className="text-zinc-400 font-sans text-sm line-clamp-3 mb-8">
                                        {article.excerpt}
                                    </p>
                                    <div className="mt-auto inline-flex items-center gap-2 font-subheading text-white group-hover:text-brand-500 transition-colors">
                                        LEGGI <ChevronRight size={20} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
