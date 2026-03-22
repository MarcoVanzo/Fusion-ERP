import { useState, useEffect } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { motion } from 'framer-motion';

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

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const getImgUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('/')) return ERP_BASE + url;
    return url;
};

const Home = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [recentMatches, setRecentMatches] = useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, []);

    useEffect(() => {
        const fetchRecentMatches = async () => {
            try {
                const res = await fetch('/ERP/api/router.php?module=results&action=getPublicRecentResults&limit=50');
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
                const res = await fetch('/ERP/api/router.php?module=website&action=getPublicNews&limit=3');
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
        <div className="flex flex-col gap-0 pb-20">
            <Seo 
                title="Home" 
                description="Scopri le squadre, le news e lo shop ufficiale del Fusion Team Volley." 
                pathname="/"
            />

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
                                className={`absolute inset-0 saturate-[1.2] contrast-125 brightness-110 transition-all ease-out ${currentSlide === idx ? 'opacity-100 scale-[1.05] duration-[15000ms]' : 'opacity-0 scale-100 duration-1000'}`}
                                style={{
                                    backgroundImage: `url('${import.meta.env.BASE_URL}assets/hero-${num}.jpg')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: bgPosition
                                }}
                            />
                        );
                    })}
                </div>

                {/* Dark Background Overlay & Fuchsia Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent z-10 transition-colors duration-500"></div>
                <div className="absolute inset-0 z-10 opacity-40 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #a21caf 0, #a21caf 2px, transparent 2px, transparent 100px)' }}></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-brand-primary/40 blur-[150px] rounded-full z-0 mix-blend-screen"></div>

                <div className="relative z-20 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 border border-brand-500/50 bg-zinc-950/80 mb-6 clip-diagonal uppercase text-xs font-bold text-brand-500 tracking-[0.2em] backdrop-blur-sm">
                        Settore Giovanile d'Eccellenza
                    </div>

                    <h1 className="font-heading text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] tracking-tight md:tracking-tighter mb-4 md:mb-6 text-white leading-[0.85] drop-shadow-2xl">
                        FUSION TEAM
                        <br />
                        <span className="text-brand-500 drop-shadow-[0_0_25px_rgba(255,20,147,0.8)]">VOLLEY</span>
                    </h1>

                    <p className="font-subheading text-lg sm:text-2xl md:text-3xl text-zinc-200 mt-2 mb-6 max-w-3xl leading-relaxed drop-shadow-md">
                        800 ATLETE. UN UNICO GRANDE SOGNO. IL VOLLEY COME NON L'HAI MAI VISTO.
                    </p>

                    {/* Trust Signals */}
                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-full text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-widest">
                            🏐 7° Settore Giovanile in Italia
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-full text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-widest">
                            🏆 Riconoscimento FIPAV
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-full text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-widest">
                            👥 800+ Atlete
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-lg mb-12 sm:mb-16 relative z-30 px-2 sm:px-0">
                        <Link to="/teams" className="flex-1 py-5 bg-brand-500 text-zinc-950 font-heading text-xl hover:bg-white active:scale-95 transition-all duration-300 ease-out flex items-center justify-center gap-2 clip-diagonal focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 outline-none hover-sweep">
                            I ROSTER <ChevronRight size={24} />
                        </Link>
                        <Link to="/shop" className="flex-1 py-5 bg-zinc-950/50 backdrop-blur-md border-2 border-brand-500 text-brand-500 font-heading text-xl hover:bg-brand-500 hover:text-white active:scale-95 transition-all duration-300 ease-out flex items-center justify-center gap-2 clip-diagonal focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 outline-none hover-sweep">
                            LO STORE <ChevronRight size={24} />
                        </Link>
                    </div>

                    {/* Slideshow Indicators */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                        {[0, 1, 2].map((idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-12 h-1.5 transition-all duration-300 clip-diagonal outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${currentSlide === idx ? 'bg-brand-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'bg-white/30 hover:bg-white/60'}`}
                                aria-label={`Vai alla slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Results + News — Side-by-Side Section */}
            <section className="w-full px-4 md:px-12 py-20 md:py-28 relative overflow-hidden">
                {/* Background glows */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[35vw] h-[35vw] bg-brand-500/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-brand-500/5 blur-[150px] rounded-full -z-10 pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                    {/* === LEFT: Ultimi Risultati === */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="lg:w-[45%] flex flex-col"
                    >
                        <div className="mb-8">
                            <p className="text-brand-500 font-heading text-sm tracking-[0.3em] uppercase mb-1">Pallavolo</p>
                            <h2 className="font-heading text-4xl md:text-5xl text-white">
                                ULTIMI <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.6)]">RISULTATI</span>
                            </h2>
                            <div className="mt-3 h-px w-24 bg-gradient-to-r from-brand-500 to-transparent"></div>
                        </div>

                        {loadingMatches ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-shimmer h-[166px] rounded-2xl border border-zinc-800/50 flex flex-col justify-between overflow-hidden">
                                        <div className="bg-zinc-800/40 h-8 w-full"></div>
                                        <div className="px-6 py-5 flex items-center justify-between">
                                            <div className="w-14 h-14 rounded-full bg-zinc-800/50"></div>
                                            <div className="w-20 h-10 bg-zinc-800/50 rounded-md"></div>
                                            <div className="w-14 h-14 rounded-full bg-zinc-800/50"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentMatches.length === 0 ? (
                            <div className="p-10 text-center border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md rounded-2xl">
                                <p className="font-subheading text-lg text-zinc-500">Nessun risultato recente.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {recentMatches.slice(0, 3).map((match: Match) => {
                                    const isFusionHome = match.home.toLowerCase().includes('fusion');
                                    const isFusionAway = match.away.toLowerCase().includes('fusion');
                                    return (
                                        <Link to="/results" key={match.id} className="group relative block bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 border-t-white/5 border-l-white/5 hover:border-brand-500/60 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(217,70,239,0.15)] hover:-translate-y-1">
                                            {/* Top bar: FINAL SCORE */}
                                            <div className="bg-zinc-800/60 px-4 py-2 text-center">
                                                <span className="font-heading text-[11px] tracking-[0.3em] text-zinc-400 uppercase">Risultato Finale</span>
                                            </div>

                                            {/* Score area */}
                                            <div className="flex items-center justify-between px-6 py-5 gap-3">
                                                {/* Home Team */}
                                                <div className="flex-1 flex flex-col items-center gap-2 text-center">
                                                    {isFusionHome ? (
                                                        <img src="/assets/logo-colorato.png" alt="Fusion" loading="lazy" className="w-14 h-14 rounded-full object-contain border-2 border-brand-500/60 shadow-[0_0_16px_rgba(217,70,239,0.5)] bg-zinc-900" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-zinc-800 rounded-full border border-zinc-700 group-hover:border-brand-500/40 flex items-center justify-center transition-colors">
                                                            <span className="font-heading text-xl text-zinc-300">{match.home.charAt(0)}</span>
                                                        </div>
                                                    )}
                                                    <span className={`font-heading text-xs leading-snug ${isFusionHome ? 'text-white' : 'text-zinc-400'}`}>{match.home}</span>
                                                </div>

                                                {/* Score */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1 font-heading text-5xl tracking-tight">
                                                        <span className={`${isFusionHome ? 'text-brand-500 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]' : 'text-white'}`}>{match.sets_home}</span>
                                                        <span className="text-zinc-600 text-3xl mx-1">—</span>
                                                        <span className={`${isFusionAway ? 'text-brand-500 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]' : 'text-white'}`}>{match.sets_away}</span>
                                                    </div>
                                                </div>

                                                {/* Away Team */}
                                                <div className="flex-1 flex flex-col items-center gap-2 text-center">
                                                    {isFusionAway ? (
                                                        <img src="/assets/logo-colorato.png" alt="Fusion" loading="lazy" className="w-14 h-14 rounded-full object-contain border-2 border-brand-500/60 shadow-[0_0_16px_rgba(217,70,239,0.5)] bg-zinc-900" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-zinc-800 rounded-full border border-zinc-700 group-hover:border-brand-500/40 flex items-center justify-center transition-colors">
                                                            <span className="font-heading text-xl text-zinc-300">{match.away.charAt(0)}</span>
                                                        </div>
                                                    )}
                                                    <span className={`font-heading text-xs leading-snug ${isFusionAway ? 'text-white' : 'text-zinc-400'}`}>{match.away}</span>
                                                </div>
                                            </div>

                                            {/* Bottom: date + championship */}
                                            <div className="border-t border-zinc-800/60 px-4 py-3 flex justify-between items-center group-hover:bg-brand-500/5 transition-colors">
                                                <span className="text-[11px] md:text-xs text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-brand-500" />{match.date}
                                                </span>
                                                <span className="text-[11px] md:text-xs text-zinc-400 uppercase tracking-widest truncate max-w-[50%] flex items-center gap-1">
                                                    {match.championship_label}
                                                    <ChevronRight size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* === RIGHT: Latest News === */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="lg:w-[55%] flex flex-col"
                    >
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <p className="text-brand-500/70 font-heading text-sm tracking-[0.3em] uppercase mb-1">Dal Campo</p>
                                <h2 className="font-heading text-4xl md:text-5xl text-white">
                                    ULTIME <span className="text-brand-500">NEWS</span>
                                </h2>
                                <div className="mt-3 h-px w-24 bg-gradient-to-r from-brand-500 to-transparent"></div>
                            </div>
                            <Link to="/news" className="group hidden md:flex items-center gap-2 text-zinc-400 hover:text-white font-heading text-sm uppercase tracking-widest transition-all">
                                Tutte
                                <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-brand-500 group-hover:bg-brand-500/10 transition-all">
                                    <ChevronRight size={16} />
                                </div>
                            </Link>
                        </div>

                        {loadingNews ? (
                            <div className="flex flex-col gap-5">
                                {[1, 2].map(i => (
                                    <div key={i} className="animate-shimmer h-[192px] rounded-2xl border border-zinc-800/50 flex flex-col md:flex-row overflow-hidden">
                                        <div className="w-full md:w-48 h-48 bg-zinc-800/40 shrink-0"></div>
                                        <div className="flex-1 p-5 flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <div className="h-4 w-3/4 bg-zinc-800/50 rounded"></div>
                                                <div className="h-4 w-1/2 bg-zinc-800/50 rounded"></div>
                                            </div>
                                            <div className="h-3 w-24 bg-zinc-800/50 rounded mt-4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : news.length === 0 ? (
                            <div className="p-10 text-center border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md rounded-2xl">
                                <p className="font-subheading text-lg text-zinc-500">Nessuna news pubblicata al momento.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {news.map(article => (
                                    <Link
                                        to={`/news/${article.slug}`}
                                        key={article.id}
                                        className="group flex flex-col md:flex-row overflow-hidden bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 border-t-white/5 border-l-white/5 hover:border-brand-500/50 rounded-2xl transition-all duration-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-1 block"
                                    >
                                        {/* Image */}
                                        <div className="relative w-full h-48 md:w-48 md:h-auto shrink-0 overflow-hidden">
                                            {getImgUrl(article.cover_image_url) ? (
                                                <img
                                                    src={getImgUrl(article.cover_image_url)}
                                                    alt={article.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover transition-opacity duration-500 opacity-80 group-hover:opacity-100"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-brand-900/40 to-zinc-950 flex items-center justify-center">
                                                    <span className="font-heading text-3xl text-brand-500/20">FTV</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/30"></div>
                                            {article.category_name && (
                                                <div className="absolute top-3 left-3 px-3 py-1 bg-brand-500 text-zinc-950 font-heading text-[10px] md:text-xs uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                                                    {article.category_name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col flex-1 p-5 gap-3 justify-between">
                                            <h3 className="font-heading text-lg md:text-lg text-white group-hover:text-brand-500 transition-colors leading-snug line-clamp-2 md:line-clamp-3">
                                                {article.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                                                <Calendar size={12} className="text-brand-500/80" />
                                                {new Date(article.published_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </div>
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 border border-brand-500/50 text-brand-500 group-hover:bg-brand-500 group-hover:text-zinc-950 font-heading text-[11px] md:text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full transition-all active:scale-95">
                                                    Leggi
                                                    <ChevronRight size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        <Link to="/news" className="mt-6 flex md:hidden items-center justify-center gap-2 text-zinc-400 hover:text-white font-heading text-sm uppercase tracking-widest border border-zinc-800 hover:border-brand-500 rounded-full py-3 transition-all">
                            Tutte le notizie <ChevronRight size={16} />
                        </Link>
                    </motion.div>

                </div>
            </section>
        </div>
    );
};

export default Home;
