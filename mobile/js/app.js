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

  // --- HTML Escaping to prevent XSS (P3-07) ---
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
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

  // Intercept 401 responses globally — auto-logout on expired sessions
  async apiFetch(url, options = {}) {
    const res = await fetch(url, { credentials: 'include', ...options });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('erp_user');
      window.location.hash = '#login';
      throw new Error('Sessione scaduta');
    }
    return res;
  }

  // Simple Hash Router
  route() {
    // Cleanup previous view state before rendering new one
    this.cleanup();
    
    let hash = window.location.hash || '#login';
    
    const activeUser = localStorage.getItem('erp_user');
    let role = 'atleta';
    let isAdmin = false;
    if (activeUser) {
      try {
        const u = JSON.parse(activeUser);
        if (u.role) role = u.role.toLowerCase();
        const _adminPerm = u.permissions && u.permissions['admin'];
        isAdmin = role === 'admin' || _adminPerm === 'write' || _adminPerm === 'read';
      } catch(e){}
    }
    
    if (!activeUser && hash !== '#login') {
      window.location.hash = '#login';
      return;
    }

    const isStaff = role.includes('allenatore') || role.includes('social media manager') || role.includes('operatore') || role === 'operator' || isAdmin;

    if (activeUser && hash === '#login') {
      window.location.hash = isStaff ? '#dashboard' : '#profilo';
      return;
    }

    if (!isStaff && hash === '#dashboard') {
      window.location.hash = '#profilo';
      return;
    }

    if (hash === '#login') this.renderLogin();
    else if (hash === '#dashboard') this.renderDashboard();
    else if (hash === '#spese') this.renderSpese();
    else if (hash === '#profilo') this.renderProfilo();
    else if (hash === '#alerts') this.renderAlerts(); 
    else if (hash === '#squadra') this.renderSquadra();
    else if (hash === '#presenze-team') this.renderPresenzeTeam();
    else this.renderLogin();
  }

  getBottomNav(activeHash) {
    let role = 'atleta';
    let isAdmin = false;
    try {
      const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
      if (u.role) role = u.role.toLowerCase();
      const _adminPerm = u.permissions && u.permissions['admin'];
      isAdmin = role === 'admin' || _adminPerm === 'write' || _adminPerm === 'read';
    } catch(e){}

    const isStaff = role.includes('allenatore') || role.includes('social media manager') || role.includes('operatore') || role === 'operator' || isAdmin;

    let items = [];
    if (isStaff) {
      items = [
        { id: '#dashboard', icon: 'fa-home', text: 'Home' },
        { id: '#squadra', icon: 'fa-users', text: isAdmin ? 'Atlete' : 'Squadra' },
        { id: '#presenze-team', icon: 'fa-calendar-check', text: 'Presenze' },
        { id: '#spese', icon: 'fa-receipt', text: 'Spese' },
        { id: '#profilo', icon: 'fa-user-circle', text: 'Profilo' }
      ];
    } else {
      // For athletes, Home is the profile
      items = [
        { id: '#profilo', icon: 'fa-home', text: 'Home' },
        { id: '#spese', icon: 'fa-receipt', text: 'Spese' }
      ];
    }

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
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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

  // Dashboard View (Now only for Staff members)
  renderDashboard() {
    this.container.innerHTML = `
      <div class="screen dashboard-screen">
        <header class="app-header glass-header">
          <div class="app-title">Fusion ERP</div>
          <div class="header-icon" onclick="window.location.hash='#alerts'"><i class="far fa-bell"></i></div>
        </header>

        <div class="p-20">
          <h2 id="dash-greeting" class="stagger-item delay-1" style="font-size: 24px; margin-bottom: 8px;">Bentornato</h2>
          <p class="text-light stagger-item delay-1" style="margin-bottom: 24px; font-size: 14px;">Hub Gestionale Staff</p>
          
          <div class="glass-card stagger-item delay-2" style="text-align: center; border: 2px solid var(--accent-secondary); cursor: pointer; background: rgba(255,0,122,0.05); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); margin-bottom: 20px;" onclick="window.location.hash='#spese'" id="cta-spese">
            <i class="fas fa-receipt" style="font-size: 40px; color: var(--accent-secondary); margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(255,0,122,0.5));"></i>
            <h4 style="color: var(--text-primary); font-size: 18px; margin-bottom: 4px; font-weight: 700;">SPESE</h4>
            <p class="text-muted" style="font-size: 13px;">Gestione note spese</p>
          </div>

          <div class="glass-card stagger-item delay-3" style="text-align: center; border: 2px solid var(--accent-primary); cursor: pointer; background: rgba(0, 195, 255, 0.05); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);" onclick="window.location.hash='#presenze-team'" id="cta-presenze">
            <i class="fas fa-calendar-check" style="font-size: 40px; color: var(--accent-primary); margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(0,195,255,0.5));"></i>
            <h4 style="color: var(--text-primary); font-size: 18px; margin-bottom: 4px; font-weight: 700;">PRESENZE</h4>
            <p class="text-muted" style="font-size: 13px;">Gestione presenze atleti</p>
          </div>

          <button class="btn btn-secondary mt-20 stagger-item delay-4" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i> DISCONNETTI
          </button>
        </div>
      </div>

      ${this.getBottomNav('#dashboard')}
    `;

    ['cta-spese', 'cta-presenze'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('touchstart', function() { this.style.transform = 'scale(0.98)'; });
        el.addEventListener('touchend', function() { this.style.transform = 'scale(1)'; });
      }
    });

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
        await fetch('../api/?module=auth&action=logout', { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      } catch(e) {}
      localStorage.removeItem('erp_user');
      window.location.hash = '#login';
    });
  }

  async checkNotifications() {
    const userStr = localStorage.getItem('erp_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user || !['social media manager', 'operatore', 'allenatore', 'admin', 'operator'].includes(user.role?.toLowerCase())) return;

    try {
      const res = await fetch(`../api/?module=athletes&action=alerts`, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
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
          <i class="fas fa-arrow-left"></i> INDIETRO
        </button>
        <button type="button" class="btn" id="submit-expense-btn" style="flex: 2;">
          <i class="fas fa-paper-plane"></i> SALVA SPESA
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
          credentials: 'include',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
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
      const response = await fetch('../api/?module=societa&action=getForesteria', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
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
                <div class="expense-desc">${this.escapeHtml(exp.description || 'Spesa')}</div>
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

  // Profilo View (Extended with SubTabs)
  async renderProfilo(forceUserId = null) {
    let uId = forceUserId;
    if (!uId) {
      try {
        const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
        uId = u.id;
      } catch(e){}
    }

    const isOwningProfile = !forceUserId; // Se non forceUserId, stiamo guardando il nostro

    this.container.innerHTML = `
      <div class="screen profilo-screen">
        <header class="app-header glass-header">
          <div class="app-title">${isOwningProfile ? 'MIO PROFILO' : 'SCHEDA ATLETA'}</div>
          ${isOwningProfile 
            ? `<div class="header-icon" onclick="window.location.hash='#dashboard'"><i class="fas fa-home"></i></div>` 
            : `<div class="header-icon" onclick="window.history.back()"><i class="fas fa-arrow-left"></i></div>`
          }
        </header>

        <div class="profile-subtabs-container stagger-item delay-1" style="padding: 15px 20px 5px 20px;">
          <div class="subtab-btn active" onclick="app.switchSubTab('anagrafica', this)">Anagrafica</div>
          <div class="subtab-btn" onclick="app.switchSubTab('quote', this)">Quote</div>
          <div class="subtab-btn" onclick="app.switchSubTab('performance', this)">Performance</div>
          <div class="subtab-btn" onclick="app.switchSubTab('infortuni', this)">Infortuni</div>
          <div class="subtab-btn" onclick="app.switchSubTab('documenti', this)">Documenti</div>
          <div class="subtab-btn" onclick="app.switchSubTab('trasporti', this)">Trasporti</div>
          <div class="subtab-btn" onclick="app.switchSubTab('sotto_utenti', this)">Famiglia</div>
          <div class="subtab-btn" onclick="app.switchSubTab('presenze', this)">Presenze</div>
        </div>

        <div class="p-20" id="profilo-content">
          <div class="glass-card skeleton" style="height: 200px;"></div>
        </div>
      </div>
      ${isOwningProfile ? this.getBottomNav('#profilo') : ''}
    `;

    try {
      const url = isOwningProfile ? '../api/?module=athletes&action=myProfile' : `../api/?module=athletes&action=myProfile&id=${uId}`;
      const response = await fetch(url, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        this.currentAthleteProfile = result.data;
        this.currentProfileIsOwn = isOwningProfile;
        
        // Render subtab anagrafica by default
        this.renderSubTabAnagrafica();
      } else {
        document.getElementById('profilo-content').innerHTML = `<div class="glass-card text-center"><p>Dati non accessibili.</p></div>`;
      }
    } catch (e) {
      console.error(e);
      document.getElementById('profilo-content').innerHTML = `<div class="glass-card text-center"><p>Errore di connessione.</p></div>`;
    }
  }

  switchSubTab(tabId, btnElement) {
    this.vibrate(20);
    // Update active class
    const container = document.querySelector('.profile-subtabs-container');
    if (container) {
      container.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      btnElement.classList.add('active');
      // scroll into view smoothly
      btnElement.scrollIntoView({ inline: 'center', behavior: 'smooth' });
    }

    const contentDiv = document.getElementById('profilo-content');
    contentDiv.classList.remove('stagger-item');
    // force reflow to trigger animation again
    void contentDiv.offsetWidth;
    contentDiv.classList.add('stagger-item');

    if (tabId === 'anagrafica') this.renderSubTabAnagrafica();
    else if (tabId === 'documenti') this.renderSubTabDocumenti();
    else if (tabId === 'quote') this.renderSubTabQuote();
    else if (tabId === 'performance') this.renderSubTabPerformance();
    else if (tabId === 'infortuni') this.renderSubTabInfortuni();
    else if (tabId === 'trasporti') this.renderSubTabTrasporti();
    else if (tabId === 'sotto_utenti') this.renderSubTabSottoUtenti();
    else if (tabId === 'presenze') this.renderSubTabPresenze();
  }

  renderSubTabAnagrafica() {
    const p = this.currentAthleteProfile;
    const isMio = this.currentProfileIsOwn;

    const html = `
      <div class="glass-card text-center" style="position: relative; overflow: hidden;">
        <div class="profile-avatar-container">
          ${p.photo_path ? '<img src="../' + p.photo_path + '">' : '<i class="fas fa-user"></i>'}
        </div>
        <h2 style="font-size: 24px; margin-bottom: 4px;">${this.escapeHtml(p.first_name)} ${this.escapeHtml(p.last_name)}</h2>
        <div style="color: var(--accent-primary); font-weight: 700; font-size: 13px; text-transform: uppercase;">
          ${p.role || 'Atleta'} • ${p.team_name || 'Fusion'}
        </div>
      </div>
      
      <div class="glass-card">
        <h3 class="section-title"><i class="fas fa-id-card"></i> DATI PERSONALI</h3>
        <div class="inline-edit-group">
          <label class="input-label">Email</label>
          <div style="color:var(--text-primary); margin-bottom:10px;">${p.email || 'N/D'}</div>
        </div>
        <div class="inline-edit-group">
          <label class="input-label">Data di Nascita</label>
          <div style="color:var(--text-primary); margin-bottom:10px;">${p.birth_date ? new Date(p.birth_date).toLocaleDateString() : 'N/D'}</div>
        </div>
        
        ${isMio ? `
        <form id="form-edit-anagrafica" onsubmit="return false">
          <div class="inline-edit-group">
            <label class="input-label">Telefono (Modificabile)</label>
            <input type="tel" class="inline-edit-input" id="edit-phone" value="${p.phone || ''}" placeholder="Tocca per inserire">
          </div>
          <div class="inline-edit-group">
            <label class="input-label">Taglia Abbigliamento (Modificabile)</label>
            <input type="text" class="inline-edit-input" id="edit-size" value="${p.shirt_size || ''}" placeholder="Es: M, L, XL">
          </div>
          <button class="btn btn-secondary mt-10" onclick="app.saveAnagraficaPartial()"><i class="fas fa-save"></i> Salva Dati Modificati</button>
        </form>
        ` : `
          <div class="inline-edit-group">
            <label class="input-label">Telefono</label>
            <div style="color:var(--text-primary); margin-bottom:10px;">${p.phone || 'N/D'}</div>
          </div>
          <div class="inline-edit-group">
            <label class="input-label">Taglia Abbigliamento</label>
            <div style="color:var(--text-primary); margin-bottom:10px;">${p.shirt_size || 'N/D'}</div>
          </div>
        `}
      </div>
    `;
    document.getElementById('profilo-content').innerHTML = html;
  }

  async saveAnagraficaPartial() {
    this.vibrate(50);
    const phone = document.getElementById('edit-phone')?.value?.trim() || '';
    const shirtSize = document.getElementById('edit-size')?.value?.trim() || '';
    const p = this.currentAthleteProfile;
    if (!p || !p.id) {
      alert('Errore: profilo non caricato.');
      return;
    }

    try {
      const response = await fetch('../api/?module=athletes&action=update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ id: p.id, phone: phone, shirt_size: shirtSize }),
      });
      const result = await response.json();
      if (response.ok && result.success !== false) {
        alert('Dati aggiornati con successo!');
        this.currentAthleteProfile.phone = phone;
        this.currentAthleteProfile.shirt_size = shirtSize;
      } else {
        alert(result.error || 'Errore durante il salvataggio.');
      }
    } catch (err) {
      console.error(err);
      alert('Impossibile connettersi al server.');
    }
  }

  renderSubTabDocumenti() {
    const p = this.currentAthleteProfile;
    const progress = this.calculateDocProgress(p);
    
    document.getElementById('profilo-content').innerHTML = `
      <div class="glass-card">
        <h3 class="section-title"><i class="fas fa-chart-pie"></i> COMPLETAMENTO PROFILO</h3>
        <div class="progress-bar-container" style="margin: 15px 0;">
          <div class="progress-fill" style="width: ${progress}%; background: var(--gradient-primary); height: 8px; border-radius: 4px;"></div>
        </div>
        <p style="font-size: 12px; color: var(--text-light);">${progress}% dei documenti caricati</p>
      </div>

      <div class="glass-card">
         <h3 class="section-title"><i class="fas fa-folder-open"></i> DOCUMENTI</h3>
         <div class="doc-list">
           ${this.renderDocRow("Carta Identità (FR)", p.id_doc_front_file_path, 'id_doc_front_file_path', 'uploadIdDocFront')}
           ${this.renderDocRow("Certificato Medico", p.medical_cert_file_path, 'medical_cert_file_path', 'uploadMedicalCert')}
           ${this.renderDocRow("Contratto / Tesseramento", p.contract_file_path, 'contract_file_path', 'uploadContractFile')}
         </div>
      </div>
    `;
  }

  async renderSubTabQuote() {
    const content = document.getElementById('profilo-content');
    const p = this.currentAthleteProfile;
    if (!p) { content.innerHTML = '<p class="text-muted text-center">Profilo non caricato.</p>'; return; }

    // Show quota data from athlete profile fields
    const quotaFields = [
      { label: 'Iscrizione Rata 1', amount: p.quota_iscrizione_rata1, paid: p.quota_iscrizione_rata1_paid },
      { label: 'Iscrizione Rata 2', amount: p.quota_iscrizione_rata2, paid: p.quota_iscrizione_rata2_paid },
      { label: 'Vestiario', amount: p.quota_vestiario, paid: p.quota_vestiario_paid },
      { label: 'Foresteria', amount: p.quota_foresteria, paid: p.quota_foresteria_paid },
      { label: 'Trasporti', amount: p.quota_trasporti, paid: p.quota_trasporti_paid },
    ];

    let totalDue = 0, totalPaid = 0;
    let rowsHtml = '';
    quotaFields.forEach(q => {
      const amt = parseFloat(q.amount || 0);
      const isPaid = parseInt(q.paid || 0) === 1;
      totalDue += amt;
      if (isPaid) totalPaid += amt;
      const statusIcon = isPaid ? '<i class="fas fa-check-circle" style="color:var(--success)"></i>' : '<i class="fas fa-clock" style="color:var(--warning)"></i>';
      const statusText = isPaid ? 'Pagato' : 'Da pagare';
      rowsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-subtle);">
          <div>
            <div style="font-weight:600; font-size:14px;">${q.label}</div>
            <div style="font-size:12px; color:var(--text-muted);">${statusIcon} ${statusText}</div>
          </div>
          <div style="font-family:'Syne',sans-serif; font-weight:700; font-size:16px; color:${isPaid ? 'var(--success)' : 'var(--accent-primary)'};">€ ${amt.toFixed(2)}</div>
        </div>
      `;
    });

    const deadlineStr = p.quota_payment_deadline ? new Date(p.quota_payment_deadline).toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' }) : 'N/D';

    content.innerHTML = `
      <div class="glass-card">
        <h3 class="section-title"><i class="fas fa-money-bill-wave"></i> QUOTE STAGIONALI</h3>
        <div class="expense-total-bar" style="margin-bottom:15px;">
          <span class="label">Totale Dovuto</span>
          <span class="value">€ ${totalDue.toFixed(2)}</span>
        </div>
        <div class="expense-total-bar" style="margin-bottom:15px; background: linear-gradient(135deg, rgba(0,255,188,0.08), rgba(0,242,254,0.08));">
          <span class="label">Pagato</span>
          <span class="value" style="color:var(--success)">€ ${totalPaid.toFixed(2)}</span>
        </div>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:15px;"><i class="fas fa-calendar-alt"></i> Scadenza: ${deadlineStr}</p>
        ${rowsHtml}
      </div>
    `;
  }

  async renderSubTabPerformance() {
    const content = document.getElementById('profilo-content');
    const p = this.currentAthleteProfile;
    if (!p || !p.id) { content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Profilo non caricato.</p></div>'; return; }

    content.innerHTML = '<div class="glass-card skeleton" style="height:200px;"></div>';

    try {
      const res = await fetch(`../api/?module=athletes&action=acwr&id=${p.id}`, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const acwr = data.data;
        const riskColor = acwr.risk === 'high' || acwr.risk === 'extreme' ? 'var(--danger)' : acwr.risk === 'moderate' ? 'var(--warning)' : 'var(--success)';
        content.innerHTML = `
          <div class="glass-card text-center">
            <i class="fas fa-tachometer-alt" style="font-size:40px; color:var(--accent-primary); margin-bottom:15px; opacity:0.8;"></i>
            <h3>ACWR & Performance</h3>
            <div style="display:flex; justify-content:space-around; margin-top:20px;">
              <div>
                <div style="font-size:32px; font-weight:700; color:${riskColor};">${(acwr.score || 0).toFixed(2)}</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">ACWR Score</div>
              </div>
              <div>
                <div style="font-size:32px; font-weight:700; color:var(--accent-primary);">${acwr.acute_load || 0}</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Carico Acuto (7gg)</div>
              </div>
              <div>
                <div style="font-size:32px; font-weight:700; color:var(--accent-secondary);">${acwr.chronic_load || 0}</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Carico Cronico (28gg)</div>
              </div>
            </div>
            <div style="margin-top:15px; padding:10px; border-radius:8px; background:${riskColor}15;">
              <span style="font-size:13px; font-weight:600; color:${riskColor}; text-transform:uppercase;">${acwr.risk || 'N/D'} Risk</span>
            </div>
          </div>
        `;
      } else {
        content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Nessun dato di performance disponibile.</p></div>';
      }
    } catch(e) {
      console.error(e);
      content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Errore di connessione.</p></div>';
    }
  }

  async renderSubTabInfortuni() {
    const content = document.getElementById('profilo-content');
    const p = this.currentAthleteProfile;
    if (!p || !p.id) { content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Profilo non caricato.</p></div>'; return; }

    content.innerHTML = '<div class="glass-card skeleton" style="height:120px;"></div>';

    try {
      const res = await fetch(`../api/?module=health&action=getInjuries&athlete_id=${p.id}`, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const data = await res.json();

      if (res.ok && data.success && data.data && data.data.length > 0) {
        let html = '<div class="glass-card"><h3 class="section-title"><i class="fas fa-briefcase-medical"></i> STORICO MEDICO</h3>';
        data.data.forEach(injury => {
          const dateStr = injury.injury_date ? new Date(injury.injury_date).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }) : '';
          const statusIcon = injury.status === 'recovered' ? '<i class="fas fa-check-circle" style="color:var(--success)"></i>' : '<i class="fas fa-clock" style="color:var(--warning)"></i>';
          html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-subtle);">
              <div>
                <div style="font-weight:600; font-size:14px;">${this.escapeHtml(injury.type || injury.description || 'Infortunio')}</div>
                <div style="font-size:12px; color:var(--text-muted);">${dateStr} ${statusIcon} ${this.escapeHtml(injury.status || '')}</div>
              </div>
              <div style="font-size:12px; color:var(--text-light);">${injury.recovery_days ? injury.recovery_days + ' gg' : ''}</div>
            </div>
          `;
        });
        html += '</div>';
        content.innerHTML = html;
      } else {
        content.innerHTML = `
          <div class="glass-card text-center">
            <i class="fas fa-briefcase-medical" style="font-size:40px; color:var(--success); margin-bottom:15px; opacity:0.8;"></i>
            <h3>Nessun Infortunio</h3>
            <p class="text-muted mt-10">Non ci sono infortuni registrati per questo atleta.</p>
          </div>
        `;
      }
    } catch(e) {
      console.error(e);
      content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Errore di connessione.</p></div>';
    }
  }

  async renderSubTabTrasporti() {
    const content = document.getElementById('profilo-content');
    const p = this.currentAthleteProfile;
    if (!p || !p.id) { content.innerHTML = '<p class="text-muted text-center">Profilo non caricato.</p>'; return; }

    content.innerHTML = '<div class="glass-card skeleton" style="height:120px;"></div>';

    try {
      const res = await fetch(`../api/?module=athletes&action=getTransportHistory&id=${p.id}`, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const data = await res.json();

      if (res.ok && data.success && data.data && data.data.length > 0) {
        let html = '<div class="glass-card"><h3 class="section-title"><i class="fas fa-shuttle-van"></i> TRASPORTI ASSEGNATI</h3>';
        data.data.forEach(t => {
          const dateStr = t.date ? new Date(t.date).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }) : '';
          html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-subtle);">
              <div>
                <div style="font-weight:600; font-size:14px;">${this.escapeHtml(t.destination || t.event_name || 'Trasporto')}</div>
                <div style="font-size:12px; color:var(--text-muted);">${dateStr} ${t.driver_name ? '• Autista: ' + this.escapeHtml(t.driver_name) : ''}</div>
              </div>
              <div style="font-size:12px; color:var(--accent-primary); font-weight:600;">${t.status || ''}</div>
            </div>
          `;
        });
        html += '</div>';
        content.innerHTML = html;
      } else {
        content.innerHTML = `
          <div class="glass-card text-center">
            <i class="fas fa-shuttle-van" style="font-size:40px; color:var(--warning); margin-bottom:15px; opacity:0.8;"></i>
            <h3>Trasporti e Corse</h3>
            <p class="text-muted mt-10">Non hai turni di trasporto assegnati per i prossimi eventi.</p>
          </div>
        `;
      }
    } catch(e) {
      console.error(e);
      content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Errore di connessione.</p></div>';
    }
  }

  renderSubTabSottoUtenti() {
    document.getElementById('profilo-content').innerHTML = `
      <div class="glass-card">
        <h3 class="section-title"><i class="fas fa-users"></i> LEGAMI FAMIGLIARI</h3>
        <p class="text-light" style="font-size:13px;">Gestisci i profili associati al tuo account (es. figli).</p>
        <p class="text-muted" style="font-size:12px; margin-top:10px;">Per associare un nuovo minore, contattare la segreteria.</p>
      </div>
    `;
  }

  async renderSubTabPresenze() {
    const content = document.getElementById('profilo-content');
    const p = this.currentAthleteProfile;
    if (!p || !p.id) { content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Profilo non caricato.</p></div>'; return; }

    content.innerHTML = '<div class="glass-card skeleton" style="height:120px;"></div>';

    try {
      const teamId = p.team_id || '';
      const res = await fetch(`../api/?module=teams&action=getAttendances&team_id=${teamId}&athlete_id=${p.id}`, {
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const data = await res.json();

      if (res.ok && data.success && data.data && data.data.length > 0) {
        const total = data.data.length;
        const present = data.data.filter(a => a.status === 'present').length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        const barColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

        content.innerHTML = `
          <div class="glass-card text-center">
            <i class="fas fa-check-square" style="font-size:40px; color:var(--accent-secondary); margin-bottom:15px; opacity:0.8;"></i>
            <h3>Presenze Personali</h3>
            <div style="font-size:48px; font-weight:700; color:${barColor}; margin:15px 0;">${pct}%</div>
            <div class="progress-bar-container" style="margin:10px 0;">
              <div class="progress-fill" style="width:${pct}%; background:${barColor}; height:8px; border-radius:4px;"></div>
            </div>
            <p class="text-muted" style="font-size:12px;">${present} presenze su ${total} sessioni registrate</p>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="glass-card text-center">
            <i class="fas fa-check-square" style="font-size:40px; color:var(--accent-secondary); margin-bottom:15px; opacity:0.8;"></i>
            <h3>Presenze Personali</h3>
            <p class="text-muted mt-10">Nessun dato di presenze disponibile.</p>
          </div>
        `;
      }
    } catch(e) {
      console.error(e);
      content.innerHTML = '<div class="glass-card text-center"><p class="text-muted">Errore di connessione.</p></div>';
    }
  }

  // SQUADRA E PRESENZE COATCH (NEW VUES)
  async renderSquadra() {
    this.container.innerHTML = `
      <div class="screen squadra-screen">
        <header class="app-header glass-header">
          <div class="app-title">LA TUA SQUADRA</div>
          <div class="header-icon" onclick="window.location.hash='#presenze-team'"><i class="fas fa-clipboard-check"></i></div>
        </header>

        <div class="p-20">
          <div class="glass-card stagger-item delay-1" style="background: rgba(0, 242, 254, 0.05); border-color: rgba(0, 242, 254, 0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h3 style="color:var(--accent-primary); font-size:14px; margin-bottom:2px;">APPELLO DI SQUADRA</h3>
                <p style="font-size:12px; color:var(--text-light);">Registra le presenze per l'allenamento odierno</p>
              </div>
              <button class="icon-btn" style="background:var(--accent-primary); color:#000;" onclick="window.location.hash='#presenze-team'"><i class="fas fa-arrow-right"></i></button>
            </div>
          </div>

          <h3 class="section-title mt-20 stagger-item delay-2">ELENCO ATLETI ROSTER</h3>
          
          <div class="input-group stagger-item delay-2" id="roster-team-selector-group" style="display:none; margin-bottom: 15px;">
            <select id="roster-team-selector" class="input-field">
               <option value="">Tutte le squadre...</option>
            </select>
          </div>

          <div id="squadra-list" class="team-list stagger-item delay-3">
             <div class="glass-card skeleton" style="height:60px;"></div>
             <div class="glass-card skeleton" style="height:60px;"></div>
             <div class="glass-card skeleton" style="height:60px;"></div>
          </div>
        </div>
      </div>
      ${this.getBottomNav('#squadra')}
    `;

    const listContainer = document.getElementById('squadra-list');

    const loadSquadraAthletes = async (teamId) => {
      listContainer.innerHTML = `
         <div class="glass-card skeleton" style="height:60px;"></div>
         <div class="glass-card skeleton" style="height:60px;"></div>
         <div class="glass-card skeleton" style="height:60px;"></div>
      `;
      try {
        const url = teamId 
          ? `../api/?module=athletes&action=list&teamId=${teamId}` 
          : `../api/?module=athletes&action=list`;
        const res = await fetch(url, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        const data = await res.json();

        let html = '';
        if (data.success && data.data && data.data.length > 0) {
          data.data.forEach(athlete => {
            html += `
              <div class="athlete-item" onclick="app.renderProfilo('${athlete.id}')">
                <div class="athlete-avatar">
                  ${athlete.photo_path ? `<img src="../${athlete.photo_path}">` : '<i class="fas fa-user"></i>'}
                </div>
                <div class="athlete-details">
                  <div class="athlete-name">${this.escapeHtml(athlete.full_name)}</div>
                  <div class="athlete-meta">${this.escapeHtml(athlete.role || 'Giocatore')}</div>
                </div>
                <i class="fas fa-chevron-right" style="color: var(--border-subtle)"></i>
              </div>
            `;
          });
        } else {
          html = '<p class="text-muted text-center" style="margin-top:20px;">Nessun atleta trovato per questa squadra.</p>';
        }
        listContainer.innerHTML = html;
      } catch(e) {
        listContainer.innerHTML = '<p class="text-danger text-center">Nessuna connessione.</p>';
      }
    };

    // Load teams for dropdown
    try {
      const resTeams = await fetch('../api/?module=athletes&action=teams', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const teamsData = await resTeams.json();
      const selector = document.getElementById('roster-team-selector');
      const group = document.getElementById('roster-team-selector-group');
      
      let initialTeamId = '';
      try {
        const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
        initialTeamId = u.team_id || u.teamId || '';
      } catch(e){}

      if (teamsData.success && teamsData.data && teamsData.data.length > 0) {
        group.style.display = 'block';
        selector.innerHTML = '<option value="">Tutte le squadre...</option>';
        teamsData.data.forEach(t => {
          let selected = t.id == initialTeamId ? 'selected' : '';
          selector.innerHTML += `<option value="${t.id}" ${selected}>${this.escapeHtml(t.name)}</option>`;
        });
        
        // Don't auto-select the first team if none matched the user's team ID, leave it empty (Tutte le squadre)
        let valToLoad = selector.value || '';
        selector.value = valToLoad;
        initialTeamId = valToLoad;

        selector.addEventListener('change', (e) => {
          loadSquadraAthletes(e.target.value);
        });
      }
      
      loadSquadraAthletes(initialTeamId);
    } catch(e) {
      loadSquadraAthletes(''); // fallback
    }
  }

  async renderPresenzeTeam() {
    this.container.innerHTML = `
      <div class="screen presenze-team-screen">
        <header class="app-header glass-header">
          <div class="app-title">APPELLO OGGI</div>
          <div class="header-icon" onclick="window.location.hash='#squadra'"><i class="fas fa-times"></i></div>
        </header>

        <div class="p-20">
          <h2 style="font-size:20px; text-transform:uppercase; margin-bottom:20px;" class="stagger-item text-center">${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          
          <div class="input-group stagger-item delay-1" id="team-selector-group" style="display:none;">
            <select id="attendance-team-selector" class="input-field mb-20">
               <option value="">Seleziona Squadra...</option>
            </select>
          </div>

          <div id="attendance-grid" class="stagger-item delay-1" style="display:flex; flex-direction:column; gap:12px;">
             <!-- Skeleton -->
             <div class="glass-card skeleton" style="height:60px;"></div>
             <div class="glass-card skeleton" style="height:60px;"></div>
          </div>
          
          <div class="wizard-padding"></div>
        </div>
      </div>
      
      <!-- Fixed Action Buttons -->
      <div class="wizard-actions">
        <button class="btn" style="background:var(--success); flex: 1;" id="btn-confirm-attendance">
          <i class="fas fa-save"></i> CONFERMA MASCHERA PRESENZE
        </button>
      </div>
      
      ${this.getBottomNav('#presenze-team')}
    `;

    const grid = document.getElementById('attendance-grid');
    const loadAthletesForTeam = async (teamId) => {
      grid.innerHTML = `
        <div class="glass-card skeleton" style="height:60px; padding:0; margin:0;"></div>
        <div class="glass-card skeleton" style="height:60px; padding:0; margin:0;"></div>
      `;
      try {
        const url = teamId 
          ? `../api/?module=athletes&action=list&teamId=${teamId}` 
          : `../api/?module=athletes&action=list`;
        const res = await fetch(url, { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        const data = await res.json();
        let html = '';
        if (data.success && data.data && data.data.length > 0) {
          data.data.forEach(athlete => {
            html += `
              <div class="attendance-card" id="att-card-${athlete.id}" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; text-align:left;">
                <div class="athlete-name" style="font-size:15px; font-weight:700; color:var(--text-primary);">
                  ${this.escapeHtml(athlete.full_name)}
                </div>
                
                <div class="attendance-actions" style="margin-top:0; gap:12px;">
                  <button class="btn-att btn-att-yes" style="font-family:'Syne',sans-serif; font-weight:bold; font-size:18px; width:44px; height:44px;" onclick="app.markAttendance('${athlete.id}', 'present')">V</button>
                  <button class="btn-att btn-att-no" style="font-family:'Syne',sans-serif; font-weight:bold; font-size:18px; width:44px; height:44px;" onclick="app.markAttendance('${athlete.id}', 'absent')">X</button>
                </div>
              </div>
            `;
          });
        } else {
           html = '<p class="text-muted text-center" style="margin-top:20px;">Nessun atleta trovato per questa squadra.</p>';
        }
        grid.innerHTML = html;
      } catch(e) {
        grid.innerHTML = '<p class="text-danger text-center">Nessuna connessione.</p>';
      }
    };

    // Load teams for dropdown
    try {
      const resTeams = await fetch('../api/?module=athletes&action=teams', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const teamsData = await resTeams.json();
      const selector = document.getElementById('attendance-team-selector');
      const group = document.getElementById('team-selector-group');
      
      let initialTeamId = '';
      try {
        const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
        initialTeamId = u.team_id || u.teamId || '';
      } catch(e){}

      if (teamsData.success && teamsData.data && teamsData.data.length > 0) {
        group.style.display = 'block';
        selector.innerHTML = '<option value="">Seleziona Squadra...</option>';
        teamsData.data.forEach(t => {
          let selected = t.id == initialTeamId ? 'selected' : '';
          selector.innerHTML += `<option value="${t.id}" ${selected}>${this.escapeHtml(t.name)}</option>`;
        });
        
        let valToLoad = selector.value || (teamsData.data.length > 0 ? teamsData.data[0].id : '');
        selector.value = valToLoad;
        initialTeamId = valToLoad;

        selector.addEventListener('change', (e) => {
          loadAthletesForTeam(e.target.value);
        });
      }
      
      loadAthletesForTeam(initialTeamId);
    } catch(e) {
      loadAthletesForTeam(''); // fallback
    }

    // P3.1: Attach listener to confirm button
    const confirmBtn = document.getElementById('btn-confirm-attendance');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        this.vibrate(50);
        const cards = document.querySelectorAll('.attendance-card');
        const records = [];
        cards.forEach(card => {
          const id = card.id.replace('att-card-', '');
          let status = 'unknown';
          if (card.classList.contains('present')) status = 'present';
          else if (card.classList.contains('absent')) status = 'absent';
          if (status !== 'unknown') records.push({ athlete_id: id, status });
        });

        if (records.length === 0) {
          alert('Segna almeno una presenza prima di confermare.');
          return;
        }

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SALVATAGGIO...';

        try {
          // Save attendance for today — send individual records to correct endpoint
          const today = new Date().toISOString().split('T')[0];
          
          let teamId = document.getElementById('attendance-team-selector')?.value;
          if (!teamId) {
            try {
              const u = JSON.parse(localStorage.getItem('erp_user') || '{}');
              teamId = u.team_id || u.teamId || null;
            } catch(e) {}
          }

          for (const rec of records) {
            await fetch('../api/?module=teams&action=saveAttendance', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
              body: JSON.stringify({
                team_id: teamId,
                athlete_id: rec.athlete_id,
                attendance_date: today,
                status: rec.status
              }),
            });
          }
          alert(`Presenze salvate: ${records.length} registrazioni.`);
          window.location.hash = '#squadra';
        } catch(err) {
          alert('Errore durante il salvataggio delle presenze.');
        } finally {
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-save"></i> CONFERMA MASCHERA PRESENZE';
          }
        }
      });
    }
  }

  markAttendance(id, status) {
    this.vibrate(20);
    const card = document.getElementById('att-card-' + id);
    if (!card) return;
    
    card.classList.remove('present', 'absent');
    card.classList.add(status);
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
      const res = await fetch('../api/?module=athletes&action=alerts', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
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
                  <h4 style="margin: 0; font-size: 16px;">${this.escapeHtml(alert.athlete_name)}</h4>
                  <p style="font-size: 13px; color: var(--text-light); margin-top: 5px;">Rischio infortunio: <b>${this.escapeHtml(alert.status_label || 'ALTO')}</b></p>
                  <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Metriche ACWR: ${this.escapeHtml(alert.acwr_value || '1.8+')}</p>
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
        'contract_file_path': 'uploadContractFile'
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
          hidden.onchange = (e) => this.uploadProfileDoc(e.target, action, this.currentAthleteProfile?.id, 'athletes');
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
    const originalText = btn ? btn.innerHTML : '';
    
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verifica AI...';
    }

    try {
      // 1. Lettura Base64 per Verifica AI
      const reader = new FileReader();
      reader.onerror = () => {
        alert("Errore nella lettura del file per la verifica AI.");
        if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
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
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({
              image: base64Data,
              document_type: docType,
              side: side
            })
          });
          const verifyData = await verifyRes.json();
          
          if (!verifyData.success || (verifyData.data && !verifyData.data.verified)) {
              alert(verifyData.data?.message || verifyData.error || 'Verifica AI fallita: il documento non sembra corretto.');
              if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
              inputEl.value = '';
              return;
          }

          // 2. Procedi col caricamento (Salviamo il file vero)
          if (btn) btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Salvataggio...';
          const formData = new FormData();
          formData.append('id', athleteId);
          formData.append('file', file);

          const finalModule = (!apiModule || apiModule === 'undefined' || apiModule === 'null') ? 'athletes' : apiModule;
          const response = await fetch(`../api/?module=${finalModule}&action=${action}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
          });

          const result = await response.json();

          if (response.ok && result.success !== false) {
            alert("Documento verificato dall'AI e caricato con successo!");
            this.renderProfilo();
          } else {
            alert(result.error || 'Errore durante il caricamento del documento.');
            if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
          }
        } catch (err) {
          console.error(err);
          alert("Impossibile connettersi al Server AI o Endpoint Errato.");
          if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
        }
      };
      
      reader.readAsDataURL(file);

    } catch (err) {
      alert("Errore d'impostazione caricamento.");
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    }
  }
}

const app = new App();
window.app = app;
