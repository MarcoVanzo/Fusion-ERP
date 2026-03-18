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
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
