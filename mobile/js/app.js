class App {
  constructor() {
    this.container = document.getElementById('app-container');
    this.addGlobalOrbs();
    this.initPWA();
    this.route();
    
    // Listen for hash changes to navigate
    window.addEventListener('hashchange', () => {
      this.vibrate(50);
      this.route();
    });
  }

  // Haptic feedback helper
  vibrate(ms = 50) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  // Global Background Orbs
  addGlobalOrbs() {
    if (!document.getElementById('global-orbs')) {
      const orbsContainer = document.createElement('div');
      orbsContainer.id = 'global-orbs';
      orbsContainer.className = 'global-bg-container';
      orbsContainer.innerHTML = `
        <div class="auth-bg-orb orb-1"></div>
        <div class="auth-bg-orb orb-2"></div>
      `;
      document.body.insertBefore(orbsContainer, document.body.firstChild);
    }
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
    else this.renderLogin();
  }

  getBottomNav(activeHash) {
    const items = [
      { id: '#dashboard', icon: 'fa-home', text: 'Home' },
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
        
        <div class="login-header stagger-item delay-1">
          <img src="../uploads/images/Logo%20Colorato.png" alt="Fusion Logo" style="width: 90px; margin-bottom: 24px;">
          <h1 class="login-title">GET GAME<br><span>READY</span></h1>
          <p class="login-subtitle">Gestione atleti e trasporti</p>
        </div>
        <div class="login-card stagger-item delay-2">
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="email" class="input-field" placeholder="nome@fusionteamvolley.it" autocorrect="off" autocapitalize="none">
          </div>
          <div class="input-group">
            <label class="input-label">Password</label>
            <input type="password" id="password" class="input-field" placeholder="Inserisci la password">
          </div>
          <button class="btn mt-20" id="login-btn">
            ACCEDI <i class="fas fa-chevron-right" style="font-size: 14px;"></i>
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
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CARICAMENTO...';

      try {
        const response = await fetch('../api/?module=auth&action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pass }),
        });

        const result = await response.json();

        if (response.ok && result?.data) {
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
        btn.innerHTML = 'ACCEDI <i class="fas fa-chevron-right" style="font-size: 14px;"></i>';
      }
    });
  }

  // Dashboard View
  renderDashboard() {
    this.container.innerHTML = `
      <div class="screen dashboard-screen">
        <header class="app-header">
          <div class="app-title">Fusion ERP</div>
          <div class="header-icon"><i class="far fa-bell"></i></div>
        </header>

        <div class="p-20">
          <h2 id="dash-greeting" class="stagger-item delay-1" style="font-size: 24px; margin-bottom: 8px;">Bentornato</h2>
          <p class="text-light stagger-item delay-1" style="margin-bottom: 24px; font-size: 14px;">Il tuo hub sportivo personale.</p>
          
          <!-- Call to Action Spese -->
          <div class="card stagger-item delay-2" style="text-align: center; border: 2px dashed var(--accent-secondary); cursor: pointer; background: rgba(255,0,122,0.02); transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;" onclick="window.location.hash='#spese'" id="cta-add-spesa">
            <i class="fas fa-plus-circle" style="font-size: 36px; color: var(--accent-secondary); margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,0,122,0.5));"></i>
            <h3 style="color: var(--text-primary); font-size: 18px; margin-bottom: 4px;">AGGIUNGI SPESA</h3>
            <p class="text-muted" style="font-size: 13px;">Carica scontrino e importo al volo</p>
          </div>

          <div class="card stagger-item delay-3" style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-chart-line" style="font-size: 40px; color: var(--accent-primary); margin-bottom: 16px; opacity: 0.8;"></i>
            <h3 style="margin-bottom: 8px;">Statistiche</h3>
            <p class="text-muted" style="font-size: 14px;">I widget KPI arriveranno post lancio.</p>
          </div>

          <button class="btn btn-secondary mt-20 stagger-item delay-4" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i> DISCONNETTI
          </button>
        </div>

        ${this.getBottomNav('#dashboard')}
      </div>
    `;

    document.getElementById('cta-add-spesa').addEventListener('touchstart', function() { this.style.transform = 'scale(0.98)'; });
    document.getElementById('cta-add-spesa').addEventListener('touchend', function() { this.style.transform = 'scale(1)'; });

    const userStr = localStorage.getItem('erp_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        document.getElementById('dash-greeting').innerText = `Ciao, ${user.full_name || user.fullName || 'Utente'}`;
      } catch(e) {}
    }

    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        await fetch('../api/?module=auth&action=logout', { method: 'POST' });
      } catch(e) {}
      localStorage.removeItem('erp_user');
      window.location.hash = '#login';
    });
  }

  // Spese Foresteria View (Two-Step Wizard)
  renderSpese() {
    const today = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div class="screen spese-screen">
        <header class="app-header">
          <div class="app-title">Nuova Spesa</div>
          <a href="#dashboard" class="header-icon" style="color:var(--text-primary)"><i class="fas fa-times"></i></a>
        </header>

        <div class="p-20">
          <div class="card stagger-item delay-1" style="padding-top: 30px;">
            <form id="expense-form" onsubmit="return false;">
              
              <!-- STEP 1: IMPORTANTI (Foto + Importo) -->
              <div id="step-1">
                <div class="input-group stagger-item delay-2">
                  <label for="exp-receipt" class="file-upload-box giant-camera-box">
                    <i class="fas fa-camera"></i>
                    <span>Fotografa Scontrino</span>
                  </label>
                  <input type="file" id="exp-receipt" accept="image/*" capture="environment" style="display: none;">
                  <div id="receipt-preview-container" class="mt-10" style="display: none; text-align: center;">
                     <p id="receipt-name" class="text-light" style="font-size: 13px; font-weight: 500; margin-bottom: 8px;">
                       <i class="fas fa-check-circle" style="color: var(--success)"></i> <span class="filename"></span>
                     </p>
                     <img id="receipt-img-preview" src="" style="max-height: 120px; border-radius: 8px; border: 1px solid var(--border-subtle); margin: 0 auto; display: block;" />
                  </div>
                </div>

                <div class="huge-amount-wrapper">
                  <label class="input-label" style="margin-bottom: -5px;">Importo Totale (€) *</label>
                  <input type="number" step="0.01" id="exp-amount" class="huge-amount-input" placeholder="0.00" required>
                </div>

                <button type="button" class="btn mt-20" id="btn-next-step">
                  AVANTI <i class="fas fa-arrow-right"></i>
                </button>
              </div>

              <!-- STEP 2: DETTAGLI -->
              <div id="step-2" class="d-none">
                <button type="button" class="btn btn-secondary mb-20" id="btn-prev-step" style="width: auto; padding: 10px 16px;">
                  <i class="fas fa-arrow-left"></i> Indietro
                </button>
                
                <h3 style="margin-bottom: 20px; font-size: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">Dettagli Spesa</h3>

                <div class="input-group">
                  <label class="input-label">Descrizione *</label>
                  <input type="text" id="exp-desc" class="input-field" placeholder="Es. Spesa Alimentare Conad" value="Spesa Generale" required>
                </div>

                <div class="input-group">
                  <label class="input-label">Categoria</label>
                  <select id="exp-category" class="input-field">
                    <option value="Spesa Alimentare" selected>Spesa Alimentare</option>
                    <option value="Pulizie">Pulizie</option>
                    <option value="Manutenzione">Manutenzione</option>
                    <option value="Utenze">Utenze</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>

                <div class="input-group">
                  <label class="input-label">Data *</label>
                  <input type="date" id="exp-date" class="input-field" value="${today}" required>
                </div>

                <div class="input-group">
                  <label class="input-label">Note</label>
                  <textarea id="exp-notes" class="input-field" rows="2" placeholder="Opzionale..."></textarea>
                </div>

                <button type="button" class="btn mt-20" id="submit-expense-btn">
                  <i class="fas fa-paper-plane"></i> SALVA SPESA
                </button>
              </div>

            </form>
          </div>
        </div>

        ${this.getBottomNav('#spese')}
      </div>
    `;

    // Step 1 <-> Step 2 Logic
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    document.getElementById('btn-next-step').addEventListener('click', () => {
      this.vibrate(20);
      const amt = document.getElementById('exp-amount').value;
      if (!amt || parseFloat(amt) <= 0) {
        alert("Inserisci un importo valido prima di proseguire.");
        document.getElementById('exp-amount').focus();
        return;
      }
      step1.classList.add('d-none');
      step2.classList.remove('d-none');
      // smooth scroll up
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-prev-step').addEventListener('click', () => {
      step2.classList.add('d-none');
      step1.classList.remove('d-none');
    });

    // File input listener with preview
    document.getElementById('exp-receipt').addEventListener('change', (e) => {
      const file = e.target.files[0];
      const previewContainer = document.getElementById('receipt-preview-container');
      const nameSpan = previewContainer.querySelector('.filename');
      const imgPreview = document.getElementById('receipt-img-preview');
      
      if (file) {
        previewContainer.style.display = 'block';
        nameSpan.innerText = file.name;
        
        // Show lightweight thumbnail
        const reader = new FileReader();
        reader.onload = function(ev) {
          imgPreview.src = ev.target.result;
        };
        reader.readAsDataURL(file);

        // Hide the giant text partially to save space, or just keep it
        document.querySelector('.giant-camera-box span').innerText = 'Cambia Foto';
      } else {
        previewContainer.style.display = 'none';
        imgPreview.src = '';
        document.querySelector('.giant-camera-box span').innerText = 'Fotografa Scontrino';
      }
    });

    // Final Submit Action
    document.getElementById('submit-expense-btn').addEventListener('click', async () => {
      this.vibrate(50);
      const desc = document.getElementById('exp-desc').value.trim();
      const amount = document.getElementById('exp-amount').value;
      const date = document.getElementById('exp-date').value;
      const cat = document.getElementById('exp-category').value;
      const notes = document.getElementById('exp-notes').value.trim();
      const fileInput = document.getElementById('exp-receipt');

      if (!desc || !amount || !date) {
        alert("Completa i campi obbligatori.");
        return;
      }

      const btn = document.getElementById('submit-expense-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> INVIO IN CORSO...';

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
          alert('Spesa salvata correttamente!');
          window.location.hash = '#dashboard';
        } else {
          alert(result.error || 'Errore durante il salvataggio.');
        }
      } catch (err) {
        alert("Impossibile connettersi al API Server.");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-paper-plane"></i> SALVA SPESA';
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
          <div class="card skeleton" style="height: 180px; margin-bottom: 24px; border:none;"></div>
          <div class="card skeleton" style="height: 280px; margin-bottom: 24px; border:none;"></div>
          <div class="card skeleton" style="height: 300px; border:none;"></div>
        </div>

        ${this.getBottomNav('#profilo')}
      </div>
    `;

    try {
      const response = await fetch('../api/?module=athletes&action=myProfile');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const p = result.data;
        
        let dobStr = p.birth_date || 'N/D';
        if (p.birth_date) {
            const d = new Date(p.birth_date);
            dobStr = d.toLocaleDateString('it-IT');
        }

        const renderDoc = (title, path, fieldName) => {
            if (!path) {
                return `<div style="padding: 12px 0; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
                          <span style="font-size: 14px; color: var(--text-primary);"><i class="fas fa-file-alt text-muted" style="margin-right: 8px;"></i> ${title}</span>
                          <span style="font-size: 11px; font-weight: 600; color: var(--danger); background: rgba(255, 77, 77, 0.1); padding: 4px 8px; border-radius: 12px; border: 1px solid rgba(255, 77, 77, 0.3);">MANCANTE</span>
                        </div>`;
            }
            return `<div style="padding: 12px 0; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
                      <span style="font-size: 14px; color: var(--text-primary);"><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> ${title}</span>
                      <a href="../api/?module=${p.api_module}&action=downloadDoc&id=${p.id}&field=${fieldName}" target="_blank" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; height: auto; width: auto;">APRI</a>
                    </div>`;
        };

        const renderStat = (label, value) => `
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-subtle);">
            <span class="text-light" style="font-size: 13px; text-transform: uppercase;">${label}</span>
            <span style="font-weight: 500; font-size: 14px;">${value || '-'}</span>
          </div>
        `;

        const html = `
          <div class="card stagger-item delay-1" style="text-align: center; border-top: 3px solid var(--accent-secondary);">
            <div class="profile-avatar-container">
              ${p.photo_path ? '<img src="../' + p.photo_path + '">' : '<i class="fas fa-user"></i>'}
            </div>
            <h2 style="margin: 0; font-size: 22px;">${p.first_name} ${p.last_name}</h2>
            <div style="color: var(--accent-secondary); margin-top: 4px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
              ${p.role ? p.role.toUpperCase() : 'RUOLO NON SPECIFICATO'} ${p.jersey_number ? ' • N. ' + p.jersey_number : ''}
            </div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px; font-family: 'Syne', sans-serif;">
              ${p.team_name}
            </div>
          </div>

          <div class="card stagger-item delay-2">
            <h3 style="margin-bottom: 16px; font-size: 15px; display: flex; align-items: center; gap: 8px; color: var(--accent-primary);">
              <i class="fas fa-id-card"></i> DATI ANAGRAFICI
            </h3>
            <div style="display: flex; flex-direction: column;">
              ${renderStat('Nata/o il', dobStr)}
              ${renderStat('Luogo', p.birth_place)}
              ${renderStat('Codice Fiscale', p.fiscal_code)}
              ${renderStat('Altezza', p.height_cm ? p.height_cm + ' cm' : '')}
              ${renderStat('Telefono', p.phone)}
              ${renderStat('Mail', p.email)}
            </div>
          </div>

          <div class="card stagger-item delay-3" style="margin-bottom: 0;">
            <h3 style="margin-bottom: 16px; font-size: 15px; display: flex; align-items: center; gap: 8px; color: var(--accent-primary);">
              <i class="fas fa-folder-open"></i> GESTIONE DOCUMENTI
            </h3>
            <div style="display: flex; flex-direction: column;">
              ${renderDoc("Carta d'Identità (FR)", p.id_doc_front_file_path, 'id_doc_front_file_path')}
              ${renderDoc("Carta d'Identità (RE)", p.id_doc_back_file_path, 'id_doc_back_file_path')}
              ${renderDoc('Codice Fiscale (FR)', p.cf_doc_front_file_path, 'cf_doc_front_file_path')}
              ${renderDoc('Codice Fiscale (RE)', p.cf_doc_back_file_path, 'cf_doc_back_file_path')}
              ${renderDoc('Certificato Medico', p.medical_cert_file_path, 'medical_cert_file_path')}
              ${renderDoc('Documento Tesseramento', p.contract_file_path, 'contract_file_path')}
            </div>
          </div>
        `;
        document.getElementById('profilo-content').innerHTML = html;
      } else {
        document.getElementById('profilo-content').innerHTML = `
          <div class="card" style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: var(--danger); margin-bottom: 16px;"></i>
            <h3>Errore</h3>
            <p class="text-light">${result.error || 'Nessun profilo trovato.'}</p>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('profilo-content').innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
          <i class="fas fa-wifi" style="font-size: 40px; color: var(--warning); margin-bottom: 16px;"></i>
          <h3>Offline</h3>
          <p class="text-light">Dominio non raggiungibile.</p>
        </div>
      `;
    }
  }
}

const app = new App();
