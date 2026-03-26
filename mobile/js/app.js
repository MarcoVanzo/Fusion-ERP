class App {
  constructor() {
    this.container = document.getElementById('app-container');
    this.initPWA();
    this.route();
    
    // Listen for hash changes to navigate
    window.addEventListener('hashchange', () => this.route());
  }

  // Register Service Worker
  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(registration => console.log('ServiceWorker registered:', registration.scope))
          .catch(error => console.log('ServiceWorker registration failed:', error));
      });
    }
  }

  // Simple Hash Router
  route() {
    const hash = window.location.hash || '#login';
    
    // Check auth (User data in localStorage)
    const activeUser = localStorage.getItem('erp_user');
    
    if (!activeUser && hash !== '#login') {
      window.location.hash = '#login';
      return;
    }

    if (activeUser && hash === '#login') {
      window.location.hash = '#dashboard';
      return;
    }

    if (hash === '#login') this.renderLogin();
    else if (hash === '#dashboard') this.renderDashboard();
    else this.renderLogin(); // Default fallback
  }

  // Login Screen View
  renderLogin() {
    this.container.innerHTML = `
      <div class="screen login-screen" style="background-color: var(--surface)">
        <div class="login-header">
          <h1 class="login-title">Fusion ERP</h1>
        </div>
        <div class="login-card">
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="email" class="input-field" placeholder="Inserisci email" autocorrect="off" autocapitalize="none">
          </div>
          <div class="input-group">
            <label class="input-label">Password</label>
            <input type="password" id="password" class="input-field" placeholder="Inserisci password">
          </div>
          <button class="btn mt-20" id="login-btn">Accedi</button>
        </div>
      </div>
    `;

    document.getElementById('login-btn').addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const pass = document.getElementById('password').value;
      const btn = document.getElementById('login-btn');

      if (!email || !pass) {
        alert('Inserisci le credenziali.');
        return;
      }

      btn.disabled = true;
      btn.innerText = 'Accesso in corso...';

      try {
        const response = await fetch('../api/?module=auth&action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pass }),
        });

        const result = await response.json();

        if (response.ok && result?.data) {
          // Success: The backend handles the session cookie automatically.
          // Save user data for quick UI presentation.
          localStorage.setItem('erp_user', JSON.stringify(result.data));
          window.location.hash = '#dashboard';
        } else {
          // Error handling
          alert(result.error || 'Credenziali non valide o errore del server.');
        }
      } catch (err) {
        alert('Errore di connessione al server.');
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Accedi';
      }
    });
  }

  // Dashboard View
  renderDashboard() {
    this.container.innerHTML = `
      <div class="screen dashboard-screen">
        <header class="app-header">
          <div class="app-title">Dashboard</div>
          <i class="fas fa-bell"></i>
        </header>

        <div class="p-20">
          <h2 id="dash-greeting">Benvenuto</h2>
          <p class="text-light mt-20">Qui appariranno i tuoi KPI e gli shortcut della giornata.</p>
          
          <button class="btn mt-20" id="logout-btn" style="background-color: var(--danger);">Esci</button>
        </div>

        <nav class="bottom-nav">
          <a href="#dashboard" class="nav-item active">
            <i class="fas fa-home"></i>
            <span>Home</span>
          </a>
          <a href="#scouting" class="nav-item" onclick="alert('In sviluppo')">
            <i class="fas fa-clipboard-list"></i>
            <span>Scouting</span>
          </a>
          <a href="#atleti" class="nav-item" onclick="alert('In sviluppo')">
            <i class="fas fa-users"></i>
            <span>Atleti</span>
          </a>
          <a href="#spese" class="nav-item" onclick="alert('In sviluppo')">
            <i class="fas fa-receipt"></i>
            <span>Spese</span>
          </a>
        </nav>
      </div>
    `;

    // Populate user greeting
    const userStr = localStorage.getItem('erp_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        document.getElementById('dash-greeting').innerText = `Ciao, ${user.full_name || user.fullName}!`;
      } catch(e) {}
    }

    // Attach Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        await fetch('../api/?module=auth&action=logout', { method: 'POST' });
      } catch(e) {}
      localStorage.removeItem('erp_user');
      window.location.hash = '#login';
    });
  }
}

// Boot App
const app = new App();
