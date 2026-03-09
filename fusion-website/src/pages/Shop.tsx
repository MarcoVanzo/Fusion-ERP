import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Star, ExternalLink } from 'lucide-react';

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
        <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none group-hover:scale-105 transition-all duration-700 z-0 py-8 px-6">
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
        <div className="flex flex-col min-h-screen pb-24 font-sans text-white">
            {/* Emotional Header Hero */}
            <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden mb-12">
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/Gemini_Generated_Image_4wijvu4wijvu4wij.jpeg')", filter: "brightness(0.6)" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-zinc-950/70 z-10 transition-colors"></div>
                <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d65a86 0, #d65a86 2px, transparent 2px, transparent 100px)' }}></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>

                {/* Content */}
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center pt-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500 text-zinc-950 mb-6 clip-diagonal-rev transform rotate-12 shadow-[0_0_30px_rgba(214,90,134,0.6)]">
                        <ShoppingBag size={40} className="-rotate-12" />
                    </div>
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter mb-4 text-white uppercase drop-shadow-xl leading-none">
                        FUSION <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(214,90,134,0.5)]">STORE</span>
                    </h1>
                    <p className="font-subheading text-xl md:text-2xl text-zinc-300 tracking-widest bg-zinc-950/50 inline-block px-4 py-1 border border-white/10 rounded-sm">
                        ABBIGLIAMENTO UFFICIALE E MERCHANDISING
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4">
                {/* Category Filters */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`font-subheading text-lg tracking-wider px-8 py-3 transition-all clip-diagonal ${activeCategory === category
                                ? 'bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="animate-pulse h-[500px] bg-zinc-900 clip-diagonal-rev"></div>)}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-20 text-center border border-zinc-800 bg-zinc-900/30 clip-diagonal">
                        <p className="font-subheading text-2xl text-zinc-500">Nessun prodotto disponibile.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        {filteredProducts.map((product, idx) => (
                            <div key={idx} className="group flex flex-col items-center">

                                {/* Product Image Container */}
                                <div className="relative w-full aspect-[4/5] bg-black border border-zinc-800 mb-8 overflow-hidden group-hover:border-brand-500 transition-all duration-500 rounded-sm flex items-center justify-center clip-diagonal">

                                    {/* Procedural "Scratch-Off" Background Texture */}
                                    <ScratchTexture />

                                    {product.immagineUrl ? (
                                        <img
                                            src={product.immagineUrl}
                                            alt={product.nome}
                                            className="w-full h-full object-contain p-6 relative z-10 group-hover:scale-110 transition-transform duration-700 mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center z-10 relative">
                                            <ShoppingBag size={64} className="text-zinc-800" />
                                        </div>
                                    )}

                                    {/* Floating Elements */}
                                    <div className="absolute top-4 left-4 z-20 bg-brand-500 text-zinc-950 font-subheading text-xs font-bold px-3 py-1 clip-diagonal">
                                        OFFICIAL
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className="text-center w-full px-4 flex-grow flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 text-brand-500 mb-3">
                                            {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= 5 ? "fill-brand-500" : ""} />)}
                                        </div>

                                        <h3 className="font-heading text-2xl text-white mb-2 line-clamp-2 leading-tight">
                                            {product.nome}
                                        </h3>

                                        <p className="font-subheading text-zinc-500 text-sm mb-6">
                                            {product.categoria}
                                        </p>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="font-heading text-4xl text-white mb-6">
                                            €{product.prezzo.toFixed(2)}
                                        </div>

                                        {/* Cognito Integration Button - Replace # with actual general form URL if product ID needs passing, 
                        else just direct to the generic store registration form */}
                                        <a
                                            href="https://www.cognitoforms.com/MVConsulting2/OrdineEcommerce"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-4 bg-white text-zinc-950 font-heading text-xl hover:bg-brand-500 transition-colors flex items-center justify-center gap-2 clip-diagonal"
                                        >
                                            ACQUISTA ORA <ExternalLink size={20} />
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
