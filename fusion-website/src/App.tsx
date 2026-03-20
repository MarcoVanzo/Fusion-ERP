import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Club from './pages/Club';
import Roster from './pages/Roster';
import News from './pages/News';
import TeamDetail from './pages/TeamDetail';
import ArticleDetail from './pages/ArticleDetail';
import Shop from './pages/Shop';
import Results from './pages/Results';
import Outseason from './pages/Outseason';
import Foresteria from './pages/Foresteria';
import Network from './pages/Network';
import Proposal1 from './pages/Proposal1';
import Proposal2 from './pages/Proposal2';
import Proposal3 from './pages/Proposal3';
import MenuProposal1 from './pages/MenuProposal1';
import MenuProposal2 from './pages/MenuProposal2';
import MenuProposal3 from './pages/MenuProposal3';
import MenuProposal4 from './pages/MenuProposal4';
import MenuProposal5 from './pages/MenuProposal5';

function AppContent() {
  const location = useLocation();
  const isProposal = location.pathname.startsWith('/proposal') || location.pathname.startsWith('/menu');

  return (
    <div className="flex flex-col min-h-screen">
      {!isProposal && <Navbar />}
      <main className={`flex-grow ${!isProposal ? 'pt-16 lg:pt-24' : ''} bg-zinc-950`}>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/club" element={<Club />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<ArticleDetail />} />
            <Route path="/teams" element={<Roster />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/results" element={<Results />} />
            <Route path="/outseason" element={<Outseason />} />
            <Route path="/foresteria" element={<Foresteria />} />
            <Route path="/network" element={<Network />} />
            <Route path="/proposal1" element={<Proposal1 />} />
            <Route path="/proposal2" element={<Proposal2 />} />
            <Route path="/proposal3" element={<Proposal3 />} />
            <Route path="/menu1" element={<MenuProposal1 />} />
            <Route path="/menu2" element={<MenuProposal2 />} />
            <Route path="/menu3" element={<MenuProposal3 />} />
            <Route path="/menu4" element={<MenuProposal4 />} />
            <Route path="/menu5" element={<MenuProposal5 />} />
          </Routes>
        </main>
        {!isProposal && <Footer />}
      </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/demo">
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
