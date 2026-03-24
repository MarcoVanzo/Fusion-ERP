import sys

file_path = "js/modules/athletes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "<!-- DOCUMENTI TAB -->"
end_marker = "</div>\n        </div>\n        \n        `),"

replacement = """<!-- DOCUMENTI TAB -->
          <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">
            <p class="section-label">Matricola e Dati</p>
            <div class="card" style="padding:var(--sp-3);">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
                ${g("Documento d'Identità", r.identity_document)}
                ${g("Codice Fiscale", r.fiscal_code)}
                ${g("Matricola FIPAV", r.federal_id)}
                ${g("Scadenza Cert. Medico", r.medical_cert_expires_at ? Utils.formatDate(r.medical_cert_expires_at) : null, r.medical_cert_expires_at && new Date(r.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}
              </div>
            </div>

            <p class="section-label">Allegati</p>
            <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
              <!-- Contratto -->
              <div class="card" style="padding:var(--sp-3);">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                      <div style="display:flex;align-items:center;gap:10px;">
                          <i class="ph ph-file-pdf" style="font-size:24px;color:var(--color-pink);flex-shrink:0;"></i>
                          <div>
                              <div style="font-size:13px;font-weight:600;">Contratto</div>
                              <div style="font-size:11px;color:var(--color-text-muted);">${r.contract_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.contract_file_path.split('/').pop()) : 'Nessun file caricato'}</div>
                          </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-2);align-items:center;">
                          ${r.contract_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=contract_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}
                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-contract-file-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                          <input type="file" id="upload-contract-file-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}
                      </div>
                  </div>
              </div>
              
              <!-- CI Fronte -->
              <div class="card" style="padding:var(--sp-3);">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                      <div style="display:flex;align-items:center;gap:10px;">
                          <i class="ph ph-identification-badge" style="font-size:24px;color:var(--color-info);flex-shrink:0;"></i>
                          <div>
                              <div style="font-size:13px;font-weight:600;">CI Fronte</div>
                              <div style="font-size:11px;color:var(--color-text-muted);">${r.id_doc_front_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.id_doc_front_file_path.split('/').pop()) : 'Nessun file caricato'}</div>
                          </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-2);align-items:center;">
                          ${r.id_doc_front_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=id_doc_front_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}
                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-id-doc-front-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                          <input type="file" id="upload-id-doc-front-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}
                      </div>
                  </div>
              </div>

              <!-- CI Retro -->
              <div class="card" style="padding:var(--sp-3);">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                      <div style="display:flex;align-items:center;gap:10px;">
                          <i class="ph ph-identification-card" style="font-size:24px;color:var(--color-info);flex-shrink:0;"></i>
                          <div>
                              <div style="font-size:13px;font-weight:600;">CI Retro</div>
                              <div style="font-size:11px;color:var(--color-text-muted);">${r.id_doc_back_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.id_doc_back_file_path.split('/').pop()) : 'Nessun file caricato'}</div>
                          </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-2);align-items:center;">
                          ${r.id_doc_back_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=id_doc_back_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}
                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-id-doc-back-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                          <input type="file" id="upload-id-doc-back-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}
                      </div>
                  </div>
              </div>

              <!-- CF Fronte -->
              <div class="card" style="padding:var(--sp-3);">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                      <div style="display:flex;align-items:center;gap:10px;">
                          <i class="ph ph-credit-card" style="font-size:24px;color:var(--color-success);flex-shrink:0;"></i>
                          <div>
                              <div style="font-size:13px;font-weight:600;">CF Fronte</div>
                              <div style="font-size:11px;color:var(--color-text-muted);">${r.cf_doc_front_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.cf_doc_front_file_path.split('/').pop()) : 'Nessun file caricato'}</div>
                          </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-2);align-items:center;">
                          ${r.cf_doc_front_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=cf_doc_front_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}
                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-cf-doc-front-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                          <input type="file" id="upload-cf-doc-front-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}
                      </div>
                  </div>
              </div>

              <!-- CF Retro -->
              <div class="card" style="padding:var(--sp-3);">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                      <div style="display:flex;align-items:center;gap:10px;">
                          <i class="ph ph-credit-card" style="font-size:24px;color:var(--color-success);flex-shrink:0;"></i>
                          <div>
                              <div style="font-size:13px;font-weight:600;">CF Retro</div>
                              <div style="font-size:11px;color:var(--color-text-muted);">${r.cf_doc_back_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.cf_doc_back_file_path.split('/').pop()) : 'Nessun file caricato'}</div>
                          </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-2);align-items:center;">
                          ${r.cf_doc_back_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=cf_doc_back_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}
                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-cf-doc-back-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                          <input type="file" id="upload-cf-doc-back-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}
                      </div>
                  </div>
              </div>

              <!-- Certificato Medico -->
              <div class="card" style="padding:var(--sp-3);">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">
                      <div style="display:flex;align-items:center;gap:10px;">
                          <i class="ph ph-first-aid" style="font-size:24px;color:var(--color-warning);flex-shrink:0;"></i>
                          <div>
                              <div style="font-size:13px;font-weight:600;">Certificato Medico</div>
                              <div style="font-size:11px;color:var(--color-text-muted);">${r.medical_cert_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.medical_cert_file_path.split('/').pop()) : 'Nessun file caricato'}</div>
                          </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-2);align-items:center;">
                          ${r.medical_cert_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=medical_cert_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}
                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-med-cert-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                          <input type="file" id="upload-med-cert-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}
                      </div>
                  </div>
              </div>

            </div>
          </div>"""

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + replacement + "\n" + content[end_idx:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Success replacing!")
else:
    print("Could not find markers!")
