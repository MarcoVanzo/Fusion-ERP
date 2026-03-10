import { Helmet } from 'react-helmet-async';

const Club = () => {
    return (
        <div className="flex flex-col gap-0 pb-20">
            <Helmet>
                <title>Il Club - Fusion Team Volley</title>
                <meta name="description" content="La storia e i valori del Fusion Team Volley." />
            </Helmet>

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/demo/assets/hero-2.jpg')", filter: "brightness(0.7)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent z-10"></div>
                
                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                    <h1 className="font-heading text-6xl md:text-8xl tracking-tighter text-white mb-6 uppercase drop-shadow-xl">
                        IL <span className="text-brand-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">CLUB</span>
                    </h1>
                    <p className="font-subheading text-xl md:text-2xl text-zinc-300 tracking-widest mt-2">
                        800 ATLETE. 800 FAMIGLIE. 1 SOGNO.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="max-w-4xl mx-auto px-4 py-16 text-zinc-300 font-subheading text-lg leading-relaxed">
                <div className="bg-zinc-900/50 p-8 md:p-12 border border-zinc-800 clip-diagonal backdrop-blur-sm">
                    <h2 className="font-heading text-3xl md:text-4xl text-white mb-6 border-b border-zinc-800 pb-4">
                        LA NOSTRA <span className="text-brand-500">STORIA</span>
                    </h2>
                    <p className="mb-6">
                        Fusion Team Volley è uno dei progetti giovanili più importanti d'Italia. Nato dall'unione di realtà storiche del territorio veneziano, l'obiettivo è quello di fornire un percorso d'eccellenza per la crescita tecnica e umana delle nostre atlete.
                    </p>
                    <p className="mb-6">
                        Con oltre 800 tesserate, copriamo tutte le categorie giovanili dai primi passi fino alla Serie B2, offrendo una palestra di vita e di sport senza eguali nel nostro territorio.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-zinc-950 p-6 border border-zinc-800 text-center">
                            <div className="font-heading text-5xl text-brand-500 mb-2 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">800+</div>
                            <div className="text-sm tracking-widest uppercase">Atlete</div>
                        </div>
                        <div className="bg-zinc-950 p-6 border border-zinc-800 text-center">
                            <div className="font-heading text-5xl text-brand-500 mb-2 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">40+</div>
                            <div className="text-sm tracking-widest uppercase">Squadre</div>
                        </div>
                        <div className="bg-zinc-950 p-6 border border-zinc-800 text-center">
                            <div className="font-heading text-5xl text-brand-500 mb-2 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">13</div>
                            <div className="text-sm tracking-widest uppercase">Palestre</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Club;
