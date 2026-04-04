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
  
  const resultId = `vald-ai-${isDx ? 'diagnosis' : 'plan'}-result-${athleteId}`;
  const otherResultId = `vald-ai-${isDx ? 'plan' : 'diagnosis'}-result-${athleteId}`;
  const resultEl = document.getElementById(resultId);
  const otherResultEl = document.getElementById(otherResultId);
  const placeholder = document.getElementById("ai-empty-placeholder");
  
  if (!resultEl) return;

  // Hide placeholder and other result to focus on current
  if (placeholder) placeholder.style.display = "none";
  if (otherResultEl) otherResultEl.style.display = "none";

  // Invalidate cache to ensure fresh data
  Store.invalidate("aiAnalysis/vald");

  resultEl.style.display = "block";
  resultEl.innerHTML = `
    <div style="padding:40px; text-align:center; opacity:0.6;">
        <i class="ph ph-sparkle animate-pulse" style="font-size:32px; color:var(--color-pink); margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;"></i>
        <div style="font-size:11px; letter-spacing:2px; font-weight:800; text-transform:uppercase;">Generazione ${label}...</div>
    </div>
  `;

  try {
    const data = await Store.get("aiAnalysis", "vald", { athleteId, part: isDx ? 'diagnosis' : 'plan' });
    const text = (data?.text || "Nessuna risposta ricevuta.")
      .replace(/^(DIAGNOSI|PIANO\s+DI\s+INTERVENTO|PIANO)\s*:\s*/i, "")
      .trim();

    const chatId = `vald-chat-${typeClass}-${athleteId}`;
    const textId = `vald-text-${typeClass}-${athleteId}`;

    resultEl.innerHTML = `
      <div class="ai-card ${typeClass}" style="border:none; background:transparent; box-shadow:none; padding:0; animation:none;">
        <div class="ai-card-title" style="margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
          <i class="ph ${icon}" style="font-size:18px;"></i> 
          <span style="font-size:13px; font-weight:800; letter-spacing:1px;">${label.toUpperCase()}</span>
          <span style="margin-left:auto; font-weight:400; font-size:9px; opacity:0.3; letter-spacing:1px;">AI CORE • GEMINI 2.5</span>
        </div>
        
        <div class="ai-card-body" id="${textId}" style="font-size:14px; color:rgba(255,255,255,0.8);">
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
    resultEl.innerHTML = `<div class="error-box" style="margin-top:20px;">${err.message}</div>`;
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
  const context = textEl ? textEl.innerText.slice(0, 1000) : "";

  input.value = "";
  input.disabled = true;

  // Push User message
  const userMsg = document.createElement("div");
  userMsg.className = "chat-bubble user";
  userMsg.innerHTML = `<span style="font-size:10px; opacity:0.4; display:block; margin-bottom:4px;">Tu</span>${question}`;
  history.appendChild(userMsg);
  history.scrollTop = history.scrollHeight;

  // Push AI placeholder
  const aiMsg = document.createElement("div");
  aiMsg.className = "chat-bubble ai";
  aiMsg.innerHTML = `<span style="font-size:10px; opacity:0.4; display:block; margin-bottom:4px;">Assistant</span><i class="ph ph-circle-notch animate-spin"></i> Elaborazione...`;
  history.appendChild(aiMsg);
  history.scrollTop = history.scrollHeight;

  try {
    const resp = await Store.api("aiChat", "vald", { athleteId, question, context });
    aiMsg.innerHTML = `<span style="font-size:10px; opacity:0.4; display:block; margin-bottom:4px;">Assistant</span>${resp?.answer || "Spiacente, non ho potuto rispondere."}`;
  } catch (err) {
    aiMsg.classList.add("text-danger");
    aiMsg.innerHTML = `<span style="font-size:10px; opacity:0.4; display:block; margin-bottom:4px;">Assistant</span>Errore: ${err.message}`;
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
  
  // Replace tables with premium styling
  md = md.replace(/\|(.+)\|/g, (match) => {
    const rows = match.split('\n').filter(r => r.trim());
    let html = '<div class="table-container" style="margin:16px 0; border:1px solid rgba(255,255,255,0.05); border-radius:8px; overflow:hidden;"><table style="width:100%; border-collapse:collapse; font-size:12px;">';
    rows.forEach((row, i) => {
      if (row.includes('---')) return;
      const cols = row.split('|').filter(c => c.trim() !== "");
      const isHeader = i === 0;
      html += `<tr style="${isHeader ? 'background:rgba(255,255,255,0.03);' : 'border-top:1px solid rgba(255,255,255,0.03);'}">`;
      html += cols.map(c => `<td style="padding:10px; ${isHeader ? 'font-weight:800; color:var(--color-pink); text-transform:uppercase; font-size:10px;' : ''}">${c.trim()}</td>`).join('');
      html += '</tr>';
    });
    return html + '</table></div>';
  });

  // Basic formatting with premium iconography
  return md
    .split("\n\n")
    .map(p => {
      if (p.trim().startsWith("-") || p.trim().startsWith("*")) {
        const items = p.split("\n").map(li => `
          <li style="list-style:none; padding-left:24px; position:relative; margin-bottom:12px;">
            <i class="ph ph-caret-right" style="position:absolute; left:0; top:4px; font-size:12px; color:var(--accent-cyan);"></i>
            ${li.replace(/^[-*]\s+/, "")}
          </li>`).join("");
        return `<ul style="margin:16px 0; padding:0;">${items}</ul>`;
      }
      return `<p style="margin-bottom:16px; line-height:1.6;">${p.trim()}</p>`;
    })
    .join("");
}
