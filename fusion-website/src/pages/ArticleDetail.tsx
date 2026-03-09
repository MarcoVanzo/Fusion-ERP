import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ArrowLeft } from 'lucide-react';

interface ArticleDetailData {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    content_html: string;
    cover_image_url?: string;
    published_at: string;
    category_name: string;
    color_hex?: string;
}

const ArticleDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<ArticleDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const res = await fetch(`https://www.fusionteamvolley.it/ERP/api/router.php?module=website&action=getArticle&id_or_slug=${slug}`);
                const data = await res.json();

                if (data.status === 'success' || data.success === true) {
                    setArticle(data.data);
                } else {
                    setError(data.message || 'Articolo non trovato.');
                }
            } catch (err) {
                setError('Errore di connessione al server ERP.');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchArticle();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 animate-pulse">
                <div className="h-8 w-24 bg-white/10 rounded mb-8"></div>
                <div className="h-64 md:h-96 w-full bg-white/5 rounded-none mb-8"></div>
                <div className="h-12 w-3/4 bg-white/10 rounded mb-6"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                    <div className="h-4 bg-white/5 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
                <div className="glass-panel p-12 inline-block">
                    <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
                    <p className="text-zinc-400 mb-8">{error || 'Articolo non trovato.'}</p>
                    <Link to="/news" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 text-zinc-950 font-bold hover:bg-brand-400 transition-colors">
                        <ArrowLeft size={18} /> Torna alle News
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <article className="flex flex-col min-h-screen pb-24">
            {/* Immersive Cover Header */}
            <section className="relative h-[55vh] min-h-[400px] flex flex-col justify-end overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                    style={{ backgroundImage: `url('${article.cover_image_url || '/demo/assets/Gemini_Generated_Image_s2944zs2944zs294.jpeg'}')` }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-zinc-950/60 z-10"></div>
                <div className="absolute inset-0 z-10 opacity-40 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

                {/* Content */}
                <div className="relative z-20 max-w-5xl mx-auto px-4 w-full pb-20 md:pb-28">
                    <Link to="/news" className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors mb-6 font-heading text-sm tracking-widest uppercase bg-zinc-950/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <ChevronLeft size={16} /> Tutte le news
                    </Link>

                    {article.category_name && (
                        <div
                            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4 uppercase tracking-wider shadow-lg border border-white/20"
                            style={{ backgroundColor: article.color_hex || '#d65a86' }}
                        >
                            {article.category_name}
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-heading text-white tracking-tighter mb-6 leading-tight drop-shadow-2xl">
                        {article.title}
                    </h1>

                    <div className="flex items-center gap-6 text-zinc-300 text-sm font-subheading uppercase tracking-widest bg-zinc-950/40 inline-flex px-4 py-2 rounded-none backdrop-blur-sm border border-white/5">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-brand-500" />
                            {new Date(article.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 w-full">

                {/* Content */}
                <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
                    {/* Decorative background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] rounded-full pointer-events-none"></div>

                    {article.excerpt && (
                        <p className="text-xl font-light text-zinc-300 leading-relaxed mb-10 pb-10 border-b border-white/10 italic">
                            "{article.excerpt}"
                        </p>
                    )}

                    {/* HTML Content Render */}
                    <div
                        className="prose prose-invert prose-brand max-w-none prose-img:rounded-none prose-img:shadow-lg prose-headings:font-bold prose-a:text-brand-500 hover:prose-a:text-brand-400 prose-p:text-zinc-300 prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: article.content_html }}
                    />
                </div>
            </div>
        </article>
    );
};

export default ArticleDetail;
