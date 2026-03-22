import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Youtube, MapPin } from 'lucide-react';

interface ForesteriaInfo {
    description: string;
    address: string;
    lat: number;
    lng: number;
}

interface ForesteriaMedia {
    id: string;
    type: 'photo' | 'video' | 'youtube';
    file_path: string;
    url?: string;
    title?: string;
    description?: string;
}

const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const getImgUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return ERP_BASE + path;
};

// Ensure YouTube URLs are correctly formatted for an iframe embed
const formatYoutubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/embed/')) return url;
    
    // Extract video ID from varions formats
    const patterns = [
        /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
        }
    }
    
    return url;
};

const Foresteria = () => {
    const [info, setInfo] = useState<ForesteriaInfo | null>(null);
    const [media, setMedia] = useState<ForesteriaMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForesteriaData = async () => {
            try {
                const apiUrl = 'https://www.fusionteamvolley.it/ERP/api/router.php?module=societa&action=getPublicForesteria';
                    
                const res = await fetch(apiUrl);
                const data = await res.json();
                
                if (data.status === 'success' || data.success === true) {
                    setInfo(data.data?.info || null);
                    setMedia(data.data?.media || []);
                }
            } catch (error) {
                console.error('Failed to fetch foresteria data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchForesteriaData();
    }, []);

    const photos = media.filter(m => m.type === 'photo');
    const videos = media.filter(m => m.type === 'video' || m.type === 'youtube');

    return (
        <div className="flex flex-col gap-0 pb-20">
            <Helmet>
                <title>La Foresteria - Fusion Team Volley</title>
                <meta name="description" content="Scopri la Foresteria del Fusion Team Volley: l'ambiente ideale per la crescita delle nostre atlete." />
            </Helmet>

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/hero-3.jpg')`, filter: "brightness(0.6) saturate(1.2)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent z-10"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #a21caf 0, #a21caf 2px, transparent 2px, transparent 100px)' }}></div>
                
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 md:px-6 py-2 border border-brand-500/50 bg-zinc-950/80 mb-6 clip-diagonal uppercase text-[10px] md:text-xs font-bold text-brand-500 tracking-[0.2em] backdrop-blur-sm">
                        La Nostra Casa
                    </div>
                    <h1 className="font-heading text-5xl md:text-7xl tracking-tighter text-white mb-6 uppercase drop-shadow-xl leading-none">
                        LA <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">FORESTERIA</span>
                    </h1>
                    <p className="font-subheading text-xl md:text-2xl text-zinc-300 tracking-widest mt-2">
                        CRESCERE INSIEME, DENTRO E FUORI DAL CAMPO.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300 font-subheading text-lg leading-relaxed relative">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-brand-500/5 blur-[150px] rounded-full -z-10 pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Column: Description */}
                    <div className="lg:w-2/3">
                        <div 
                            className="bg-zinc-900/50 p-6 md:p-10 lg:p-14 pb-20 md:pb-24 lg:pb-28 border border-zinc-800 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] h-full relative z-10 w-full"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), 0 100%)' }}
                        >
                            <h2 className="font-heading text-3xl md:text-4xl text-white mb-6 border-b border-zinc-800 pb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                                IL NOSTRO <span className="text-brand-500">PROGETTO</span>
                            </h2>
                            
                            {loading ? (
                                <div className="animate-pulse flex flex-col gap-4 mt-6">
                                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-4/6"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                                </div>
                            ) : info?.description ? (
                                <div className="mt-6 whitespace-pre-wrap break-words font-sans text-sm md:text-base text-zinc-300 leading-[1.8] font-light tracking-wide lowercase">
                                    {info.description.split('\n').map((line, i) => {
                                        if (line.trim().startsWith('-')) {
                                            const parts = line.split(':');
                                            if (parts.length > 1) {
                                                return (
                                                    <p key={i} className="mb-4 pl-4 border-l-2 border-brand-500/50">
                                                        <span className="font-bold text-white capitalize">{parts[0]}</span>:{parts.slice(1).join(':')}
                                                    </p>
                                                );
                                            }
                                        }
                                        return <p key={i} className="mb-4">{line}</p>;
                                    })}
                                </div>
                            ) : (
                                <p className="mt-6 text-zinc-500 italic">Nessuna descrizione disponibile al momento.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Info & Location */}
                    <div className="lg:w-1/3 flex flex-col gap-6 w-full">
                        <div className="bg-brand-500 text-zinc-950 p-8 md:px-10 py-12 md:py-16 clip-diagonal shadow-[0_0_25px_rgba(217,70,239,0.3)] relative z-10 flex flex-col w-full">
                            <h3 className="font-heading text-2xl mb-6 font-bold tracking-tight">I NUMERI</h3>
                            <div className="flex flex-col gap-6">
                                <div className="border-b border-zinc-950/20 pb-4">
                                    <div className="text-4xl md:text-5xl font-heading mb-1 tracking-tighter">14</div>
                                    <div className="text-xs uppercase tracking-widest font-bold opacity-80 mt-1">Posti Letto</div>
                                </div>
                                <div className="border-b border-zinc-950/20 pb-4">
                                    <div className="text-4xl md:text-5xl font-heading mb-1 tracking-tighter">24/7</div>
                                    <div className="text-xs uppercase tracking-widest font-bold opacity-80 mt-1">Assistenza Tutor</div>
                                </div>
                                <div className="pb-2">
                                    <div className="text-4xl md:text-5xl font-heading mb-1 tracking-tighter">100%</div>
                                    <div className="text-xs uppercase tracking-widest font-bold opacity-80 mt-1">Volley &amp; Studio</div>
                                </div>
                            </div>
                        </div>

                        {info?.address && (
                            <div 
                                className="bg-zinc-900/50 p-8 md:px-10 py-12 md:py-16 pt-20 border border-zinc-800 backdrop-blur-md h-full min-h-[350px] flex flex-col relative z-10 w-full"
                                style={{ clipPath: 'polygon(0 40px, 100% 0, 100% 100%, 0 100%)' }}
                            >
                                <h3 className="font-heading text-xl md:text-2xl text-white mb-6 flex items-center gap-2 shrink-0">
                                    <MapPin className="text-brand-500" size={24} />
                                    DOVE SIAMO
                                </h3>
                                <div className="flex-1 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800/50 relative min-h-[150px]">
                                    <iframe 
                                        src={`https://maps.google.com/maps?q=${info.lat},${info.lng}&z=15&output=embed`} 
                                        className="absolute inset-0 w-full h-full border-0" 
                                        allowFullScreen 
                                        loading="lazy" 
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                                <p className="text-zinc-400 font-sans text-xs mt-6 shrink-0 uppercase tracking-widest leading-relaxed">{info.address}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Media Section: Videos */}
            {videos.length > 0 && (
                <section className="w-full relative py-20 bg-zinc-950 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,1)] flex flex-col items-center">
                    <div className="absolute inset-0 bg-brand-500/5 mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #a21caf 0, #a21caf 2px, transparent 2px, transparent 100px)' }}></div>
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10 text-center">
                        <h2 className="font-heading text-4xl md:text-5xl text-white">
                            VIVI LA <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">FORESTERIA</span>
                        </h2>
                        <div className="mt-4 h-[2px] w-32 bg-gradient-to-r from-transparent via-brand-500 to-transparent mx-auto"></div>
                    </div>

                    <div className="w-full relative z-10 flex flex-col gap-0 shadow-2xl">
                        {videos.map(video => {
                            const videoUrl = video.url || video.file_path;
                            return (
                                <div key={video.id} className="w-full relative bg-black aspect-video max-h-[85vh] overflow-hidden group border-y border-zinc-800">
                                    {video.type === 'youtube' && videoUrl ? (
                                        <iframe 
                                            src={formatYoutubeEmbedUrl(videoUrl)} 
                                            title={video.title || "YouTube Video"} 
                                            className="w-full h-full border-0 absolute inset-0 max-w-[1920px] mx-auto opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video 
                                            src={getImgUrl(video.file_path)} 
                                            controls 
                                            className="w-full h-full object-cover absolute inset-0 max-w-[1920px] mx-auto opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                        ></video>
                                    )}
                                    {video.title && (
                                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end justify-center">
                                            <h4 className="font-heading text-2xl md:text-4xl text-white flex items-center gap-3 drop-shadow-xl">
                                                {video.type === 'youtube' && <Youtube size={36} className="text-brand-500" />}
                                                {video.title}
                                            </h4>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Media Section: Photos Gallery */}
            {photos.length > 0 && (
                <section className="w-full relative py-20 bg-zinc-950 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,1)] flex flex-col items-center">
                    <div className="absolute inset-0 bg-brand-500/5 mix-blend-overlay pointer-events-none"></div>
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10 text-center w-full">
                        <h2 className="font-heading text-4xl md:text-5xl text-white">
                            LA NOSTRA <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">GALLERY</span>
                        </h2>
                        <div className="mt-4 h-[2px] w-32 bg-gradient-to-r from-transparent via-brand-500 to-transparent mx-auto"></div>
                    </div>

                    <div className={`w-full relative z-10 grid gap-0 border-y border-zinc-800 bg-black ${
                        photos.length === 1 ? 'grid-cols-1' :
                        photos.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        photos.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        photos.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
                        'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                    }`}>
                        {photos.map(photo => (
                            <div key={photo.id} className="group relative aspect-[4/3] md:aspect-square lg:aspect-[4/3] overflow-hidden bg-zinc-900 border-[0.5px] border-zinc-800/50 hover:border-brand-500/50 transition-colors cursor-pointer">
                                <img 
                                    src={getImgUrl(photo.file_path)} 
                                    alt={photo.title || "Foresteria"} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:saturate-150"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    {photo.title && <span className="font-heading text-sm text-white drop-shadow-md">{photo.title}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Foresteria;
