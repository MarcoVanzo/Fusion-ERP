import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const recentMatches = [
    { id: 1, home: 'FUSION VOLLEY', away: 'TEAM B', sets_home: 3, sets_away: 1, date: '12 Nov' },
    { id: 2, home: 'TEAM C', away: 'FUSION VOLLEY', sets_home: 0, sets_away: 3, date: '10 Nov' },
];

const Proposal3 = () => {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 font-heading text-white overflow-hidden">
            <Helmet>
                <title>Proposal 3: Brutalist Urban - Fusion Team Volley</title>
            </Helmet>

            {/* Brutalist Hero */}
            <section className="relative min-h-[90vh] flex flex-col pt-24 px-4 md:px-12 border-b-[16px] border-brand-500">
                <div className="absolute top-20 right-10 w-96 h-96 bg-brand-500 z-0 mix-blend-difference rotate-12 opacity-80 backdrop-blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-64 h-64 border-[32px] border-brand-400 z-0 rotate-45 opacity-50"></div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full flex-grow">
                    <div className="flex flex-col justify-center">
                        <div className="inline-block bg-white text-black px-4 py-1 text-xl uppercase font-black w-max mb-6 transform -rotate-2 border-4 border-black shadow-[8px_8px_0px_#e84382]">
                            IL 7° SETTORE GIOVANILE IN ITALIA
                        </div>
                        
                        <h1 className="text-[6rem] md:text-[8rem] lg:text-[11rem] leading-[0.8] uppercase text-white font-black tracking-tighter mix-blend-exclusion z-20">
                            FUSION<br/>
                            <span className="text-brand-500 stroke-text">TEAM</span><br/>
                            VOLLEY
                        </h1>

                        <p className="font-sans text-2xl mt-12 mb-12 max-w-xl font-bold bg-zinc-900 border-l-[16px] border-brand-500 p-6 shadow-[8px_8px_0px_#FF1493]">
                            800 ATLETE. UN UNICO GRANDE SOGNO. IL VOLLEY COME NON L'HAI MAI VISTO.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-8">
                            <Link to="#" className="bg-brand-500 text-black px-12 py-6 text-3xl font-black uppercase hover:-translate-y-2 hover:shadow-[12px_12px_0px_#ffffff] transition-all border-4 border-transparent hover:border-white">
                                I Roster
                            </Link>
                            <Link to="#" className="bg-transparent text-white border-4 border-white px-12 py-6 text-3xl font-black uppercase hover:bg-white hover:text-black hover:-translate-y-2 hover:shadow-[12px_12px_0px_#e84382] transition-all">
                                Lo Store
                            </Link>
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <img 
                            src="/assets/squadra-u18.jpeg" 
                            alt="Team" 
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-[120%] h-auto max-w-[800px] object-cover filter grayscale contrast-150 border-8 border-brand-500 shadow-[-20px_20px_0px_#ffffff]"
                        />
                    </div>
                </div>
                
                {/* Marquee effect */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden whitespace-nowrap bg-brand-500 py-2 border-y-4 border-black z-30">
                    <div className="animate-marquee inline-block text-black font-black text-2xl uppercase tracking-widest">
                        RICONOSCIMENTO FIPAV /// 800+ ATLETE /// SETTORE GIOVANILE D'ECCELLENZA /// RICONOSCIMENTO FIPAV /// 800+ ATLETE /// SETTORE GIOVANILE D'ECCELLENZA ///
                    </div>
                </div>
            </section>

            {/* Brutalist Cards Section */}
            <section className="px-4 md:px-12 py-24 bg-zinc-100 text-zinc-950">
                <h2 className="text-7xl font-black uppercase mb-16 underline decoration-brand-500 decoration-[16px] underline-offset-8">
                    ULTIMI RISULTATI
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {recentMatches.map(match => (
                        <div key={match.id} className="bg-white border-8 border-zinc-950 p-8 shadow-[16px_16px_0px_#FF1493] transform hover:-translate-y-2 hover:shadow-[24px_24px_0px_#FF1493] transition-all">
                            <div className="flex justify-between items-center mb-8 border-b-8 border-zinc-950 pb-8">
                                <div className="text-5xl font-black uppercase w-2/5 break-words">{match.home}</div>
                                <div className="text-7xl font-black text-brand-500 text-center w-1/5">{match.sets_home}-{match.sets_away}</div>
                                <div className="text-5xl font-black uppercase w-2/5 text-right break-words">{match.away}</div>
                            </div>
                            <div className="flex justify-between items-center text-3xl font-bold font-sans">
                                <span className="bg-zinc-950 text-white px-4 py-2">{match.date}</span>
                                <span className="uppercase text-brand-500 underline decoration-4">PALLAVOLO</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Proposal3;
