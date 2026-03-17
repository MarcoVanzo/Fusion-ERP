import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Star, ExternalLink, Palette, Layout, Droplets } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const ScratchTexture = () => {
    const scribblePath = useMemo(() => {
        let d = "";
        const numStrokes = 400; // very dense
        for (let i = 0; i < numStrokes; i++) {
            const t = 0.05 + (i / numStrokes) * 0.9;
            const distFromCenter = Math.abs(t - 0.5) * 2;
            const maxLength = 160;
            let length = maxLength * (1 - Math.pow(distFromCenter, 1.8));
            length *= (0.4 + Math.random() * 0.8);
            if (length < 15) continue;

            const cx = t * 100 + (Math.random() * 14 - 7);
            const cy = t * 125 + (Math.random() * 16 - 8);

            const angle = -45 + (Math.random() * 14 - 7);
            const rad = angle * Math.PI / 180;

            const startX = cx - Math.cos(rad) * (length / 2);
            const startY = cy - Math.sin(rad) * (length / 2);
            const endX = cx + Math.cos(rad) * (length / 2);
            const endY = cy + Math.sin(rad) * (length / 2);

            d += `M ${startX.toFixed(1)},${startY.toFixed(1)} L ${endX.toFixed(1)},${endY.toFixed(1)} `;
        }
        return d;
    }, []);

    return (
        <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none group-hover:scale-105 transition-all duration-700 z-0 py-8 px-6 opacity-30 mix-blend-overlay">
            <path d={scribblePath} fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="1" />
            <path d={scribblePath} fill="none" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" transform="translate(1, -2) rotate(1 50 62)" />
        </svg>
    )
};

interface Product {
    nome: string;
    prezzo: number;
    immagineUrl: string;
    descrizione: string;
    categoria: string;
}

