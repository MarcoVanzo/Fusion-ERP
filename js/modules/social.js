/**
 * Social Module — Meta Business Analytics Dashboard
 * Fusion ERP v1.0
 *
 * Displays Instagram + Facebook analytics with KPI cards,
 * trend charts, and recent posts grid.
 */

'use strict';

const Social = (() => {
    let _ac = new AbortController();
    let _data = null;
    let _connected = false;
    let _selectedPeriod = 28;
    let _chartCanvas = null;

    async function init() {
        _ac = new AbortController();
        _selectedPeriod = 28;

        // Check URL params for OAuth callback results
        const hash = window.location.hash;
        if (hash.includes('connected=1')) {
            UI.toast('Account Meta collegato con successo!', 'success');
            history.replaceState(null, '', window.location.pathname + '#social');
        } else if (hash.includes('error=')) {
            const errorMsg = decodeURIComponent(hash.split('error=')[1] || 'Errore sconosciuto');
            UI.toast('Errore OAuth: ' + errorMsg, 'error', 6000);
            history.replaceState(null, '', window.location.pathname + '#social');
        }

        await render();
    }

    async function render() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = UI.skeletonPage();

        try {
            // Check connection status first
            const status = await Store.get('status', 'social');
            _connected = status?.connected || false;

            // Fetch insights data (returns mock if not connected)
            _data = await Store.get('insights', 'social', { days: _selectedPeriod });

            if (!_connected && !_data?.is_mock) {
                _renderConnectScreen(app);
                return;
            }

            _renderDashboard(app);
        } catch (err) {
            console.error('[Social] Render error:', err);
            _renderConnectScreen(app);
        }
    }

    // ─── CONNECT SCREEN ──────────────────────────────────────────────────────

    function _renderConnectScreen(app) {
        app.innerHTML = `
        <div class="page-body" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
            <div class="social-connect-card" id="social-connect-card">
                <div class="social-connect-icon">
                    <i class="ph ph-instagram-logo" style="font-size:48px;color:var(--color-pink);"></i>
                    <i class="ph ph-facebook-logo" style="font-size:48px;color:#1877F2;"></i>
                </div>
                <h2 class="social-connect-title">Collega i tuoi Social</h2>
                <p class="social-connect-desc">
                    Connetti il tuo account Instagram Business e la tua Pagina Facebook
                    per visualizzare le analytics direttamente dall'ERP.
                </p>
                <div class="social-connect-features">
                    <div class="social-feature"><i class="ph ph-chart-line-up"></i> Andamento follower e reach</div>
                    <div class="social-feature"><i class="ph ph-eye"></i> Views e engagement per post</div>
                    <div class="social-feature"><i class="ph ph-trend-up"></i> Grafici trend giornalieri</div>
                    <div class="social-feature"><i class="ph ph-images"></i> Griglia ultimi post con metriche</div>
                </div>
                <button class="btn btn-primary social-connect-btn" id="btn-connect-meta" type="button">
                    <i class="ph ph-plug"></i> Connetti Instagram & Facebook
                </button>
                <button class="btn btn-ghost social-demo-btn" id="btn-demo-social" type="button" style="margin-top:8px;">
                    <i class="ph ph-eye"></i> Mostra Demo con dati di esempio
                </button>
                <p class="social-connect-note">
                    <i class="ph ph-info"></i> Servono un account Instagram Business e una Pagina Facebook collegata.
                </p>
            </div>
        </div>`;

        document.getElementById('btn-connect-meta')?.addEventListener('click', () => {
            window.location.href = Store.getApiUrl ?
                `api/router.php?module=social&action=connect` :
                `api/router.php?module=social&action=connect`;
        });

        document.getElementById('btn-demo-social')?.addEventListener('click', async () => {
            try {
                _data = await Store.get('insights', 'social', { days: _selectedPeriod });
                _renderDashboard(app);
            } catch (err) {
                UI.toast('Errore nel caricamento demo', 'error');
            }
        });
    }

    // ─── MAIN DASHBOARD ──────────────────────────────────────────────────────

    function _renderDashboard(app) {
        const profile = _data?.profile || {};
        const daily = _data?.daily_insights || [];
        const posts = _data?.posts || [];
        const fb = _data?.fb_insights || {};
        const isMock = _data?.is_mock || false;

        // Calculate KPI from daily insights
        const totalReach = daily.reduce((s, d) => s + (d.reach || 0), 0);
        const totalViews = daily.reduce((s, d) => s + (d.views || 0), 0);
        const totalEngaged = daily.reduce((s, d) => s + (d.accounts_engaged || 0), 0);
        const engagementRate = profile.followers_count
            ? ((totalEngaged / profile.followers_count) * 100).toFixed(1)
            : '0.0';

        app.innerHTML = `
        <div class="social-dashboard">
            ${isMock ? `
            <div class="social-mock-banner" id="social-mock-banner">
                <i class="ph ph-info"></i>
                <span>Dati di esempio — <a href="#" id="connect-from-banner">Connetti un account reale</a> per visualizzare le tue analytics.</span>
                <button class="btn btn-ghost btn-sm" id="close-mock-banner" type="button"><i class="ph ph-x"></i></button>
            </div>` : ''}

            <!-- Header -->
            <div class="social-header">
                <div class="social-profile">
                    <div class="social-avatar">
                        ${profile.profile_picture_url
                ? `<img src="${Utils.escapeHtml(profile.profile_picture_url)}" alt="Profile" class="social-avatar-img">`
                : `<i class="ph ph-instagram-logo" style="font-size:32px;"></i>`
            }
                    </div>
                    <div class="social-profile-info">
                        <h1 class="social-page-title">
                            <i class="ph ph-chart-line-up"></i> Social Analytics
                        </h1>
                        <p class="social-profile-handle">
                            @${Utils.escapeHtml(profile.username || 'fusionteamvolley')}
                            ${profile.followers_count ? ` · ${_formatNumber(profile.followers_count)} follower` : ''}
                        </p>
                    </div>
                </div>
                <div class="social-actions">
                    <div class="social-period-selector" id="period-selector">
                        <button class="period-btn ${_selectedPeriod === 7 ? 'active' : ''}" data-days="7">7gg</button>
                        <button class="period-btn ${_selectedPeriod === 14 ? 'active' : ''}" data-days="14">14gg</button>
                        <button class="period-btn ${_selectedPeriod === 28 ? 'active' : ''}" data-days="28">28gg</button>
                        <button class="period-btn ${_selectedPeriod === 90 ? 'active' : ''}" data-days="90">90gg</button>
                    </div>
                    ${!isMock ? `
                    <button class="btn btn-ghost btn-sm" id="btn-disconnect-meta" type="button" title="Disconnetti account">
                        <i class="ph ph-plug-charging" style="color:var(--color-pink);"></i>
                    </button>` : ''}
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="social-kpi-grid">
                <div class="social-kpi-card social-kpi-followers">
                    <div class="social-kpi-icon"><i class="ph ph-users"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value" id="kpi-followers">${_formatNumber(profile.followers_count || 0)}</span>
                        <span class="social-kpi-label">Follower</span>
                    </div>
                </div>
                <div class="social-kpi-card social-kpi-views">
                    <div class="social-kpi-icon"><i class="ph ph-eye"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value" id="kpi-views">${_formatNumber(totalViews)}</span>
                        <span class="social-kpi-label">Views (${_selectedPeriod}gg)</span>
                    </div>
                </div>
                <div class="social-kpi-card social-kpi-reach">
                    <div class="social-kpi-icon"><i class="ph ph-broadcast"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value" id="kpi-reach">${_formatNumber(totalReach)}</span>
                        <span class="social-kpi-label">Reach (${_selectedPeriod}gg)</span>
                    </div>
                </div>
                <div class="social-kpi-card social-kpi-engagement">
                    <div class="social-kpi-icon"><i class="ph ph-heart"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value" id="kpi-engagement">${engagementRate}%</span>
                        <span class="social-kpi-label">Engagement Rate</span>
                    </div>
                </div>
            </div>

            <!-- Chart -->
            <div class="social-chart-card">
                <div class="social-chart-header">
                    <h3><i class="ph ph-chart-line"></i> Andamento</h3>
                    <div class="social-chart-legend">
                        <span class="legend-dot legend-views"></span> Views
                        <span class="legend-dot legend-reach" style="margin-left:16px;"></span> Reach
                    </div>
                </div>
                <div class="social-chart-container">
                    <canvas id="social-chart" width="800" height="280"></canvas>
                </div>
            </div>

            <!-- Facebook Quick Stats -->
            <div class="social-fb-section">
                <h3 class="social-section-title"><i class="ph ph-facebook-logo" style="color:#1877F2;"></i> Facebook Page</h3>
                <div class="social-fb-grid">
                    <div class="social-fb-stat">
                        <span class="social-fb-value">${_formatNumber(fb.page_fans || 0)}</span>
                        <span class="social-fb-label">Fan Pagina</span>
                    </div>
                    <div class="social-fb-stat">
                        <span class="social-fb-value">${_formatNumber(fb.page_views || 0)}</span>
                        <span class="social-fb-label">Visite Pagina</span>
                    </div>
                    <div class="social-fb-stat">
                        <span class="social-fb-value">${_formatNumber(fb.engaged_users || 0)}</span>
                        <span class="social-fb-label">Utenti coinvolti</span>
                    </div>
                    <div class="social-fb-stat">
                        <span class="social-fb-value">${_formatNumber(fb.post_engagements || 0)}</span>
                        <span class="social-fb-label">Interazioni post</span>
                    </div>
                </div>
            </div>

            <!-- Posts Grid -->
            <div class="social-posts-section">
                <h3 class="social-section-title"><i class="ph ph-images"></i> Ultimi Post</h3>
                <div class="social-posts-grid" id="social-posts-grid">
                    ${posts.map(p => _renderPostCard(p)).join('')}
                </div>
            </div>
        </div>`;

        // Wire up events
        _bindEvents();

        // Draw chart
        setTimeout(() => _drawChart(daily), 100);
    }

    // ─── POST CARD ───────────────────────────────────────────────────────────

    function _renderPostCard(post) {
        const insights = post.insights || {};
        const date = post.timestamp ? new Date(post.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '';
        const caption = post.caption ? Utils.escapeHtml(post.caption.substring(0, 80)) + (post.caption.length > 80 ? '…' : '') : '';
        const typeIcon = {
            'IMAGE': 'image',
            'VIDEO': 'video-camera',
            'CAROUSEL_ALBUM': 'images',
            'REEL': 'film-reel',
        }[post.media_type] || 'image';

        return `
        <a href="${Utils.escapeHtml(post.permalink || '#')}" target="_blank" rel="noopener" class="social-post-card">
            <div class="social-post-thumb">
                ${post.media_url || post.thumbnail_url
                ? `<img src="${Utils.escapeHtml(post.thumbnail_url || post.media_url)}" alt="" loading="lazy">`
                : `<div class="social-post-placeholder"><i class="ph ph-${typeIcon}" style="font-size:32px;"></i></div>`
            }
                <span class="social-post-type"><i class="ph ph-${typeIcon}"></i></span>
            </div>
            <div class="social-post-meta">
                <div class="social-post-stats">
                    <span><i class="ph ph-eye"></i> ${_formatNumber(insights.views || 0)}</span>
                    <span><i class="ph ph-heart"></i> ${_formatNumber(insights.likes || post.like_count || 0)}</span>
                    <span><i class="ph ph-chat-circle"></i> ${_formatNumber(insights.comments || post.comments_count || 0)}</span>
                    ${insights.shares ? `<span><i class="ph ph-share-fat"></i> ${_formatNumber(insights.shares)}</span>` : ''}
                </div>
                <p class="social-post-caption">${caption}</p>
                <span class="social-post-date">${date}</span>
            </div>
        </a>`;
    }

    // ─── CHART (Canvas-based, no libraries) ──────────────────────────────────

    function _drawChart(dailyData) {
        const canvas = document.getElementById('social-chart');
        if (!canvas) return;
        _chartCanvas = canvas;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size for HiDPI
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 280 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '280px';
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = 280;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartW = W - padding.left - padding.right;
        const chartH = H - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, W, H);

        if (!dailyData || dailyData.length < 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Dati insufficienti per il grafico', W / 2, H / 2);
            return;
        }

        const views = dailyData.map(d => d.views || 0);
        const reach = dailyData.map(d => d.reach || 0);
        const dates = dailyData.map(d => d.date);
        const maxVal = Math.max(...views, ...reach, 1);

        const xStep = chartW / (dailyData.length - 1);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(W - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            const val = Math.round(maxVal - (maxVal / 4) * i);
            ctx.fillText(_formatNumber(val), padding.left - 8, y + 4);
        }

        // X-axis labels (show every Nth date)
        const labelInterval = Math.max(1, Math.floor(dailyData.length / 7));
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < dailyData.length; i += labelInterval) {
            const x = padding.left + i * xStep;
            const d = new Date(dates[i]);
            ctx.fillText(`${d.getDate()}/${d.getMonth() + 1}`, x, H - 8);
        }

        // Draw area + line for Views
        _drawLine(ctx, views, maxVal, padding, chartH, xStep, '#E6007E', 'rgba(230,0,126,0.15)');

        // Draw area + line for Reach
        _drawLine(ctx, reach, maxVal, padding, chartH, xStep, '#00E676', 'rgba(0,230,118,0.10)');

        // Draw dots for Views
        _drawDots(ctx, views, maxVal, padding, chartH, xStep, '#E6007E');

        // Draw dots for Reach
        _drawDots(ctx, reach, maxVal, padding, chartH, xStep, '#00E676');
    }

    function _drawLine(ctx, data, maxVal, padding, chartH, xStep, color, fillColor) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';

        for (let i = 0; i < data.length; i++) {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - (data[i] / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill area
        ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    function _drawDots(ctx, data, maxVal, padding, chartH, xStep, color) {
        // Only show dots if there are < 60 data points
        if (data.length > 60) return;

        for (let i = 0; i < data.length; i++) {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - (data[i] / maxVal) * chartH;

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // ─── EVENT BINDING ───────────────────────────────────────────────────────

    function _bindEvents() {
        // Period selector
        document.getElementById('period-selector')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.period-btn');
            if (!btn) return;

            const days = parseInt(btn.dataset.days, 10);
            if (days === _selectedPeriod) return;

            _selectedPeriod = days;

            // Re-fetch with new period
            try {
                _data = await Store.get('insights', 'social', { days });
                _renderDashboard(document.getElementById('app'));
            } catch (err) {
                UI.toast('Errore nel caricamento dati', 'error');
            }
        });

        // Disconnect
        document.getElementById('btn-disconnect-meta')?.addEventListener('click', () => {
            UI.confirm('Vuoi disconnettere il tuo account Meta? Le analytics non saranno più disponibili.', async () => {
                try {
                    await Store.api('disconnect', 'social');
                    _connected = false;
                    UI.toast('Account Meta disconnesso', 'info');
                    _renderConnectScreen(document.getElementById('app'));
                } catch (err) {
                    UI.toast('Errore nella disconnessione', 'error');
                }
            });
        });

        // Mock banner
        document.getElementById('close-mock-banner')?.addEventListener('click', () => {
            document.getElementById('social-mock-banner')?.remove();
        });
        document.getElementById('connect-from-banner')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'api/router.php?module=social&action=connect';
        });

        // Resize chart on window resize
        const resizeHandler = () => {
            if (_data?.daily_insights) _drawChart(_data.daily_insights);
        };
        window.addEventListener('resize', resizeHandler, { signal: _ac.signal });
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    function _formatNumber(n) {
        if (n === null || n === undefined) return '0';
        n = parseInt(n, 10);
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString('it-IT');
    }

    function destroy() {
        _ac.abort();
        _data = null;
        _chartCanvas = null;
    }

    return { init, destroy };
})();
window.Social = Social;
