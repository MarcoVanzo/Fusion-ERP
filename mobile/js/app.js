class App {
  constructor() {
    this.intervals = []; // Registry for clearing timers
    
    // 1. First attach navigator listener so it catches any hash-redirects
    window.addEventListener('hashchange', () => {
      this.vibrate(50);
      this.route();
    });

    // 2. Initialize and route
    this.container = document.getElementById('app-container');
    this.addGlobalOrbs();
    this.initPWA();
    this.route();
  }

  // --- Lifecycle & Resource Management ---
  cleanup() {
    // Clear all registered intervals to prevent memory leaks (Rule user_global)
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  registerInterval(fn, ms) {
    const id = setInterval(fn, ms);
    this.intervals.push(id);
    return id;
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
    // Cleanup previous view state before rendering new one
    this.cleanup();
    
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
    else if (hash === '#alerts') this.renderAlerts(); // NEW VIEW
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
        <header class="app-header glass-header">
          <div class="app-title">Fusion ERP</div>
          <div class="header-icon" onclick="window.location.hash='#alerts'"><i class="far fa-bell"></i></div>
        </header>

        <div class="p-20">
          <h2 id="dash-greeting" class="stagger-item delay-1" style="font-size: 24px; margin-bottom: 8px;">Bentornato</h2>
          <p class="text-light stagger-item delay-1" style="margin-bottom: 24px; font-size: 14px;">Il tuo hub sportivo personale.</p>
          
          <!-- Call to Action Spese -->
          <div class="glass-card stagger-item delay-2" style="text-align: center; border: 2px dashed var(--accent-secondary); cursor: pointer; background: rgba(255,0,122,0.02); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);" onclick="window.location.hash='#spese'" id="cta-add-spesa">
            <i class="fas fa-plus-circle" style="font-size: 36px; color: var(--accent-secondary); margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,0,122,0.5));"></i>
            <h4 style="color: var(--text-primary); font-size: 16px; margin-bottom: 4px;">AGGIUNGI SPESA</h4>
            <p class="text-muted" style="font-size: 12px;">Carica scontrino e importo al volo</p>
          </div>

          <div class="glass-card stagger-item delay-3" style="text-align: center; padding: 30px 20px;">
            <i class="fas fa-chart-line" style="font-size: 32px; color: var(--accent-primary); margin-bottom: 16px; opacity: 0.8;"></i>
            <h4 style="margin-bottom: 8px;">Statistiche</h4>
            <p class="text-muted" style="font-size: 13px;">I widget KPI arriveranno post lancio.</p>
          </div>

          <button class="btn btn-secondary mt-20 stagger-item delay-4" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i> DISCONNETTI
          </button>
        </div>
      </div>

      ${this.getBottomNav('#dashboard')}
    `;

    document.getElementById('cta-add-spesa').addEventListener('touchstart', function() { this.style.transform = 'scale(0.98)'; });
    document.getElementById('cta-add-spesa').addEventListener('touchend', function() { this.style.transform = 'scale(1)'; });

    const userStr = localStorage.getItem('erp_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        document.getElementById('dash-greeting').innerText = `Ciao, ${user.full_name || user.fullName || 'Utente'}`;
        
        // Start Dashboard Pollers
        this.checkNotifications();
        this.registerInterval(() => this.checkNotifications(), 60000); // Check every minute
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

  async checkNotifications() {
    const userStr = localStorage.getItem('erp_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user || (user.role !== 'social media manager' && user.role !== 'operaio')) return;

    try {
      const res = await fetch(`../api/?module=athletes&action=alerts`);
      const data = await res.json();
      const bell = document.querySelector('.header-icon');
      if (!bell) return;

      if (data.success && data.data && data.data.length > 0) {
        bell.classList.add('has-alerts');
        bell.innerHTML = `<i class="fa-solid fa-bell"></i><span class="badge-dot pulse"></span>`;
      } else {
        bell.classList.remove('has-alerts');
        bell.innerHTML = `<i class="fa-regular fa-bell"></i>`;
      }
    } catch (e) { 
      console.error('Notification check failed', e); 
    }
  }

  // Spese Foresteria View (Tabs: Nuova Spesa + Storico)
  renderSpese() {
    const today = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div class="screen spese-screen">
        <header class="app-header glass-header">
          <div class="app-title">SPESE</div>
          <a href="#dashboard" class="header-icon" style="color:var(--text-primary)"><i class="fas fa-times"></i></a>
        </header>

        <div class="p-20">
          <!-- Tab Bar -->
          <div class="spese-tabs stagger-item delay-1">
            <button class="spese-tab-btn active" id="tab-nuova"><i class="fas fa-plus-circle" style="margin-right:5px;"></i> Nuova</button>
            <button class="spese-tab-btn" id="tab-storico"><i class="fas fa-history" style="margin-right:5px;"></i> Storico</button>
          </div>

          <!-- TAB CONTENT: Nuova Spesa -->
          <div id="tab-nuova-content">
            <div class="card stagger-item delay-2" style="padding-top: 30px;">
              <form id="expense-form" onsubmit="return false;">
                
                <!-- STEP 1: IMPORTANTI (Foto + Importo) -->
                <div id="step-1">
                  <div class="input-group">
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
                </div>

                <!-- STEP 2: DETTAGLI -->
                <div id="step-2" class="d-none">
                  <h3 style="margin-bottom: 20px; font-size: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">Dettagli Spesa</h3>

                  <div class="input-group">
                    <label class="input-label">Descrizione *</label>
                    <input type="text" id="exp-desc" class="input-field" placeholder="Es. Spesa Alimentare Conad" value="Spesa Generale" required>
                  </div>

                  <div class="input-group">
                    <label class="input-label">Categoria</label>
                    <select id="exp-category" class="input-field">
                      <option value="manutenzione">Manutenzione</option>
                      <option value="pulizie">Pulizie</option>
                      <option value="utenze">Utenze</option>
                      <option value="cibo" selected>Cibo/Spesa</option>
                      <option value="frutta_verdura">Frutta e Verdura</option>
                      <option value="abbigliamento">Abbigliamento</option>
                      <option value="affitto">Affitto</option>
                      <option value="altro">Altro</option>
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
                </div>
              </form>
            </div>
            <div class="wizard-padding"></div>
          </div>

          <!-- TAB CONTENT: Storico Spese -->
          <div id="tab-storico-content" class="d-none">
            <div id="expense-history-list">
              <div class="card skeleton" style="height: 60px; margin-bottom: 12px; border: none;"></div>
              <div class="card skeleton" style="height: 60px; margin-bottom: 12px; border: none;"></div>
              <div class="card skeleton" style="height: 60px; margin-bottom: 12px; border: none;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wizard Fixed Actions (OUTSIDE .screen to avoid transform stacking context) -->
      <div class="wizard-actions" id="step-1-actions">
        <button type="button" class="btn" id="btn-next-step" style="flex: 1;">
          AVANTI <i class="fas fa-arrow-right"></i>
        </button>
      </div>
      <div class="wizard-actions d-none" id="step-2-actions">
        <button type="button" class="btn btn-secondary" id="btn-prev-step" style="flex: 1;">
          INDIETRO
        </button>
        <button type="button" class="btn" id="submit-expense-btn" style="flex: 2;">
          SALVA SPESA
        </button>
      </div>

      ${this.getBottomNav('#spese')}
    `;

    // Tab switching logic
    const tabNuova = document.getElementById('tab-nuova');
    const tabStorico = document.getElementById('tab-storico');
    const contentNuova = document.getElementById('tab-nuova-content');
    const contentStorico = document.getElementById('tab-storico-content');
    const step1Actions = document.getElementById('step-1-actions');
    const step2Actions = document.getElementById('step-2-actions');

    tabNuova.addEventListener('click', () => {
      this.vibrate(20);
      tabNuova.classList.add('active');
      tabStorico.classList.remove('active');
      contentNuova.classList.remove('d-none');
      contentStorico.classList.add('d-none');
      // Show wizard actions for the active step
      const step1Visible = !document.getElementById('step-1').classList.contains('d-none');
      if (step1Visible) {
        step1Actions.classList.remove('d-none');
        step2Actions.classList.add('d-none');
      } else {
        step1Actions.classList.add('d-none');
        step2Actions.classList.remove('d-none');
      }
    });

    tabStorico.addEventListener('click', () => {
      this.vibrate(20);
      tabStorico.classList.add('active');
      tabNuova.classList.remove('active');
      contentStorico.classList.remove('d-none');
      contentNuova.classList.add('d-none');
      // Hide wizard actions on storico tab
      step1Actions.classList.add('d-none');
      step2Actions.classList.add('d-none');
      // Load history if not already loaded
      this.loadExpenseHistory();
    });

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
      step1Actions.classList.add('d-none');
      step2.classList.remove('d-none');
      step2Actions.classList.remove('d-none');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btn-prev-step').addEventListener('click', () => {
      step2.classList.add('d-none');
      step2Actions.classList.add('d-none');
      step1.classList.remove('d-none');
      step1Actions.classList.remove('d-none');
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
        
        const reader = new FileReader();
        reader.onload = function(ev) {
          imgPreview.src = ev.target.result;
        };
        reader.readAsDataURL(file);

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
          // Reset cache so storico reloads
          this._expenseHistoryLoaded = false;
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

  // Load and render expense history
  async loadExpenseHistory() {
    const container = document.getElementById('expense-history-list');
    if (!container) return;

    // Show skeleton on each load for fresh data
    container.innerHTML = `
      <div class="glass-card skeleton" style="height: 60px; margin-bottom: 12px; border: none;"></div>
      <div class="glass-card skeleton" style="height: 60px; margin-bottom: 12px; border: none;"></div>
      <div class="glass-card skeleton" style="height: 60px; margin-bottom: 12px; border: none;"></div>
    `;

    const categoryLabels = {
      cibo: 'Cibo/Spesa',
      utenze: 'Utenze',
      pulizie: 'Pulizie',
      manutenzione: 'Manutenzione',
      affitto: 'Affitto',
      frutta_verdura: 'Frutta e Verdura',
      abbigliamento: 'Abbigliamento',
      altro: 'Altro'
    };

    const categoryIcons = {
      cibo: 'fa-utensils',
      utenze: 'fa-bolt',
      pulizie: 'fa-broom',
      manutenzione: 'fa-wrench',
      affitto: 'fa-home',
      frutta_verdura: 'fa-apple-alt',
      abbigliamento: 'fa-tshirt',
      altro: 'fa-ellipsis-h'
    };

    try {
      const response = await fetch('../api/?module=societa&action=getForesteria');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const expenses = result.data.expenses || [];

        if (expenses.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <i class="fas fa-receipt" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px; opacity: 0.4;"></i>
              <h3 style="color: var(--text-secondary); font-size: 16px; margin-bottom: 4px;">Nessuna spesa registrata</h3>
              <p class="text-muted" style="font-size: 13px;">Le spese compariranno qui dopo il primo inserimento.</p>
            </div>
          `;
          return;
        }

        // Compute total
        const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        let html = `
          <div class="expense-total-bar stagger-item delay-1">
            <span class="label">Totale Spese</span>
            <span class="value">€ ${total.toFixed(2)}</span>
          </div>
          <div class="expense-list">
        `;

        expenses.forEach((exp, i) => {
          const cat = exp.category || 'altro';
          const icon = categoryIcons[cat] || 'fa-ellipsis-h';
          const catLabel = categoryLabels[cat] || cat;
          const dateStr = exp.expense_date
            ? new Date(exp.expense_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
          const amount = parseFloat(exp.amount || 0).toFixed(2);
          const delayClass = i < 10 ? `stagger-item delay-${Math.min(i + 1, 5)}` : '';

          html += `
            <div class="expense-item ${delayClass}">
              <div class="expense-icon cat-${cat}">
                <i class="fas ${icon}"></i>
              </div>
              <div class="expense-details">
                <div class="expense-desc">${exp.description || 'Spesa'}</div>
                <div class="expense-meta">${catLabel} • ${dateStr}</div>
              </div>
              <div class="expense-amount">€ ${amount}</div>
            </div>
          `;
        });

        html += '</div>';
        container.innerHTML = html;
      } else {
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 30px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 36px; color: var(--danger); margin-bottom: 12px;"></i>
            <p class="text-light">${result.error || 'Errore nel caricamento dello storico.'}</p>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 30px 20px;">
          <i class="fas fa-wifi" style="font-size: 36px; color: var(--warning); margin-bottom: 12px;"></i>
          <p class="text-light">Connessione non disponibile.</p>
        </div>
      `;
    }
  }

  // Profilo View
  async renderProfilo() {
    this.container.innerHTML = `
      <div class="screen profilo-screen">
        <header class="app-header glass-header">
          <div class="app-title">PROFILO</div>
          <div class="header-icon" onclick="window.location.hash='#settings'"><i class="fas fa-cog"></i></div>
        </header>

        <div class="p-20" id="profilo-content">
          <div class="glass-card skeleton" style="height: 200px;"></div>
          <div class="glass-card skeleton" style="height: 300px;"></div>
        </div>
      </div>

      ${this.getBottomNav('#profilo')}
    `;

    try {
      const response = await fetch('../api/?module=athletes&action=myProfile');
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const p = result.data;
        const progress = this.calculateDocProgress(p);
        
        const html = `
          <div class="glass-card stagger-item delay-1" style="text-align: center; position: relative; overflow: hidden;">
            <div class="profile-avatar-container">
              ${p.photo_path ? '<img src="../' + p.photo_path + '">' : '<i class="fas fa-user"></i>'}
            </div>
            <h2 style="font-size: 24px; margin-bottom: 4px;">${p.first_name} ${p.last_name}</h2>
            <div style="color: var(--accent-primary); font-weight: 700; font-size: 13px; text-transform: uppercase;">
              ${p.role || 'Atleta'} • ${p.team_name || 'Fusion'}
            </div>
          </div>

          <div class="glass-card stagger-item delay-2">
            <h3 class="section-title"><i class="fas fa-chart-pie"></i> COMPLETAMENTO PROFILO</h3>
            <div class="progress-bar-container" style="margin: 15px 0;">
              <div class="progress-fill" style="width: ${progress}%; background: var(--gradient-primary); height: 8px; border-radius: 4px;"></div>
            </div>
            <p style="font-size: 12px; color: var(--text-light);">${progress}% dei documenti caricati</p>
          </div>

          <div class="glass-card stagger-item delay-3">
             <h3 class="section-title"><i class="fas fa-folder-open"></i> DOCUMENTI</h3>
             <div class="doc-list">
               ${this.renderDocRow("Carta Identità (FR)", p.id_doc_front_file_path, 'id_doc_front_file_path', 'uploadIdDocFront')}
               ${this.renderDocRow("Certificato Medico", p.medical_cert_file_path, 'medical_cert_file_path', 'uploadMedicalCert')}
               ${this.renderDocRow("Contratto / Tesseramento", p.contract_file_path, 'contract_file_path', 'uploadContract')}
             </div>
          </div>
        `;
        document.getElementById('profilo-content').innerHTML = html;
      }
    } catch (e) {
      console.error(e);
    }
  }

  renderDocRow(title, path, field, action) {
    const statusClass = path ? 'verified' : 'missing';
    const statusText = path ? 'VERIFICATO' : 'MANCANTE';
    const icon = path ? 'fa-check-circle' : 'fa-circle-exclamation';

    return `
      <div class="doc-row">
        <div class="doc-info">
          <span class="doc-title">${title}</span>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <button class="icon-btn" onclick="app.triggerUpload('${field}')">
          <i class="fas ${path ? 'fa-eye' : 'fa-upload'}"></i>
        </button>
      </div>
    `;
  }

  calculateDocProgress(p) {
    const fields = ['id_doc_front_file_path', 'medical_cert_file_path', 'contract_file_path'];
    const filled = fields.filter(f => p[f]).length;
    return Math.round((filled / fields.length) * 100);
  }

  // Alerts View - HOOKED TO NOTIFICATION BELL
  async renderAlerts() {
    this.container.innerHTML = `
      <div class="screen alerts-screen">
        <header class="app-header glass-header">
          <div class="app-title">ALLERTA MEDICA</div>
          <div class="header-icon" onclick="window.location.hash='#dashboard'"><i class="fas fa-times"></i></div>
        </header>

        <div class="p-20" id="alerts-content">
          <div class="glass-card skeleton" style="height: 120px;"></div>
        </div>
      </div>
    `;

    try {
      const res = await fetch('../api/?module=athletes&action=alerts');
      const data = await res.json();
      
      let html = '';
      if (data.success && data.data.length > 0) {
        data.data.forEach((alert, i) => {
          html += `
            <div class="glass-card alert-item stagger-item" style="border-left: 4px solid var(--danger); animation-delay: ${i*0.1}s">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div class="alert-icon-box" style="background: rgba(255, 77, 77, 0.1); padding: 10px; border-radius: 12px;">
                  <i class="fas fa-triangle-exclamation" style="color: var(--danger); font-size: 20px;"></i>
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 16px;">${alert.athlete_name}</h4>
                  <p style="font-size: 13px; color: var(--text-light); margin-top: 5px;">Rischio infortunio: <b>${alert.status_label || 'ALTO'}</b></p>
                  <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Metriche ACWR: ${alert.acwr_value || '1.8+'}</p>
                </div>
              </div>
            </div>
          `;
        });
      } else {
        html = `<div class="glass-card" style="text-align: center; color: var(--text-muted);">Nessuna allerta attiva.</div>`;
      }
      document.getElementById('alerts-content').innerHTML = html;
    } catch(e) { console.error(e); }
  }

  triggerUpload(field) {
    const input = document.getElementById('upload-' + field);
    if (input) input.click();
    else {
      // If the field isn't in the current view, we check if it's a profile doc
      const actions = {
        'id_doc_front_file_path': 'uploadIdDocFront',
        'medical_cert_file_path': 'uploadMedicalCert',
        'contract_file_path': 'uploadContract'
      };
      const action = actions[field];
      if (action) {
        // Create hidden input on the fly if needed (fallback)
        let hidden = document.getElementById(action);
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'file';
          hidden.id = action;
          hidden.style.display = 'none';
          hidden.onchange = (e) => this.uploadProfileDoc(e.target, action);
          document.body.appendChild(hidden);
        }
        hidden.click();
      }
    }
  }
  async uploadProfileDoc(inputEl, action, athleteId, apiModule) {
    if (!inputEl.files || !inputEl.files[0]) return;
    
    const file = inputEl.files[0];
    const btn = document.getElementById('btn-' + action);
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verifica AI...';

    try {
      // 1. Lettura Base64 per Verifica AI
      const reader = new FileReader();
      reader.onerror = () => {
        alert("Errore nella lettura del file per la verifica AI.");
        btn.disabled = false;
        btn.innerHTML = originalText;
      };
      
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        
        let docType = 'carta_identita';
        let side = 'fronte';
        if (action === 'uploadIdDocBack') { docType = 'carta_identita'; side = 'retro'; }
        else if (action === 'uploadCfDocFront') { docType = 'tessera_sanitaria'; }
        else if (action === 'uploadCfDocBack') { docType = 'tessera_sanitaria'; side = 'retro'; }
        else if (action === 'uploadMedicalCert') { docType = 'certificato_medico'; }
        else if (action === 'uploadContractFile') { docType = 'contratto'; }

        try {
          const verifyRes = await fetch('../api/verify_document.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              document_type: docType,
              side: side
            })
          });
          const verifyData = await verifyRes.json();
          
          if (!verifyData.success || (verifyData.data && !verifyData.data.verified)) {
              alert(verifyData.data?.message || verifyData.error || 'Verifica AI fallita: il documento non sembra corretto.');
              btn.disabled = false;
              btn.innerHTML = originalText;
              inputEl.value = '';
              return;
          }

          // 2. Procedi col caricamento (Salviamo il file vero)
          btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Salvataggio...';
          const formData = new FormData();
          formData.append('id', athleteId);
          formData.append('file', file);

          const finalModule = (!apiModule || apiModule === 'undefined' || apiModule === 'null') ? 'athletes' : apiModule;
          const response = await fetch(`../api/?module=${finalModule}&action=${action}`, {
            method: 'POST',
            body: formData
          });

          const result = await response.json();

          if (response.ok && result.success !== false) {
            alert("Documento verificato dall'AI e caricato con successo!");
            this.renderProfilo();
          } else {
            alert(result.error || 'Errore durante il caricamento del documento.');
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        } catch (err) {
          console.error(err);
          alert("Impossibile connettersi al Server AI o Endpoint Errato.");
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      };
      
      reader.readAsDataURL(file);

    } catch (err) {
      alert("Errore d'impostazione caricamento.");
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

const app = new App();
window.app = app;
