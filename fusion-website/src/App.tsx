import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CookieBanner } from './components/CookieBanner';
import { trackPageView } from './utils/analytics';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loading components
const Home = React.lazy(() => import('./pages/Home'));
const Club = React.lazy(() => import('./pages/Club'));
const Roster = React.lazy(() => import('./pages/Roster'));
const News = React.lazy(() => import('./pages/News'));
const TeamDetail = React.lazy(() => import('./pages/TeamDetail'));
const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'));
const CandidaturaScouting = React.lazy(() => import('./pages/CandidaturaScouting'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Results = React.lazy(() => import('./pages/Results'));
const Outseason = React.lazy(() => import('./pages/Outseason'));
const Foresteria = React.lazy(() => import('./pages/Foresteria'));
const Network = React.lazy(() => import('./pages/Network'));
const Sponsors = React.lazy(() => import('./pages/Sponsors'));
const Proposal1 = React.lazy(() => import('./pages/Proposal1'));
const Proposal2 = React.lazy(() => import('./pages/Proposal2'));
const Proposal3 = React.lazy(() => import('./pages/Proposal3'));
const MenuProposal1 = React.lazy(() => import('./pages/MenuProposal1'));
const MenuProposal2 = React.lazy(() => import('./pages/MenuProposal2'));
const MenuProposal3 = React.lazy(() => import('./pages/MenuProposal3'));
const MenuProposal4 = React.lazy(() => import('./pages/MenuProposal4'));
const MenuProposal5 = React.lazy(() => import('./pages/MenuProposal5'));

// Fallback loader
const PageLoader = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-rose-600/20 border-t-rose-600 rounded-full animate-spin"></div>
    <span className="mt-4 text-zinc-400 font-syncopate uppercase tracking-wider text-sm">Caricamento...</span>
  </div>
);

function AppContent() {
  const location = useLocation();
  const isProposal = location.pathname.startsWith('/proposal') || location.pathname.startsWith('/menu');

  // Tracciamento Page View Virtuale
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isProposal && <Navbar />}
      <main className={`flex-grow ${!isProposal ? 'pt-16 lg:pt-24' : ''} bg-zinc-950`}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/club" element={<Club />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<ArticleDetail />} />
              <Route path="/teams" element={<Roster />} />
              <Route path="/teams/:slug" element={<TeamDetail />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/results" element={<Results />} />
              <Route path="/outseason" element={<Outseason />} />
              <Route path="/foresteria" element={<Foresteria />} />
              <Route path="/network" element={<Network />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/candidatura-scouting" element={<CandidaturaScouting />} />
              <Route path="/proposal1" element={<Proposal1 />} />
              <Route path="/proposal2" element={<Proposal2 />} />
              <Route path="/proposal3" element={<Proposal3 />} />
              <Route path="/menu1" element={<MenuProposal1 />} />
              <Route path="/menu2" element={<MenuProposal2 />} />
              <Route path="/menu3" element={<MenuProposal3 />} />
              <Route path="/menu4" element={<MenuProposal4 />} />
              <Route path="/menu5" element={<MenuProposal5 />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
        {!isProposal && <Footer />}
        <CookieBanner />
      </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
