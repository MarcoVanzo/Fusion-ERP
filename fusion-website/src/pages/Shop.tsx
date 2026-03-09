import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ExternalLink } from 'lucide-react';

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
                const res = await fetch('/ERP/api/?module=ecommerce&action=getPublicShop');
                const data = await res.json();
                if (data.status === 'success' && data.data.products) {
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
        <div className="bg-zinc-950 min-h-screen pb-24">
            {/* Header Section - Luxury Merch Style */}
            <header className="relative pt-32 pb-20 px-4 overflow-hidden mb-12 border-b-8 border-brand-500 clip-diagonal">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-zinc-900 opacity-50" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/20 to-zinc-950"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500 text-zinc-950 mb-8 clip-diagonal-rev transform rotate-12">
                        <ShoppingBag size={40} className="-rotate-12" />
                    </div>
                    <h1 className="font-heading text-7xl md:text-9xl tracking-tighter text-white mb-6 leading-none">
                        FUSION <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-400 to-brand-600">STORE</span>
                    </h1>
                    <p className="font-subheading text-2xl text-zinc-400 tracking-widest max-w-2xl mx-auto">
                        ABBIGLIAMENTO UFFICIALE E MERCHANDISING
                    </p>
                </div>
            </header>

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
                                <div className="relative w-full aspect-[4/5] bg-zinc-900 mb-8 clip-diagonal-rev overflow-hidden border border-zinc-800 group-hover:border-brand-500 transition-colors">
                                    {/* Subtle background glow on hover */}
                                    <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-colors z-0"></div>

                                    {product.immagineUrl ? (
                                        <img
                                            src={product.immagineUrl}
                                            alt={product.nome}
                                            className="w-full h-full object-contain p-8 relative z-10 group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl"
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
                                            href="https://www.cognitoforms.com/FusionTeamVolley/StoreRegistration" // Pseudo-URL as requested
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