const Shop = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('TUTTI');
    const [categories, setCategories] = useState<string[]>(['TUTTI']);
    const [theme, setTheme] = useState<'brutalist' | 'glass' | 'street'>('brutalist');

    // We connect to the ERP proxy that bypasses CORS and fetches the real items.
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('https://www.fusionteamvolley.it/ERP/api/router.php?module=ecommerce&action=getPublicShop');
                const data = await res.json();
                if ((data.status === 'success' || data.success === true) && data.data.products) {
                    const prods = data.data.products;
                    setProducts(prods);

                    const cats = new Set<string>();
                    prods.forEach((p: Product) => cats.add(p.categoria));
                    setCategories(['TUTTI', ...Array.from(cats)]);
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = activeCategory === 'TUTTI'
        ? products
        : products.filter(p => p.categoria === activeCategory);

    return (
        <div className={`flex flex-col min-h-screen pb-24 font-sans text-white transition-colors duration-500 ${theme === 'brutalist' ? 'bg-zinc-950' :
                theme === 'glass' ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' :
                    'bg-zinc-900'
            }`}>
            <Helmet>
                <title>Shop Ufficiale - Fusion Team Volley</title>
                <meta name="description" content="Acquista abbigliamento ufficiale e merchandising del Fusion Team Volley nel nostro Store online." />
            </Helmet>

            {/* Theme Switcher */}
            <div className="fixed bottom-6 right-6 z-50 flex gap-2 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
                <button onClick={() => setTheme('brutalist')} className={`p-3 rounded-full transition-all ${theme === 'brutalist' ? 'bg-brand-500 text-black' : 'text-white hover:bg-white/20'}`} title="Cyber Brutalismo">
                    <Layout size={20} />
                </button>
                <button onClick={() => setTheme('glass')} className={`p-3 rounded-full transition-all ${theme === 'glass' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-white hover:bg-white/20'}`} title="Eleganza Glass">
                    <Droplets size={20} />
                </button>
                <button onClick={() => setTheme('street')} className={`p-3 rounded-full transition-all ${theme === 'street' ? 'bg-zinc-200 text-zinc-900' : 'text-white hover:bg-white/20'}`} title="Streetwear Minimal">
                    <Palette size={20} />
                </button>
            </div>

            {/* Hero Section */}
            <section className={`relative flex flex-col justify-center overflow-hidden mb-12 transition-all duration-500 py-24 md:py-32 ${theme === 'street' ? 'min-h-[50vh]' : 'min-h-[45vh]'
                }`}>
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/Gemini_Generated_Image_4wijvu4wijvu4wij.jpeg')", filter: theme === 'street' ? "brightness(0.35) grayscale(100%)" : "brightness(0.5)" }}
                />

                {theme === 'brutalist' && (
                    <>
                        <div className="absolute inset-0 bg-zinc-950/70 z-10 transition-colors"></div>
                        <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>
                    </>
                )}

                {theme === 'glass' && (
                    <div className="absolute inset-0 bg-indigo-950/50 mix-blend-multiply z-10 transition-colors"></div>
                )}

                {/* Content */}
                <div className={`relative z-20 px-4 max-w-4xl mx-auto flex flex-col pt-8 transition-all duration-500 ${theme === 'street' ? 'items-start text-left w-full pl-8 md:pl-16' : 'items-center text-center'
                    }`}>
                    {theme === 'brutalist' && (
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500 text-zinc-950 mb-6 clip-diagonal-rev transform rotate-12 shadow-[0_0_30px_rgba(214,90,134,0.6)]">
                            <ShoppingBag size={40} className="-rotate-12" />
                        </div>
                    )}

                    <h1 className={`font-heading tracking-tighter mb-4 text-white uppercase drop-shadow-xl transition-all duration-500 ${theme === 'street' ? 'text-7xl md:text-9xl leading-none' : 'text-6xl md:text-8xl leading-none'
                        }`}>
                        FUSION {theme !== 'street' && <span className={theme === 'brutalist' ? "text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]" : "text-indigo-400"}>STORE</span>}
                        {theme === 'street' && <><br /><span className="text-transparent opacity-80" style={{ WebkitTextStroke: '2px white' }}>STORE</span></>}
                    </h1>

                    <p className={`font-subheading tracking-widest transition-all duration-500 mt-4 md:mt-6 z-20 relative ${theme === 'street' ? 'text-lg md:text-xl text-zinc-400 max-w-md' :
                            theme === 'glass' ? 'text-lg md:text-xl text-zinc-200 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20' :
                                'text-xl md:text-2xl text-zinc-300 bg-zinc-950/80 inline-block px-6 py-3 md:py-4 border border-zinc-800 rounded-none leading-relaxed shadow-xl'
                        }`}>
                        ABBIGLIAMENTO UFFICIALE E MERCHANDISING
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 w-full">
                {/* Category Filters */}
                <div className={`flex flex-wrap items-center gap-4 mb-16 transition-all duration-500 ${theme === 'street' ? 'justify-start' : 'justify-center'}`}>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`font-subheading text-lg tracking-wider px-8 py-3 transition-all ${theme === 'brutalist'
                                    ? `clip-diagonal ${activeCategory === category ? 'bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`
                                    : theme === 'glass'
                                        ? `rounded-full backdrop-blur-md border ${activeCategory === category ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`
                                        : `border-b-2 px-2 py-1 ${activeCategory === category ? 'border-zinc-200 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`animate-pulse h-[500px] ${theme === 'glass' ? 'bg-white/5 rounded-2xl' : 'bg-zinc-900 clip-diagonal-rev'}`}></div>)}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-20 text-center border border-zinc-800 bg-zinc-900/30 clip-diagonal">
                        <p className="font-subheading text-2xl text-zinc-500">Nessun prodotto disponibile.</p>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 transition-all duration-500 ${theme === 'street' ? 'gap-y-24' : 'gap-y-16'}`}>
                        {filteredProducts.map((product, idx) => (
                            <div key={idx} className={`group flex flex-col relative transition-all duration-500 ${theme === 'street' ? 'items-start hover:-translate-y-1' : 'items-center hover:-translate-y-2 hover:scale-[1.02]'} ${theme === 'glass' ? 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : ''
                                }`}>

                                {/* Product Image Container */}
                                <div className={`relative w-full aspect-[4/5] mb-8 overflow-hidden transition-all duration-500 flex items-center justify-center ${theme === 'brutalist' ? 'bg-black border border-zinc-800 group-hover:border-brand-500 clip-diagonal' :
                                        theme === 'glass' ? 'bg-white/5 rounded-xl inner-shadow' :
                                            'bg-transparent'
                                    }`}>

                                    {theme === 'brutalist' && <ScratchTexture />}

                                    {product.immagineUrl ? (
                                        <img
                                            src={product.immagineUrl}
                                            alt={product.nome}
                                            className={`w-full h-full object-contain relative z-10 transition-transform duration-700 ${theme === 'street' ? 'p-0 scale-100 group-hover:scale-110 sepia-[.2] group-hover:sepia-0' : 'p-6 group-hover:scale-110'
                                                }`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center z-10 relative">
                                            <ShoppingBag size={64} className="text-zinc-800" />
                                        </div>
                                    )}

                                    {/* Floating Elements */}
                                    {theme !== 'street' && (
                                        <div className={`absolute top-4 left-4 z-20 font-subheading text-xs font-bold px-3 py-1 ${theme === 'brutalist' ? 'bg-brand-500 text-zinc-950 clip-diagonal' : 'bg-indigo-500 text-white rounded-full'
                                            }`}>
                                            OFFICIAL
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className={`w-full flex-grow flex flex-col justify-between ${theme === 'brutalist' ? 'text-center px-4' : theme === 'glass' ? 'text-left px-2' : 'text-left'}`}>
                                    <div>
                                        {theme !== 'street' && (
                                            <div className={`flex items-center gap-1 mb-3 ${theme === 'brutalist' ? 'justify-center text-brand-500' : 'justify-start text-indigo-400'}`}>
                                                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= 5 ? (theme === 'brutalist' ? "fill-brand-500" : "fill-indigo-400") : ""} />)}
                                            </div>
                                        )}

                                        <h3 className={`font-heading text-white mb-2 line-clamp-2 leading-tight ${theme === 'street' ? 'text-3xl uppercase tracking-wider' : 'text-2xl'}`}>
                                            {product.nome}
                                        </h3>

                                        <p className={`font-subheading text-sm mb-6 ${theme === 'street' ? 'text-zinc-400 uppercase tracking-widest' : 'text-zinc-500'}`}>
                                            {theme === 'street' ? `[ ${product.categoria} ]` : product.categoria}
                                        </p>
                                    </div>

                                    <div className={`mt-auto ${theme === 'street' ? 'flex items-center justify-between border-t border-zinc-800 pt-4 mt-4 w-full' : ''}`}>
                                        <div className={`font-heading text-white ${theme === 'street' ? 'text-3xl' : 'text-4xl mb-6'}`}>
                                            €{product.prezzo.toFixed(2)}
                                        </div>

                                        <a
                                            href="https://www.cognitoforms.com/MVConsulting2/OrdineEcommerce"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${theme === 'brutalist' ? 'w-full py-4 bg-white text-zinc-950 font-heading text-xl hover:bg-brand-500 transition-colors flex items-center justify-center gap-2 clip-diagonal' :
                                                    theme === 'glass' ? 'w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-heading text-lg rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30' :
                                                        'py-2 px-8 border border-zinc-700 text-zinc-300 font-subheading text-sm hover:bg-white hover:text-black hover:border-white transition-all duration-300 flex items-center gap-2 rounded-full uppercase tracking-wider'
                                                }`}
                                        >
                                            {theme === 'street' ? 'Acquista' : 'ACQUISTA ORA'} {theme !== 'street' && <ExternalLink size={20} />}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Shop;
