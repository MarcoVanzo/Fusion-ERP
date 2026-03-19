import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter basename="/demo">
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 lg:pt-24 bg-zinc-950">
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
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
