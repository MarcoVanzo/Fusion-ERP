import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { Seo } from '../components/Seo';

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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/ERP/api/router.php?module=ecommerce&action=getPublicShop');
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 font-heading tracking-widest uppercase">Caricamento Store...</p>
                </div>
            </div>
        );
    }

    const shopImage = 'https://www.fusionteamvolley.it/assets/Gemini_Generated_Image_4wijvu4wijvu4wij.jpeg';
    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': filteredProducts.map((p, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'item': {
                '@type': 'Product',
                'name': p.nome,
                'image': p.immagineUrl,
                'description': p.descrizione || p.nome,
                'category': p.categoria,
                'offers': {
                    '@type': 'Offer',
                    'priceCurrency': 'EUR',
                    'price': p.prezzo,
                    'availability': 'https://schema.org/InStock',
                    'url': 'https://www.cognitoforms.com/MVConsulting2/OrdineEcommerce'
                }
            }
        }))
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            <Seo 
                title="Store Ufficiale" 
                description="Acquista abbigliamento ufficiale e merchandising del Fusion Team Volley nel nostro Store online." 
                image={shopImage}
                structuredData={itemListSchema}
            />

            {/* Hero Section */}
            <div className="relative pt-32 pb-24 border-b-2 border-brand-500/20 overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/Gemini_Generated_Image_4wijvu4wijvu4wij.jpeg')`, filter: "brightness(0.55) saturate(1.2)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-[url('/assets/pattern-dots.svg')] opacity-[0.05] z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                        className="inline-flex items-center justify-center p-4 bg-brand-500/10 rounded-full mb-6 ring-1 ring-brand-500/30 backdrop-blur-md"
                    >
                        <ShoppingBag className="text-brand-500" size={32} />
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-heading text-white uppercase tracking-tighter drop-shadow-xl"
                    >
                        FUSION <span className="text-brand-500">STORE</span>
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-6 text-xl text-zinc-400 max-w-3xl mx-auto font-sans leading-relaxed"
                    >
                        Abbigliamento ufficiale e merchandising del Fusion Team Volley.
                        Scopri i nostri prodotti e vesti i nostri colori.
                    </motion.p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                {/* Category Filters */}
                <div className="relative mb-12">
                    <div className="flex overflow-x-auto sm:flex-wrap items-center justify-start sm:justify-center gap-4 sm:gap-3 pb-4 snap-x pr-12 sm:pr-0" style={{ scrollbarWidth: 'none' }}>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`snap-start whitespace-nowrap px-6 py-3 rounded-full text-sm md:text-base font-bold uppercase tracking-wider transition-all duration-300 border min-h-[44px] ${
                                    activeCategory === category 
                                        ? 'bg-brand-500 text-white border-brand-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] md:hover:scale-105' 
                                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600 md:hover:scale-105 backdrop-blur-sm'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    {/* Mobile swipe hint shadow */}
                    <div className="absolute top-0 right-0 bottom-4 w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none sm:hidden z-10"></div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm">
                        <ShoppingBag className="mx-auto text-zinc-600 mb-4" size={48} />
                        <h3 className="text-xl text-zinc-300 font-heading">Nessun prodotto disponibile</h3>
                        <p className="text-zinc-500 mt-2">Torna a trovarci o seleziona un'altra categoria.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filteredProducts.map((product, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="group relative bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_rgba(217,70,239,0.15)] transition-all duration-500 flex flex-col border border-zinc-800 hover:border-brand-500/50 h-[500px]"
                            >
                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                {/* Logo / Image Section */}
                                <div className="relative flex items-center justify-center bg-zinc-100 shrink-0 h-56 group-hover:bg-white transition-colors duration-500">
                                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/5 to-transparent z-10"></div>
                                    {product.immagineUrl ? (
                                        <img
                                            loading="lazy"
                                            src={product.immagineUrl}
                                            alt={product.nome}
                                            className="h-48 w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 z-20 p-4"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 z-20">
                                            <ShoppingBag size={64} className="text-zinc-800" />
                                        </div>
                                    )}
                                </div>

                                {/* Info Section */}
                                <div className="flex flex-col flex-grow p-6 z-10">
                                    <div className="mb-3">
                                        <span className="inline-block px-3 py-1 bg-zinc-800 text-brand-400 text-xs font-bold uppercase tracking-wider rounded-full border border-zinc-700">
                                            {product.categoria}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-2xl font-heading text-white uppercase tracking-tight group-hover:text-brand-400 transition-colors shrink-0 mb-4 line-clamp-2">
                                        {product.nome}
                                    </h3>
                                    
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800/80">
                                        <div className="font-heading text-3xl text-white">
                                            €{product.prezzo.toFixed(2)}
                                        </div>

                                        <a
                                            href="https://www.cognitoforms.com/MVConsulting2/OrdineEcommerce"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-brand-600 text-white px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-sm tracking-wider uppercase group/btn"
                                            title="Acquista"
                                        >
                                            Acquista
                                            <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Shop;
