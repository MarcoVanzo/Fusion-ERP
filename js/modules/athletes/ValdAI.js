"use strict";

/**
 * ValdAI.js
 * Modulo delegato alla gestione dell'intelligenza artificiale per le metriche VALD.
 * Scorporato dal monolite athletes.js per favorire la leggibilità e l'architettura a moduli.
 */

window.__valdAi = async function (athleteId, part) {
  const label =
    part === "plan" ? "Piano di Intervento" : "Analisi Stato di Forma";
  const color =
    part === "plan" ? "rgba(0,200,140,0.9)" : "rgba(150,130,255,0.9)";
  const bg = part === "plan" ? "rgba(0,180,120,0.07)" : "rgba(100,80,255,0.07)";
  const border =
    part === "plan" ? "rgba(0,180,120,0.25)" : "rgba(100,80,255,0.25)";
  const icon = part === "plan" ? "ph-barbell" : "ph-brain";
  // Each part has its own result container so both can show simultaneously
  const resultId = "vald-ai-" + part + "-result-" + athleteId;
  const btnId =
    (part === "plan" ? "vald-ai-pl-btn-" : "vald-ai-dx-btn-") + athleteId;
  const btn = document.getElementById(btnId);
  if (btn && btn.disabled) return; // Prevent double-triggering during processing
  
  let resultEl = document.getElementById(resultId);

  // Create slot if missing
  const section = document.getElementById("vald-ai-section-" + athleteId);
  if (!resultEl && section) {
    resultEl = document.createElement("div");
    resultEl.id = resultId;
    section.appendChild(resultEl);
  }
  if (!resultEl) return;

  // Always invalidate cache before calling AI — prevents stale error responses
  Store.invalidate("aiAnalysis/vald");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Elaborazione AI\u2026";
  }
  resultEl.style.display = "block";
  resultEl.innerHTML =
    '<div style="font-size:12px;color:var(--color-text-muted);padding:8px 0;">AI in elaborazione\u2026 (15-25s)</div>';

  try {
    const data = await Store.get("aiAnalysis", "vald", { athleteId, part });
    const raw = data && data.text ? data.text : "Nessuna risposta AI.";
    const text = raw
      .replace(/^(DIAGNOSI|PIANO\s+DI\s+INTERVENTO|PIANO)\s*:\s*/i, "")
      .replace(/\*+/g, "") // strip markdown asterisks (bold/italic)
      .trim();

    const chatId = "vald-chat-" + part + "-" + athleteId;

    // Mini markdown renderer: tables, headings, lists, plain text
    function renderAiMarkdown(md) {
      const lines = md.split("\n");
      let html = "";
      let inList = false;
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        // Markdown table: detect block of lines containing |
        if (line.trim().startsWith("|")) {
          // close any open list
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          // collect table rows
          const tRows = [];
          while (i < lines.length && lines[i].trim().startsWith("|")) {
            const row = lines[i]
              .trim()
              .replace(/^\||\|$/g, "")
              .split("|")
              .map((c) => c.trim());
            // skip separator rows (----)
            if (!row.every((c) => /^[-: ]+$/.test(c))) tRows.push(row);
            i++;
          }
          if (tRows.length) {
            html +=
              '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;margin:6px 0;">';
            tRows.forEach((row, ri) => {
              const tag = ri === 0 ? "th" : "td";
              html +=
                "<tr>" +
                row
                  .map(
                    (c) =>
                      `<${tag} style="border:1px solid ${border};padding:4px 8px;text-align:left;${ri === 0 ? "background:rgba(255,255,255,0.05);font-weight:600;" : ""}">${Utils.escapeHtml(c)}</${tag}>`,
                  )
                  .join("") +
                "</tr>";
            });
            html += "</table></div>";
          }
          continue;
        }
        // Heading ## or ###
        if (/^#{1,3}\s/.test(line)) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          const txt = line.replace(/^#{1,3}\s/, "");
          html += `<div style="font-weight:700;margin:8px 0 3px;font-size:13px;">${Utils.escapeHtml(txt)}</div>`;
          i++;
          continue;
        }
        // Bullet / numbered list
        if (/^[-•*]\s|^\d+\.\s/.test(line.trim())) {
          if (!inList) {
            html +=
              '<ul style="margin:4px 0 4px 16px;padding:0;list-style:disc;">';
            inList = true;
          }
          const txt = line.replace(/^[-•*]\s|^\d+\.\s/, "");
          html += `<li style="margin:2px 0;font-size:13px;line-height:1.55;">${Utils.escapeHtml(txt)}</li>`;
          i++;
          continue;
        }
        // Empty line
        if (line.trim() === "") {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += "<br>";
          i++;
          continue;
        }
        // Normal paragraph line
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += `<span style="font-size:13px;line-height:1.65;word-break:break-word;overflow-wrap:break-word;">${Utils.escapeHtml(line)}</span><br>`;
        i++;
      }
      if (inList) html += "</ul>";
      return html;
    }

    resultEl.innerHTML =
      '<div style="background:' +
      bg +
      ";border:1px solid " +
      border +
      ';border-radius:var(--radius);padding:var(--sp-2) var(--sp-3);margin-top:var(--sp-1);">' +
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:' +
      color +
      ';margin-bottom:6px;">' +
      '<i class="ph ' +
      icon +
      '" style="margin-right:4px;"></i>' +
      label +
      ' <span style="font-size:9px;opacity:0.7;">AI \u00b7 Gemini</span>' +
      "</div>" +
      '<div id="vald-ai-' +
      part +
      "-text-" +
      athleteId +
      '" style="color:var(--color-text);margin:0 0 10px;word-break:break-word;overflow-wrap:break-word;">' +
      renderAiMarkdown(text) +
      "</div>" +
      // Chat section
      '<div id="' +
      chatId +
      '" style="border-top:1px solid ' +
      border +
      ';padding-top:8px;margin-top:4px;">' +
      '<div id="' +
      chatId +
      '-history" style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;margin-bottom:8px;"></div>' +
      '<div style="display:flex;gap:6px;align-items:center;">' +
      '<input id="' +
      chatId +
      '-input" type="text" placeholder="Chiedi al preparatore AI\u2026" style="flex:1;font-size:12px;padding:6px 10px;border-radius:var(--radius);border:1px solid ' +
      border +
      ';background:rgba(255,255,255,0.04);color:var(--color-text);outline:none;" ' +
      "onkeydown=\"if(event.key==='Enter')window.__valdChat('" +
      athleteId +
      "','" +
      part +
      "');\">" +
      '<button type="button" onclick="window.__valdChat(\'' +
      athleteId +
      "','" +
      part +
      '\');" style="padding:6px 12px;font-size:12px;border-radius:var(--radius);border:1px solid ' +
      border +
      ";background:" +
      bg +
      ";color:" +
      color +
      ';cursor:pointer;white-space:nowrap;">' +
      '<i class="ph ph-paper-plane-tilt"></i> Invia</button>' +
      "</div></div>" +
      "</div>";
  } catch (err) {
    resultEl.innerHTML =
      '<div style="color:var(--color-danger);font-size:12px;">Errore: ' +
      Utils.escapeHtml(err.message) +
      "</div>";
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML =
      part === "plan"
        ? '<i class="ph ph-barbell"></i> Piano di Intervento (AI)'
        : '<i class="ph ph-brain"></i> Analisi Stato di Forma (AI)';
  }
};

