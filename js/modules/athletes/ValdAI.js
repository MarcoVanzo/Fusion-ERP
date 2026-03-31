"use strict";

/**
 * ValdAI.js — Gestione interazione AI per VALD
 * Supporta layout verticale, risposte non troncate e chat interattiva.
 */

window.__valdAi = async function (athleteId, part) {
  const isDx = part === "diagnosis" || part === "dx";
  const label = isDx ? "Analisi Stato di Forma" : "Piano di Intervento";
  const typeClass = isDx ? "diagnosis" : "plan";
  const icon = isDx ? "ph-brain" : "ph-barbell";
  
  // IDs fixed to match AthletesMetrics.js structure
  const resultId = `vald-ai-${isDx ? 'diagnosis' : 'plan'}-result-${athleteId}`;
  const btnId = `vald-ai-${isDx ? 'dx' : 'pl'}-btn-${athleteId}`;
  
  const btn = document.getElementById(btnId);
  const resultEl = document.getElementById(resultId);
  
  if (!resultEl) return;
  if (btn && btn.disabled) return;

  // Invalidate cache to ensure fresh data
  Store.invalidate("aiAnalysis/vald");

  // UI Processing State
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i> Elaborazione...`;
  }
  
  resultEl.style.display = "block";
  resultEl.innerHTML = `<div class="ai-loader" style="padding: 20px; font-size: 13px; opacity: 0.6;">Generazione ${label} in corso...</div>`;

  try {
    const data = await Store.get("aiAnalysis", "vald", { athleteId, part: isDx ? 'diagnosis' : 'plan' });
    const text = (data?.text || "Nessuna risposta ricevuta.")
      .replace(/^(DIAGNOSI|PIANO\s+DI\s+INTERVENTO|PIANO)\s*:\s*/i, "")
      .trim();

    const chatId = `vald-chat-${typeClass}-${athleteId}`;
    const textId = `vald-text-${typeClass}-${athleteId}`;

    resultEl.innerHTML = `
      <div class="ai-card ${typeClass}">
        <div class="ai-card-title">
          <i class="ph ${icon}"></i> 
          <span>${label}</span>
          <span style="margin-left:auto; font-weight:400; opacity:0.5;">AI • Gemini 2.5</span>
        </div>
        
        <div class="ai-card-body" id="${textId}">
          ${renderAiMarkdown(text)}
        </div>

        <!-- Section: Interrogazione AI (Follow-up) -->
        <div class="ai-chat-area">
          <div id="${chatId}-history" class="ai-chat-history"></div>
          
          <div class="ai-chat-input-row">
            <input id="${chatId}-input" type="text" 
                   placeholder="Fai una domanda specifica su questo atleta..." 
                   onkeydown="if(event.key==='Enter') window.__valdChat('${athleteId}', '${typeClass}')">
            
            <button class="ai-chat-send-btn" onclick="window.__valdChat('${athleteId}', '${typeClass}')">
              <i class="ph ph-paper-plane-tilt"></i> Invia
            </button>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    resultEl.innerHTML = `<div class="error-box">${err.message}</div>`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="ph ${icon}"></i> ${label}`;
    }
  }
};

/**
 * Handle follow-up chat questions
 */
window.__valdChat = async function (athleteId, typeClass) {
  const chatId = `vald-chat-${typeClass}-${athleteId}`;
  const input = document.getElementById(`${chatId}-input`);
  const history = document.getElementById(`${chatId}-history`);
  if (!input || !history) return;

  const question = input.value.trim();
  if (!question) return;

  // Context: current analysis text
  const textEl = document.getElementById(`vald-text-${typeClass}-${athleteId}`);
  const context = textEl ? textEl.innerText.slice(0, 800) : "";

  input.value = "";
  input.disabled = true;

  // Push User message
  const userMsg = document.createElement("div");
  userMsg.className = "chat-bubble user";
  userMsg.textContent = question;
  history.appendChild(userMsg);
  history.scrollTop = history.scrollHeight;

  // Push AI placeholder
  const aiMsg = document.createElement("div");
  aiMsg.className = "chat-bubble ai";
  aiMsg.textContent = "Elaborazione...";
  history.appendChild(aiMsg);
  history.scrollTop = history.scrollHeight;

  try {
    const resp = await Store.api("aiChat", "vald", { athleteId, question, context });
    aiMsg.textContent = resp?.answer || "Spiacente, non ho potuto rispondere.";
  } catch (err) {
    aiMsg.classList.add("text-danger");
    aiMsg.textContent = "Errore: " + err.message;
  } finally {
    input.disabled = false;
    input.focus();
    history.scrollTop = history.scrollHeight;
  }
};

/**
 * Simple markdown helper for AI responses
 */
function renderAiMarkdown(md) {
  if (!md) return "";
  
  // Replace tables
  md = md.replace(/\|(.+)\|/g, (match) => {
    const rows = match.split('\n').filter(r => r.trim());
    let html = '<div class="table-container"><table>';
    rows.forEach((row, i) => {
      if (row.includes('---')) return;
      const cols = row.split('|').filter(c => c.trim() !== "");
      html += '<tr>' + cols.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });
    return html + '</table></div>';
  });

  // Basic formatting
  return md
    .split("\n\n")
    .map(p => {
      if (p.trim().startsWith("-") || p.trim().startsWith("*")) {
        const items = p.split("\n").map(li => `<li>${li.replace(/^[-*]\s+/, "")}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${p.trim()}</p>`;
    })
    .join("");
}
