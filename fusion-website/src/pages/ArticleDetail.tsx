import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Seo } from '../components/Seo';

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

const SITE_BASE = 'https://www.fusionteamvolley.it';
const ERP_BASE = 'https://www.fusionteamvolley.it/ERP';
const SITE_NAME = 'Fusion Team Volley';
const DEFAULT_IMG = `${SITE_BASE}/assets/Gemini_Generated_Image_s2944zs2944zs294.jpeg`;

const getImgUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/')) return ERP_BASE + url;
    return url;
};

const ArticleDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<ArticleDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${ERP_BASE}/api/router.php?module=website&action=getArticle&id_or_slug=${slug}`);
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
            <>
                <Seo title="Caricamento..." description="Caricamento articolo..." />
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
            </>
        );
    }

    if (error || !article) {
        return (
            <>
                <Seo title="Articolo non trovato" description="Articolo non trovato." />
                <Helmet>
                    <meta name="robots" content="noindex" />
                </Helmet>
                <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
                    <div className="glass-panel p-12 inline-block">
                        <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
                        <p className="text-zinc-400 mb-8">{error || 'Articolo non trovato.'}</p>
                        <Link to="/news" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 text-zinc-950 font-bold hover:bg-brand-400 transition-colors">
                            <ArrowLeft size={18} /> Torna alle News
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const canonicalUrl = `${SITE_BASE}/news/${article.slug}`;
    const ogImage = getImgUrl(article.cover_image_url) || DEFAULT_IMG;
    const description = article.excerpt || `${article.title} — Leggi l'articolo su ${SITE_NAME}.`;
    const dateIso = new Date(article.published_at).toISOString();

    // JSON-LD: NewsArticle + BreadcrumbList
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'NewsArticle',
                'headline': article.title,
                'description': description,
                'image': [ogImage],
                'datePublished': dateIso,
                'dateModified': dateIso,
                'author': {
                    '@type': 'Organization',
                    'name': SITE_NAME,
                    'url': 'https://www.fusionteamvolley.it'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': SITE_NAME,
                    'url': 'https://www.fusionteamvolley.it',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': `${SITE_BASE}/assets/logo-colorato.png`
                    }
                },
                'mainEntityOfPage': {
                    '@type': 'WebPage',
                    '@id': canonicalUrl
                },
                'articleSection': article.category_name
            },
            {
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.fusionteamvolley.it/' },
                    { '@type': 'ListItem', 'position': 2, 'name': 'News', 'item': `${SITE_BASE}/news` },
                    { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': canonicalUrl }
                ]
            }
        ]
    };

    return (
        <>
            <Seo 
                title={article.title} 
                description={description} 
                image={ogImage}
                type="article"
                pathname={`/news/${article.slug}`}
            />
            <Helmet>
                <meta name="robots" content="index, follow" />
                <meta property="article:published_time" content={dateIso} />
                <meta property="article:section" content={article.category_name} />

                {/* JSON-LD */}
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>

            <article className="flex flex-col min-h-screen pb-24">
                {/* Immersive Cover Header */}
                <section className="relative h-[55vh] min-h-[400px] flex flex-col justify-end overflow-hidden mb-12">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${ogImage}')` }}
                    />

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-zinc-950/60 z-10"></div>
                    <div className="absolute inset-0 z-10 opacity-40 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                    <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

                    {/* Content */}
                    <div className="relative z-20 max-w-5xl mx-auto px-4 w-full pb-20 md:pb-28">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs tracking-widest uppercase font-heading bg-zinc-950/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 mb-6 inline-flex shadow-lg shadow-black/50">
                            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
                            <span className="text-zinc-600">/</span>
                            <Link to="/news" className="text-zinc-400 hover:text-white transition-colors">News</Link>
                            <span className="text-zinc-600">/</span>
                            <span className="text-brand-500 truncate max-w-[150px] sm:max-w-xs">{article.title}</span>
                        </div>

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
                                <time dateTime={dateIso}>
                                    {new Date(article.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </time>
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

                    {/* Internal linking — back to news */}
                    <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                        <Link
                            to="/news"
                            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-heading text-sm uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft size={16} /> Tutte le news
                        </Link>
                        <span className="text-zinc-600 text-xs uppercase tracking-widest">{SITE_NAME}</span>
                    </div>
                </div>
            </article>
        </>
    );
};

export default ArticleDetail;
