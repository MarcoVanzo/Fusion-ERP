/**
 * Results View Module
 * Fusion ERP v1.1
 */

const ResultsView = {
    skeleton: () => `
        <div class="transport-dashboard" style="min-height:100vh; padding: 24px;">
            <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div class="dash-title">🏐 Risultati</div>
                    <div class="dash-subtitle" style="margin-top:4px;">Portale Federale Pallavolo</div>
                </div>
                <div class="res-toolbar">
                    <div id="res-champ-dropdown" class="res-champ-dropdown">
                        <div class="res-champ-trigger" id="res-champ-trigger">
                            <span class="res-champ-label">Caricamento campionati...</span>
                            <i class="ph ph-caret-down res-champ-arrow"></i>
                        </div>
                    </div>
                    <button class="btn-dash" id="res-sync-btn" title="Sincronizza"><i class="ph ph-cloud-arrow-down"></i></button>
                    <button class="btn-dash" id="res-refresh-btn" title="Aggiorna"><i class="ph ph-arrows-clockwise"></i></button>
                    <button class="btn-dash" id="res-manage-btn" title="Gestisci"><i class="ph ph-gear"></i></button>
                </div>
            </div>
            
            <div class="res-view-selector" style="display:flex; gap:10px; margin-bottom:24px;">
                <button class="res-view-btn active" data-view="matches">PARTITE</button>
                <button class="res-view-btn" data-view="standings">CLASSIFICA</button>
            </div>

            <div id="res-content"></div>
        </div>
    `,

    loading: () => `
        <div class="res-loading-grid">
            ${Array.from({ length: 6 }, () => `
                <div class="res-skel-card">
                    <div class="skeleton skeleton-text" style="width:60%;"></div>
                    <div style="display:flex;gap:12px;align-items:center;">
                        <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>
                        <div class="skeleton skeleton-title" style="width:50px;"></div>
                        <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `,

    champTrigger: (champ) => {
        const logo = champ?.has_our_team ? '<img class="res-champ-fusion-logo" src="/assets/logo-colorato.png" alt="Fusion">' : '';
        return `${logo}<span class="res-champ-label">${Utils.escapeHtml(champ?.label || 'Seleziona')}</span><i class="ph ph-caret-down res-champ-arrow"></i>`;
    },

    champOption: (champ, isActive) => {
        const logo = champ?.has_our_team ? '<img class="res-champ-fusion-logo" src="/assets/logo-colorato.png" alt="Fusion">' : '';
        return `
            <div class="res-champ-option ${isActive ? 'active' : ''}" 
                 data-id="${champ.id}" 
                 data-url="${champ.url || ''}" 
                 data-label="${Utils.escapeHtml(champ.label)}">
                ${logo}<span>${Utils.escapeHtml(champ.label)}</span>
            </div>
        `;
    },

    matchesList: (matches, lastUpdated, sourceUrl) => {
        if (!matches || matches.length === 0) return ResultsView.emptyState('Nessuna partita', 'Non ci sono partite disponibili.');

        const groups = {};
        let latestPlayedRound = null;
        let maxRoundNum = -1;

        matches.forEach(m => {
            const round = m.round || 'Altre';
            if (m.status === 'played' && round !== 'Altre') {
                const num = parseInt(round);
                if (!isNaN(num) && num > maxRoundNum) {
                    maxRoundNum = num;
                    latestPlayedRound = round;
                }
            }
            if (!groups[round]) groups[round] = [];
            groups[round].push(m);
        });

        const sortedRounds = Object.keys(groups).sort((a, b) => {
            if (a === 'Altre') return 1;
            if (b === 'Altre') return -1;
            return parseInt(a) - parseInt(b);
        });

        let html = '';
        sortedRounds.forEach((round, _idx) => {
            const isLatest = round === latestPlayedRound;
            const label = round === 'Altre' ? 'Partite senza giornata' : `Giornata ${round}`;
            html += `
                <div ${isLatest ? 'id="res-last-played-round"' : ''} class="res-round-header">
                    <i class="ph ph-calendar-blank"></i> ${label}
                </div>
                <div class="res-grid">${groups[round].map(m => ResultsView.matchCard(m)).join('')}</div>
            `;
        });

        if (lastUpdated) {
            html += ResultsView.footer(lastUpdated, sourceUrl);
        }

        return html;
    },

    matchCard: (match) => {
        const isOur = match.is_our_team;
        const statusBadge = ResultsView._getStatusBadge(match.status);
        const ourBadge = isOur ? '<span class="res-badge our-match"><i class="ph ph-star-four"></i> Noi</span>' : '';
        
        const homeClass = ResultsView._isSocietyTeam(match.home) ? 'res-team-name our-name' : 'res-team-name';
        const awayClass = ResultsView._isSocietyTeam(match.away) ? 'res-team-name our-name' : 'res-team-name';
        
        const scoreHtml = (match.status === 'played' && match.score)
            ? `<div class="res-score">${match.home_score ?? ''}</div><div class="res-time-label">-</div><div class="res-score">${match.away_score ?? ''}</div>`
            : '<div class="res-score vs">vs</div>';

        const dateStr = match.date ? `${match.date}${match.time ? ' · ' + match.time : ''}` : (match.time || '—');

        return `
            <div class="res-card ${isOur ? 'our-team' : ''}">
                <div class="res-card-top">
                    <span>${Utils.escapeHtml(dateStr)}</span>
                    <span>${statusBadge}${ourBadge}</span>
                </div>
                <div class="res-teams">
                    <div class="res-team">
                        ${match.home_logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(match.home_logo)}" alt="">` : ''}
                        <div class="${homeClass}">${Utils.escapeHtml(match.home || 'Casa')}</div>
                    </div>
                    <div class="res-score-block">${scoreHtml}</div>
                    <div class="res-team away">
                        <div class="${awayClass}">${Utils.escapeHtml(match.away || 'Ospite')}</div>
                        ${match.away_logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(match.away_logo)}" alt="">` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    standingsTable: (standings, lastUpdated, sourceUrl) => {
        if (!standings || standings.length === 0) return ResultsView.emptyState('Classifica non disponibile', 'Dati non ancora sincronizzati.');

        const medals = ['🥇', '🥈', '🥉'];
        
        return `
            <div class="res-table-wrap">
                <table class="res-table">
                    <thead>
                        <tr>
                            <th class="center" style="width:50px;">#</th>
                            <th>Squadra</th>
                            <th class="center">PG</th>
                            <th class="center">V</th>
                            <th class="center">P</th>
                            <th class="center">Punti</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.map((s, idx) => {
                            const pos = s.position ?? (idx + 1);
                            const isOur = s.is_our_team;
                            return `
                                <tr class="${isOur ? 'our-row' : ''}">
                                    <td class="center">
                                        ${pos <= 3 ? `<span class="pos-medal">${medals[pos-1]}</span>` : `<span class="res-pos">${pos}</span>`}
                                    </td>
                                    <td>
                                        <div class="res-team-cell">
                                            ${s.logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(s.logo)}" alt="">` : ''}
                                            ${isOur ? '<div class="res-team-dot"></div>' : ''}
                                            <span style="${isOur ? 'color:var(--color-pink);font-weight:700;' : ''}">${Utils.escapeHtml(s.team || '—')}</span>
                                        </div>
                                    </td>
                                    <td class="center">${s.played ?? '—'}</td>
                                    <td class="center" style="color:#4caf50;">${s.won ?? '—'}</td>
                                    <td class="center" style="color:#ef5350;">${s.lost ?? '—'}</td>
                                    <td class="center"><strong>${s.points ?? '—'}</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${lastUpdated ? ResultsView.footer(lastUpdated, sourceUrl) : ''}
        `;
    },

    emptyState: (title, sub) => `
        <div class="res-empty">
            <i class="ph ph-volleyball"></i>
            <div class="res-empty-title">${Utils.escapeHtml(title)}</div>
            <div class="res-empty-sub">${Utils.escapeHtml(sub)}</div>
        </div>
    `,

    needsSync: () => `
        <div class="res-empty">
            <i class="ph ph-cloud-arrow-down" style="color:var(--color-pink);opacity:1;"></i>
            <div class="res-empty-title">Dati non sincronizzati</div>
            <div class="res-empty-sub">Premi il bottone <strong>☁ Sincronizza</strong> per caricare i dati dal portale.</div>
            <button class="btn-dash pink" id="res-sync-now-btn" style="margin-top:12px;">
                <i class="ph ph-cloud-arrow-down"></i> Sincronizza ora
            </button>
        </div>
    `,

    footer: (lastUpdated, sourceUrl) => {
        const date = new Date(lastUpdated).toLocaleString('it-IT');
        let hostname = 'portale federale';
        try { if(sourceUrl) hostname = new URL(sourceUrl).hostname; } catch(_e){}
        
        return `
            <div class="res-last-update">
                Aggiornato: ${date} ${sourceUrl ? ` &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(sourceUrl)}" target="_blank">${Utils.escapeHtml(hostname)}</a>` : ''}
            </div>
        `;
    },

    manageModal: (campionati) => `
        <div class="res-modal-section">
            <div class="res-modal-section-title">Aggiungi campionato</div>
            <div class="res-form-row">
                <label class="res-form-label">Nome campionato</label>
                <input type="text" id="res-new-label" class="res-form-input" placeholder="es. Serie C Femminile Girone B">
            </div>
            <div class="res-form-row">
                <label class="res-form-label">URL del portale (calendario/risultati)</label>
                <input type="url" id="res-new-url" class="res-form-input" placeholder="https://venezia.portalefipav.net/...">
            </div>
            <button class="btn-dash pink" id="res-modal-add-btn"><i class="ph ph-plus"></i> Aggiungi e Sincronizza</button>
        </div>
        <div class="res-modal-section">
            <div class="res-modal-section-title">Campionati configurati</div>
            <div class="res-campionato-list">
                ${campionati.map(c => `
                    <div class="res-campionato-item">
                        <div style="flex:1;min-width:0;">
                            <div class="res-campionato-item-label">${Utils.escapeHtml(c.label)}</div>
                        </div>
                        <button class="res-del-btn" data-delete-champ="${c.id}" data-label="${Utils.escapeHtml(c.label)}">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                `).join('') || '<div class="res-empty-sub">Nessun campionato configurato.</div>'}
            </div>
        </div>
    `,

    _getStatusBadge: (status) => {
        switch(status) {
            case 'live': return '<span class="res-badge live"><i class="ph ph-circle"></i> Live</span>';
            case 'played': return '<span class="res-badge played"><i class="ph ph-check-circle"></i> Giocata</span>';
            case 'unknown': return '<span class="res-badge unknown"><i class="ph ph-question"></i> Da omologare</span>';
            default: return '<span class="res-badge scheduled"><i class="ph ph-clock"></i> In programma</span>';
        }
    },

    _isSocietyTeam: (name) => {
        if(!name) return false;
        const s = name.toLowerCase();
        return !/a\.?\s?p\.?\s?v\.?/i.test(s) && ["fusion", "team volley", "fusionteam"].some(e => s.includes(e));
    }
};

export default ResultsView;
