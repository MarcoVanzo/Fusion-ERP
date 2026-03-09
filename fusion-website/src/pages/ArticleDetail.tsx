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
            <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
                <div className="h-8 w-24 bg-white/10 rounded mb-8"></div>
                <div className="h-64 md:h-96 w-full bg-white/5 rounded-2xl mb-8"></div>
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
            <div className="max-w-4xl mx-auto px-4 py-24 text-center">
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
        <article className="max-w-4xl mx-auto px-4 py-12 pb-24">
            {/* Back button */}
            <Link to="/news" className="inline-flex items-center gap-2 text-zinc-400 hover:text-brand-500 transition-colors mb-8 font-medium text-sm tracking-wide uppercase">
                <ChevronLeft size={16} /> Tutte le news
            </Link>

            {/* Header */}
            <header className="mb-10 text-center">
                {article.category_name && (
                    <div
                        className="inline-block px-4 py-1 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider"
                        style={{ backgroundColor: article.color_hex || '#eab308' }}
                    >
                        {article.category_name}
                    </div>
                )}

                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                    {article.title}
                </h1>

                <div className="flex items-center justify-center gap-6 text-zinc-400 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brand-500" />
                        {new Date(article.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Cover Image */}
            {article.cover_image_url && (
                <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent z-10 top-2/3"></div>
                    <img
                        src={article.cover_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

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
                    className="prose prose-invert prose-brand max-w-none prose-img:rounded-xl prose-img:shadow-lg prose-headings:font-bold prose-a:text-brand-500 hover:prose-a:text-brand-400 prose-p:text-zinc-300 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.content_html }}
                />
            </div>
        </article>
    );
};

export default ArticleDetail;
