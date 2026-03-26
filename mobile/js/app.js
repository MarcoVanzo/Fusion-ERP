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
          <a href="#profilo" class="nav-item">
            <i class="fas fa-user-circle"></i>
            <span>Profilo</span>
          </a>
          <a href="#spese" class="nav-item">
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

  // Spese Foresteria View
  renderSpese() {
    // Basic date formatter for today (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div class="screen spese-screen">
        <header class="app-header">
          <div class="app-title">Nuova Spesa Foresteria</div>
          <a href="#dashboard" style="color: white; font-size: 20px;"><i class="fas fa-times"></i></a>
        </header>

        <div class="p-20" style="padding-bottom: 90px; overflow-y: auto;">
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
              <label class="input-label">Foto Scontrino / Ricevuta</label>
              <label for="exp-receipt" class="btn" style="background-color: var(--secondary); color: var(--text-dark); border: 2px dashed var(--border); display: block;">
                <i class="fas fa-camera" style="font-size: 24px; margin-bottom: 8px;"></i><br>
                <span>Scatta o seleziona foto</span>
              </label>
              <input type="file" id="exp-receipt" accept="image/*" capture="environment" style="display: none;">
              <p id="receipt-name" style="margin-top: 8px; font-size: 14px; color: var(--success);"></p>
            </div>

            <button type="button" class="btn mt-20" id="submit-expense-btn">
              <i class="fas fa-save" style="margin-right: 8px;"></i> Salva Spesa
            </button>
          </form>
        </div>

        <nav class="bottom-nav">
          <a href="#dashboard" class="nav-item">
            <i class="fas fa-home"></i>
            <span>Home</span>
          </a>
          <a href="#scouting" class="nav-item" onclick="alert('In sviluppo')">
            <i class="fas fa-clipboard-list"></i>
            <span>Scouting</span>
          </a>
          <a href="#profilo" class="nav-item">
            <i class="fas fa-user-circle"></i>
            <span>Profilo</span>
          </a>
          <a href="#spese" class="nav-item active">
            <i class="fas fa-receipt"></i>
            <span>Spese</span>
          </a>
        </nav>
      </div>
    `;

    // File input listener to show file name
    document.getElementById('exp-receipt').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) document.getElementById('receipt-name').innerText = 'Foto allegata: ' + file.name;
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
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';

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
          body: formData, // fetch sets boundary automatically for multipart/form-data
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
          btn.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i> Salva Spesa';
        }
      }
    });
  }

  // Profilo View
  async renderProfilo() {
    this.container.innerHTML = `
      <div class="screen profilo-screen">
        <header class="app-header">
          <div class="app-title">Profilo Atleta</div>
        </header>

        <div class="p-20" id="profilo-content" style="padding-bottom: 90px; overflow-y: auto;">
          <div style="text-align: center; margin-top: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
            <p class="mt-10">Caricamento profilo...</p>
          </div>
        </div>

        <nav class="bottom-nav">
          <a href="#dashboard" class="nav-item">
            <i class="fas fa-home"></i>
            <span>Home</span>
          </a>
          <a href="#scouting" class="nav-item" onclick="alert('In sviluppo')">
            <i class="fas fa-clipboard-list"></i>
            <span>Scouting</span>
          </a>
          <a href="#profilo" class="nav-item active">
            <i class="fas fa-user-circle"></i>
            <span>Profilo</span>
          </a>
          <a href="#spese" class="nav-item">
            <i class="fas fa-receipt"></i>
            <span>Spese</span>
          </a>
        </nav>
      </div>
    `;

    try {
      const response = await fetch('../api/?module=athletes&action=myProfile');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const p = result.data;
        
        // Formatta la data di nascita
        let dobStr = p.birth_date || 'Non disponibile';
        if (p.birth_date) {
            const d = new Date(p.birth_date);
            dobStr = d.toLocaleDateString('it-IT');
        }

        // Funzione helper per documenti
        const renderDoc = (title, path, fieldName) => {
            if (!path) {
                return `<div class="doc-item" style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                          <span><i class="fas fa-file-alt" style="color: #666; margin-right: 8px;"></i> ${title}</span>
                          <span style="font-size: 12px; color: #f87171;">Mancante</span>
                        </div>`;
            }
            return `<div class="doc-item" style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                      <span><i class="fas fa-check-circle" style="color: #10b981; margin-right: 8px;"></i> ${title}</span>
                      <a href="../api/?module=${p.api_module}&action=downloadDoc&id=${p.id}&field=${fieldName}" target="_blank" class="btn" style="padding: 6px 12px; font-size: 12px; height: auto;">Apri</a>
                    </div>`;
        };

        const html = `
          <div style="background: var(--surface); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: var(--secondary); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #fff; overflow: hidden;">
              ${p.photo_path ? '<img src="../' + p.photo_path + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">' : '<i class="fas fa-user"></i>'}
            </div>
            <h2 style="margin: 0; color: #fff; font-size: 22px;">${p.first_name} ${p.last_name}</h2>
            <div style="color: var(--secondary); margin-top: 5px; font-weight: 600;">${p.role || 'Ruolo non specificato'} ${p.jersey_number ? '- Num. ' + p.jersey_number : ''}</div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">${p.team_name}</div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px; font-size: 16px; color: var(--secondary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Scheda Anagrafica</h3>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 12px; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="opacity:0.7">Data Nascita</span><span>${dobStr}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="opacity:0.7">Luogo Nascita</span><span>${p.birth_place || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="opacity:0.7">Codice Fiscale</span><span>${p.fiscal_code || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="opacity:0.7">Indirizzo</span><span>${p.residence_address || '-'}, ${p.residence_city || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="opacity:0.7">Telefono</span><span>${p.phone || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="opacity:0.7">Email</span><span>${p.email || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-bottom: 4px;">
                    <span style="opacity:0.7">Dati Fisici</span><span>${p.height_cm ? p.height_cm+'cm' : '-'} / ${p.weight_kg ? p.weight_kg+'kg' : '-'}</span>
                </div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px; font-size: 16px; color: var(--secondary); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Documenti Allegati</h3>
            ${renderDoc("Carta d'Identità (Fronte)", p.id_doc_front_file_path, 'id_doc_front_file_path')}
            ${renderDoc("Carta d'Identità (Retro)", p.id_doc_back_file_path, 'id_doc_back_file_path')}
            ${renderDoc('Codice Fiscale (Fronte)', p.cf_doc_front_file_path, 'cf_doc_front_file_path')}
            ${renderDoc('Codice Fiscale (Retro)', p.cf_doc_back_file_path, 'cf_doc_back_file_path')}
            ${renderDoc('Certificato Medico', p.medical_cert_file_path, 'medical_cert_file_path')}
            ${renderDoc('Contratto / Tesseramento', p.contract_file_path, 'contract_file_path')}
          </div>
        `;
        document.getElementById('profilo-content').innerHTML = html;
      } else {
        document.getElementById('profilo-content').innerHTML = `
          <div style="text-align: center; margin-top: 40px; color: #f87171;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>${result.error || 'Profilo atleta non trovato.'}</p>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('profilo-content').innerHTML = `
        <div style="text-align: center; margin-top: 40px; color: #f87171;">
          <i class="fas fa-wifi" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>Errore di connessione.</p>
        </div>
      `;
    }
  }
}

// Boot App
const app = new App();
