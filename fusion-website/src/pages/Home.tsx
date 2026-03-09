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

interface Match {
    id: number;
    home: string;
    away: string;
    sets_home?: number;
    sets_away?: number;
    date: string;
    championship_label: string;
}

const Home = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [recentMatches, setRecentMatches] = useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000); // 5 seconds per slide
        return () => clearInterval(slideInterval);
    }, []);

    useEffect(() => {
        const fetchRecentMatches = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=results&action=getPublicRecentResults&limit=50');
                const data = await res.json();
                if (data.status === 'success' || data.success === true) {
                    setRecentMatches(data.data?.matches || []);
                }
            } catch (error) {
                console.error('Failed to fetch recent matches:', error);
            } finally {
                setLoadingMatches(false);
            }
        };

        const fetchNews = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=website&action=getPublicNews&limit=3');
                const data = await res.json();
                if (data.status === 'success' || data.success === true) {
                    setNews(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch news:', error);
            } finally {
                setLoadingNews(false);
            }
        };

        fetchRecentMatches();
        fetchNews();
    }, []);

    return (
        <div className="flex flex-col gap-24 pb-20">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Image Slideshow Background */}
                <div className="absolute inset-0 z-0">
                    {[1, 2, 3].map((num, idx) => (
                        <div
                            key={num}
                            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                            style={{
                                backgroundImage: `url('/demo/assets/hero-${num}.jpg')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center 30%', // focal point slightly higher
                                opacity: currentSlide === idx ? 1 : 0
                            }}
                        />
                    ))}
                </div>

                {/* Dark Background Overlay & Fuchsia Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent/10 z-10 transition-colors duration-500"></div>
                <div className="absolute inset-0 z-10 opacity-40 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #a21caf 0, #a21caf 2px, transparent 2px, transparent 100px)' }}></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-brand-primary/40 blur-[150px] rounded-full z-0 mix-blend-screen"></div>

                <div className="relative z-20 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 border border-brand-500/50 bg-zinc-950/80 mb-8 clip-diagonal uppercase text-xs font-bold text-brand-500 tracking-[0.2em] backdrop-blur-sm">
                        Settore Giovanile d'Eccellenza
                    </div>

                    <h1 className="font-heading text-6xl md:text-8xl lg:text-[7.5rem] tracking-tighter mb-4 text-white leading-[0.85] drop-shadow-2xl">
                        FUSION TEAM
                        <br />
                        <span className="text-brand-500 drop-shadow-[0_0_25px_rgba(255,20,147,0.8)]">VOLLEY</span>
                    </h1>

                    <p className="font-subheading text-2xl md:text-3xl text-zinc-200 mt-6 mb-12 max-w-3xl leading-snug drop-shadow-md">
                        800 ATLETE. UN UNICO GRANDE SOGNO. IL VOLLEY COME NON L'HAI MAI VISTO.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-lg mb-16 relative z-30">
                        <Link to="/teams" className="flex-1 py-5 bg-brand-500 text-zinc-950 font-heading text-xl hover:bg-white transition-colors flex items-center justify-center gap-2 clip-diagonal">
                            I ROSTER <ChevronRight size={24} />
                        </Link>
                        <Link to="/shop" className="flex-1 py-5 bg-zinc-950/50 backdrop-blur-md border-2 border-brand-500 text-brand-500 font-heading text-xl hover:bg-brand-500 hover:text-white transition-colors flex items-center justify-center gap-2 clip-diagonal">
                            LO STORE <ChevronRight size={24} />
                        </Link>
                    </div>

                    {/* Slideshow Indicators */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                        {[0, 1, 2].map((idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-12 h-1.5 transition-all duration-300 clip-diagonal ${currentSlide === idx ? 'bg-brand-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'bg-white/30 hover:bg-white/60'}`}
                                aria-label={`Vai alla slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Matches Widget */}
            <section className="w-full px-4 md:px-12 py-20 md:py-28">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b-2 border-zinc-800 pb-6 gap-4">
                    <div>
                        <h2 className="font-heading text-5xl md:text-7xl">ULTIMI <span className="text-brand-500">RISULTATI</span></h2>
                    </div>
                </div>

                {loadingMatches ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-zinc-900 h-24 clip-diagonal border border-zinc-800"></div>)}
                    </div>
                ) : recentMatches.length === 0 ? (
                    <div className="p-8 text-center border border-zinc-800 bg-zinc-900/40 clip-diagonal">
                        <p className="font-subheading text-xl text-zinc-500">Nessun risultato caricato recentemente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {recentMatches.map((match: Match) => {
                            const isFusionHome = match.home.toLowerCase().includes('fusion');
                            const isFusionAway = match.away.toLowerCase().includes('fusion');

                            return (
                                <div key={match.id} className="group relative flex flex-col items-center justify-between p-4 bg-zinc-900 clip-diagonal border border-zinc-800 hover:border-brand-500 hover:bg-zinc-800 transition-colors">
                                    <div className="w-full flex justify-between items-center mb-3">
                                        <div className="font-subheading text-brand-500 text-xs tracking-widest">{match.date}</div>
                                        <div className="text-zinc-500 font-subheading text-[10px] uppercase truncate max-w-[60%]">{match.championship_label}</div>
                                    </div>
                                    <div className="flex items-center w-full gap-3">
                                        <div className={`text-right font-heading leading-tight text-sm sm:text-xl w-2/5 flex-grow break-words whitespace-normal ${isFusionHome ? 'text-white' : 'text-zinc-400'}`}>
                                            {match.home}
                                        </div>
                                        <div className="flex items-center justify-center min-w-[80px] h-10 bg-zinc-950 border border-zinc-800 clip-diagonal font-heading text-xl tracking-widest text-brand-500">
                                            {match.sets_home} - {match.sets_away}
                                        </div>
                                        <div className={`text-left font-heading leading-tight text-sm sm:text-xl w-2/5 flex-grow break-words whitespace-normal ${isFusionAway ? 'text-white' : 'text-zinc-400'}`}>
                                            {match.away}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Latest News Widget */}
            <section className="w-full px-4 md:px-12 py-20 md:py-28">
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
