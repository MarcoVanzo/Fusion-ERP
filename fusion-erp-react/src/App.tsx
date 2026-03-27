import { useState, useEffect } from 'react';
import './App.css';

// Dichiariamo l'interfaccia dell'oggetto globale AthletesAPI che abbiamo aggiunto in index.html
declare global {
  interface Window {
    AthletesAPI: {
      getLightList: () => Promise<any[]>;
      getById: (id: string) => Promise<any>;
    };
  }
}

function App() {
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<any[]>([]);

  useEffect(() => {
    // Simuliamo fetch dati usando il nuovo Wrapper SDK esportato nella legacy app!
    const fetchAthletes = async () => {
      try {
        if (window.AthletesAPI) {
          const data = await window.AthletesAPI.getLightList();
          setAthletes(data || []);
        } else {
          console.warn("AthletesAPI non trovata. Esegui il build e inietta in index.html (ERP)");
          // Fallback mockup
          setAthletes([{ id: '1', full_name: 'Mock Atleta', category: 'U14' }]);
        }
      } catch (err) {
        console.error("Errore getLightList", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit', color: 'white' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>
          Dashboard <span style={{ color: '#FF00FF' }}>Atleti (React)</span>
        </h1>
        <p style={{ opacity: 0.7 }}>Proof of concept ibrido. Fetch tramite SDK Vanilla.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Caricamento...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          {athletes.map((ath) => (
            <div key={ath.id} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                {ath.full_name || ath.name}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {ath.category || ath.teams?.[0]?.category || 'Nessuna squadra'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