// VALD AI Chat — ask follow-up questions
window.__valdChat = async function (athleteId, part) {
  const chatId = "vald-chat-" + part + "-" + athleteId;
  const input = document.getElementById(chatId + "-input");
  const history = document.getElementById(chatId + "-history");
  if (!input || !history) return;

  const question = input.value.trim();
  if (!question) return;

  // Get last AI result as context
  const textEl = document.getElementById(
    "vald-ai-" + part + "-text-" + athleteId,
  );
  const context = textEl ? textEl.textContent.slice(0, 600) : "";

  input.value = "";
  input.disabled = true;

  // User bubble
  const userDiv = document.createElement("div");
  userDiv.style.cssText =
    "background:rgba(255,255,255,0.06);border-radius:8px;padding:6px 10px;font-size:12px;color:var(--color-text);align-self:flex-end;max-width:85%;";
  userDiv.textContent = question;
  history.appendChild(userDiv);

  // AI thinking bubble
  const aiDiv = document.createElement("div");
  aiDiv.style.cssText =
    "background:rgba(100,80,255,0.08);border-radius:8px;padding:6px 10px;font-size:12px;color:var(--color-text-muted);align-self:flex-start;max-width:90%;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;";
  aiDiv.textContent = "Sto elaborando\u2026";
  history.appendChild(aiDiv);
  history.scrollTop = history.scrollHeight;

  try {
    const resp = await Store.api("aiChat", "vald", {
      athleteId,
      question,
      context,
    });
    aiDiv.style.color = "var(--color-text)";
    aiDiv.textContent = resp && resp.answer ? resp.answer : "Nessuna risposta.";
  } catch (err) {
    aiDiv.style.color = "var(--color-danger)";
    aiDiv.textContent = "Errore: " + err.message;
  }

  input.disabled = false;
  input.focus();
  history.scrollTop = history.scrollHeight;
};
