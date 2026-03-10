import { useState, useEffect } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

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
            <Helmet>
                <title>Home - Fusion Team Volley</title>
                <meta name="description" content="Scopri le squadre, le news e lo shop ufficiale del Fusion Team Volley." />
            </Helmet>
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Image Slideshow Background */}
                <div className="absolute inset-0 z-0">
                    {[1, 2, 3].map((num, idx) => {
                        let bgPosition = 'center 30%';
                        if (num === 1) bgPosition = 'center calc(0% - 30px)';
                        if (num === 2) bgPosition = 'center calc(0% - 30px)';

                        return (
                            <div
                                key={num}
                                className="absolute inset-0 transition-opacity duration-1000 ease-in-out saturate-[1.2] contrast-125 brightness-110"
                                style={{
                                    backgroundImage: `url('/demo/assets/hero-${num}.jpg')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: bgPosition,
                                    opacity: currentSlide === idx ? 1 : 0
                                }}
                            />
                        );
                    })}
                </div>

                {/* Dark Background Overlay & Fuchsia Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/40 to-transparent z-10 transition-colors duration-500"></div>
                <div className="absolute inset-0 z-10 opacity-40 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #a21caf 0, #a21caf 2px, transparent 2px, transparent 100px)' }}></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-brand-primary/40 blur-[150px] rounded-full z-0 mix-blend-screen"></div>

                <div className="relative z-20 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 border border-brand-500/50 bg-zinc-950/80 mb-6 clip-diagonal uppercase text-xs font-bold text-brand-500 tracking-[0.2em] backdrop-blur-sm">
                        Settore Giovanile d'Eccellenza
                    </div>

                    <h1 className="font-heading text-5xl md:text-8xl lg:text-[7.5rem] tracking-tighter mb-6 text-white leading-[0.85] drop-shadow-2xl">
                        FUSION TEAM
                        <br />
                        <span className="text-brand-500 drop-shadow-[0_0_25px_rgba(255,20,147,0.8)]">VOLLEY</span>
                    </h1>

                    <p className="font-subheading text-lg sm:text-2xl md:text-3xl text-zinc-200 mt-2 mb-16 max-w-3xl leading-relaxed drop-shadow-md">
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
            <section className="w-full px-4 md:px-12 py-20 md:py-28 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[40vw] h-[40vw] bg-brand-500/10 blur-[120px] rounded-full -z-10"></div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 relative">
                    <div className="relative">
                        <div className="absolute -top-8 left-0 text-brand-500/20 font-heading text-8xl select-none pointer-events-none">RESULTS</div>
                        <h2 className="font-heading text-5xl md:text-7xl relative z-10">
                            ULTIMI <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">RISULTATI</span>
                        </h2>
                    </div>
                </div>

                {loadingMatches ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse bg-zinc-900/50 h-32 rounded-2xl border border-zinc-800/50"></div>
                        ))}
                    </div>
                ) : recentMatches.length === 0 ? (
                    <div className="p-16 text-center border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md rounded-3xl">
                        <p className="font-subheading text-xl text-zinc-500">Nessun risultato caricato recentemente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {recentMatches.slice(0, 4).map((match: Match) => {
                            const isFusionHome = match.home.toLowerCase().includes('fusion');
                            const isFusionAway = match.away.toLowerCase().includes('fusion');

                            return (
                                <div key={match.id} className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-brand-500/50 rounded-2xl p-6 transition-all duration-500 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col gap-4 overflow-hidden">
                                    {/* Glassmorphism Highlight */}
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold">
                                        <span className="text-zinc-500 flex items-center gap-2">
                                            <Calendar size={12} className="text-brand-500" />
                                            {match.date}
                                        </span>
                                        <span className="text-brand-500/80 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 max-w-[60%] truncate">
                                            {match.championship_label}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 mt-2">
                                        <div className={`flex-1 text-center flex flex-col items-center gap-3`}>
                                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-white/5 group-hover:border-brand-500/30 transition-colors">
                                                <span className="font-heading text-lg text-zinc-500">{match.home.charAt(0)}</span>
                                            </div>
                                            <div className={`font-heading text-sm md:text-base transition-colors duration-300 ${isFusionHome ? 'text-white' : 'text-zinc-400'}`}>
                                                {match.home}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <div className="font-heading text-4xl md:text-5xl text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                                {match.sets_home}<span className="text-brand-500 mx-1">:</span>{match.sets_away}
                                            </div>
                                            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Final Score</div>
                                        </div>

                                        <div className={`flex-1 text-center flex flex-col items-center gap-3`}>
                                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-white/5 group-hover:border-brand-500/30 transition-colors">
                                                <span className="font-heading text-lg text-zinc-500">{match.away.charAt(0)}</span>
                                            </div>
                                            <div className={`font-heading text-sm md:text-base transition-colors duration-300 ${isFusionAway ? 'text-white' : 'text-zinc-400'}`}>
                                                {match.away}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Latest News Widget */}
            <section className="w-full px-4 md:px-12 py-20 md:py-28 relative">
                {/* Background Glow */}
                <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-brand-500/5 blur-[150px] rounded-full -z-10"></div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-zinc-800/50 pb-8 gap-6 relative">
                    <div className="relative">
                        <div className="absolute -top-8 left-0 text-white/5 font-heading text-8xl select-none pointer-events-none">FUSION</div>
                        <h2 className="font-heading text-5xl md:text-7xl relative z-10">
                            LATEST <span className="text-brand-500">NEWS</span>
                        </h2>
                    </div>
                    <Link to="/news" className="group text-zinc-400 hover:text-white font-heading text-lg flex items-center gap-3 transition-all">
                        TUTTE LE NOTIZIE
                        <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-brand-500 group-hover:bg-brand-500/10 transition-all">
                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </Link>
                </div>

                {loadingNews ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-zinc-900/50 h-[500px] rounded-3xl border border-zinc-800/50"></div>
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div className="p-20 text-center border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md rounded-3xl">
                        <p className="font-subheading text-2xl text-zinc-500">Nessuna news pubblicata al momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {news.map(article => (
                            <Link
                                to={`/news/${article.slug}`}
                                key={article.id}
                                className="group relative flex flex-col h-full overflow-hidden bg-zinc-900/20 backdrop-blur-md border border-white/5 hover:border-brand-500/50 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                            >
                                <div className="aspect-[4/5] relative overflow-hidden">
                                    {article.cover_image_url ? (
                                        <img
                                            src={article.cover_image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-70 group-hover:opacity-100"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-zinc-950 flex items-center justify-center">
                                            <span className="font-heading text-6xl text-brand-500/20">FUSION</span>
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {article.category_name && (
                                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-brand-500 text-zinc-950 font-heading text-xs uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                                            {article.category_name}
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>

                                    {/* Content Info Over Image */}
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-3">
                                            <Calendar size={12} className="text-brand-500" />
                                            {new Date(article.published_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        <h3 className="font-heading text-2xl md:text-3xl text-white group-hover:text-brand-500 transition-colors leading-tight line-clamp-2">
                                            {article.title}
                                        </h3>
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow">
                                    <p className="text-zinc-400 font-sans text-sm line-clamp-3 mb-8 leading-relaxed">
                                        {article.excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="inline-flex items-center gap-2 font-heading text-xs uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                                            CONTINUA A LEGGERE
                                        </span>
                                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-brand-500/50 group-hover:bg-brand-500 group-hover:text-zinc-950 transition-all">
                                            <ChevronRight size={16} />
                                        </div>
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
