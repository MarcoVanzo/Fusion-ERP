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
    else if (hash === '#spese') this.renderSpese();
    else if (hash === '#profilo') this.renderProfilo();
    else this.renderLogin(); // Default fallback
  }

  // Navigation Generator
  getBottomNav(activeHash) {
    const items = [
      { id: '#dashboard', icon: 'fa-home', text: 'Home' },
      { id: '#scouting', icon: 'fa-clipboard-list', text: 'Scouting', onclick: "alert('In sviluppo')" },
      { id: '#profilo', icon: 'fa-user-circle', text: 'Profilo' },
      { id: '#spese', icon: 'fa-receipt', text: 'Spese' }
    ];

    let navHtml = '<div class="bottom-nav-container"><nav class="bottom-nav">';
    items.forEach(i => {
      const activeClass = activeHash === i.id ? 'active' : '';
      const onClickAttr = i.onclick ? `onclick="${i.onclick}"` : '';
      navHtml += `
        <a href="${i.id}" class="nav-item ${activeClass}" ${onClickAttr}>
          <i class="fas ${i.icon}"></i>
          <span>${i.text}</span>
        </a>
      `;
    });
    navHtml += '</nav></div>';
    return navHtml;
  }

  // Login Screen View
  renderLogin() {
    this.container.innerHTML = `
      <div class="screen login-screen">
        <div class="login-header">
          <img src="../dummy_logo.png" alt="Logo" style="width: 80px; margin-bottom: 20px; border-radius: 16px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'">
          <h1 class="login-title">Fusion ERP</h1>
          <p class="login-subtitle">Accedi al tuo hub sportivo</p>
        </div>
        <div class="login-card">
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="email" class="input-field" placeholder="Inserisci la tua email" autocorrect="off" autocapitalize="none">
          </div>
          <div class="input-group">
            <label class="input-label">Password</label>
            <input type="password" id="password" class="input-field" placeholder="La tua password">
          </div>
          <button class="btn mt-20" id="login-btn">
            <i class="fas fa-sign-in-alt"></i> Accedi
          </button>
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
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso in corso...';

      try {
        const response = await fetch('../api/?module=auth&action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pass }),
        });

        const result = await response.json();

        if (response.ok && result?.data) {
          // Success: save user data for quick UI presentation.
          localStorage.setItem('erp_user', JSON.stringify(result.data));
          window.location.hash = '#dashboard';
        } else {
          alert(result.error || 'Credenziali non valide o errore del server.');
        }
      } catch (err) {
        alert('Errore di connessione al server.');
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Accedi';
      }
    });
  }

  // Dashboard View
  renderDashboard() {
    this.container.innerHTML = `
      <div class="screen dashboard-screen">
        <header class="app-header">
          <div class="app-title">Dashboard</div>
          <div class="header-icon"><i class="far fa-bell"></i></div>
        </header>

        <div class="p-20">
          <h2 id="dash-greeting" style="font-size: 28px; margin-bottom: 8px;">Benvenuto</h2>
          <p class="text-light" style="margin-bottom: 24px;">Qui appariranno i tuoi KPI e gli shortcut della giornata.</p>
          
          <div class="card" style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-chart-pie" style="font-size: 48px; color: var(--accent-light); margin-bottom: 16px;"></i>
            <h3 style="margin-bottom: 8px;">Nessun dato</h3>
            <p class="text-light" style="font-size: 14px;">I widget arriveranno presto.</p>
          </div>

          <button class="btn btn-secondary mt-20" id="logout-btn" style="color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> Disconnetti
          </button>
        </div>

        ${this.getBottomNav('#dashboard')}
      </div>
    `;

    // Populate user greeting
    const userStr = localStorage.getItem('erp_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        document.getElementById('dash-greeting').innerText = `Ciao, ${user.full_name || user.fullName || 'Utente'}!`;
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

  // Spese Foresteria View
  renderSpese() {
    const today = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div class="screen spese-screen">
        <header class="app-header">
          <div class="app-title">Nuova Spesa</div>
          <a href="#dashboard" class="header-icon"><i class="fas fa-times"></i></a>
        </header>

        <div class="p-20">
          <div class="card">
            <form id="expense-form" onsubmit="return false;">
              <div class="input-group">
                <label class="input-label">Descrizione *</label>
                <input type="text" id="exp-desc" class="input-field" placeholder="Es. Spesa Conad" required>
              </div>

              <div class="input-group">
                <label class="input-label">Importo (€) *</label>
                <input type="number" step="0.01" id="exp-amount" class="input-field" placeholder="Es. 45.50" required>
              </div>

              <div class="input-group">
                <label class="input-label">Data Spesa *</label>
                <input type="date" id="exp-date" class="input-field" value="${today}" required>
              </div>

              <div class="input-group">
                <label class="input-label">Categoria</label>
                <select id="exp-category" class="input-field">
                  <option value="Spesa Alimentare">Spesa Alimentare</option>
                  <option value="Pulizie">Pulizie</option>
                  <option value="Manutenzione">Manutenzione</option>
                  <option value="Utenze">Utenze</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              <div class="input-group">
                <label class="input-label">Note Opzionali</label>
                <textarea id="exp-notes" class="input-field" rows="3" placeholder="Aggiungi una nota..."></textarea>
              </div>

              <div class="input-group mt-20">
                <label class="input-label">Scontrino o Ricevuta</label>
                <label for="exp-receipt" class="file-upload-box">
                  <i class="fas fa-camera" style="font-size: 32px; color: var(--text-light); margin-bottom: 12px;"></i>
                  <span style="font-weight: 500;">Scatta o allega file</span>
                </label>
                <input type="file" id="exp-receipt" accept="image/*" capture="environment" style="display: none;">
                <p id="receipt-name" style="margin-top: 10px; font-size: 14px; color: var(--success); font-weight: 500; display: none;">
                  <i class="fas fa-check-circle"></i> <span></span>
                </p>
              </div>

              <button type="button" class="btn mt-20" id="submit-expense-btn">
                <i class="fas fa-paper-plane"></i> Invia Spesa
              </button>
            </form>
          </div>
        </div>

        ${this.getBottomNav('#spese')}
      </div>
    `;

    // File input listener to show file name
    document.getElementById('exp-receipt').addEventListener('change', (e) => {
      const file = e.target.files[0];
      const nameTag = document.getElementById('receipt-name');
      if (file) {
        nameTag.style.display = 'block';
        nameTag.querySelector('span').innerText = ' ' + file.name;
      } else {
        nameTag.style.display = 'none';
      }
    });

    // Submit Action
    document.getElementById('submit-expense-btn').addEventListener('click', async () => {
      const desc = document.getElementById('exp-desc').value.trim();
      const amount = document.getElementById('exp-amount').value;
      const date = document.getElementById('exp-date').value;
      const cat = document.getElementById('exp-category').value;
      const notes = document.getElementById('exp-notes').value.trim();
      const fileInput = document.getElementById('exp-receipt');

      if (!desc || !amount || !date) {
        alert("Compila tutti i campi obbligatori (*).");
        return;
      }

      const btn = document.getElementById('submit-expense-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio in corso...';

      try {
        const formData = new FormData();
        formData.append('description', desc);
        formData.append('amount', amount);
        formData.append('expense_date', date);
        formData.append('category', cat);
        formData.append('notes', notes);

        if (fileInput.files.length > 0) {
          formData.append('receipt', fileInput.files[0]);
        }

        const response = await fetch('../api/?module=societa&action=addExpense', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success !== false) {
          alert('Spesa salvata con successo!');
          window.location.hash = '#dashboard';
        } else {
          alert(result.error || 'Errore durante il salvataggio.');
        }
      } catch (err) {
        alert("Impossibile connettersi al Server.");
        console.error(err);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-paper-plane"></i> Invia Spesa';
        }
      }
    });
  }

  // Profilo View
  async renderProfilo() {
    this.container.innerHTML = `
      <div class="screen profilo-screen">
        <header class="app-header">
          <div class="app-title">Il mio Profilo</div>
          <div class="header-icon"><i class="fas fa-cog"></i></div>
        </header>

        <div class="p-20" id="profilo-content">
          <!-- Skeleton Loading State -->
          <div class="profile-card skeleton" style="height: 220px;"></div>
          
          <div class="card skeleton" style="height: 280px; margin-bottom: 24px;"></div>
          <div class="card skeleton" style="height: 300px;"></div>
        </div>

        ${this.getBottomNav('#profilo')}
      </div>
    `;

    try {
      const response = await fetch('../api/?module=athletes&action=myProfile');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const p = result.data;
        
        let dobStr = p.birth_date || 'Non disponibile';
        if (p.birth_date) {
            const d = new Date(p.birth_date);
            dobStr = d.toLocaleDateString('it-IT');
        }

        const renderDoc = (title, path, fieldName) => {
            if (!path) {
                return `<div style="padding: 12px 0; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
                          <span style="font-size: 14px; color: var(--text-dark);"><i class="fas fa-file-alt text-light" style="margin-right: 8px;"></i> ${title}</span>
                          <span style="font-size: 12px; font-weight: 600; color: var(--danger); background: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: 12px;">Mancante</span>
                        </div>`;
            }
            return `<div style="padding: 12px 0; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between;">
                      <span style="font-size: 14px; font-weight: 500; color: var(--text-dark);"><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> ${title}</span>
                      <a href="../api/?module=${p.api_module}&action=downloadDoc&id=${p.id}&field=${fieldName}" target="_blank" class="btn" style="padding: 6px 14px; font-size: 12px; height: auto; width: auto; background: var(--surface); color: var(--accent); border: 1.5px solid var(--accent); box-shadow: none;">Apri</a>
                    </div>`;
        };

        const renderStat = (label, value) => `
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
            <span class="text-light" style="font-size: 14px;">${label}</span>
            <span style="font-weight: 500; font-size: 14px;">${value || '-'}</span>
          </div>
        `;

        const html = `
          <div class="profile-card">
            <div class="profile-avatar-container">
              ${p.photo_path ? '<img src="../' + p.photo_path + '">' : '<i class="fas fa-user"></i>'}
            </div>
            <h2 style="margin: 0; color: #fff; font-size: 24px;">${p.first_name} ${p.last_name}</h2>
            <div style="color: rgba(255,255,255,0.9); margin-top: 8px; font-weight: 500; font-size: 15px;">
              ${p.role || 'Ruolo non specificato'} ${p.jersey_number ? ' • N. ' + p.jersey_number : ''}
            </div>
            <div style="font-size: 13px; opacity: 0.8; margin-top: 6px; background: rgba(0,0,0,0.2); display: inline-block; padding: 4px 12px; border-radius: 20px;">
              ${p.team_name}
            </div>
          </div>

          <div class="card" style="padding: 20px;">
            <h3 style="margin-bottom: 16px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-id-card text-light"></i> Dati Anagrafici
            </h3>
            <div style="display: flex; flex-direction: column;">
              ${renderStat('Data di Nascita', dobStr)}
              ${renderStat('Luogo di Nascita', p.birth_place)}
              ${renderStat('Codice Fiscale', p.fiscal_code)}
              ${renderStat('Altezza', p.height_cm ? p.height_cm + ' cm' : '')}
              ${renderStat('Telefono', p.phone)}
              ${renderStat('Email', p.email)}
            </div>
          </div>

          <div class="card" style="padding: 20px; margin-bottom: 0;">
            <h3 style="margin-bottom: 8px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-folder-open text-light"></i> Documenti
            </h3>
            <p class="text-light" style="font-size: 13px; margin-bottom: 16px;">I tuoi allegati medici e legali.</p>
            <div style="display: flex; flex-direction: column;">
              ${renderDoc("Carta d'Identità (Fronte)", p.id_doc_front_file_path, 'id_doc_front_file_path')}
              ${renderDoc("Carta d'Identità (Retro)", p.id_doc_back_file_path, 'id_doc_back_file_path')}
              ${renderDoc('Codice Fiscale (Fronte)', p.cf_doc_front_file_path, 'cf_doc_front_file_path')}
              ${renderDoc('Codice Fiscale (Retro)', p.cf_doc_back_file_path, 'cf_doc_back_file_path')}
              ${renderDoc('Certificato Medico', p.medical_cert_file_path, 'medical_cert_file_path')}
              ${renderDoc('Contratto/Tesseramento', p.contract_file_path, 'contract_file_path')}
            </div>
          </div>
        `;
        document.getElementById('profilo-content').innerHTML = html;
      } else {
        document.getElementById('profilo-content').innerHTML = `
          <div class="card" style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: var(--danger); margin-bottom: 16px;"></i>
            <h3>Errore</h3>
            <p class="text-light">${result.error || 'Profilo atleta non trovato.'}</p>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('profilo-content').innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
          <i class="fas fa-wifi" style="font-size: 40px; color: var(--warning); margin-bottom: 16px;"></i>
          <h3>Connessione assente</h3>
          <p class="text-light">Impossibile caricare i dati dal server.</p>
        </div>
      `;
    }
  }
}

// Boot App
const app = new App();
