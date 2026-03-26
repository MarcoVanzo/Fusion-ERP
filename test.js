const t = [{ id: 1, full_name: "Marco", role: "Allenatore", medical_cert_expires_at: "2026-12-31", contract_status: "firmato", identity_document: "AB12345", fiscal_code: "VRNMRA..." }];
const today = new Date();
const future60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
const medCertStats = { expired: 0, expiring: 0, valid: 0, missing: 0 };
const Utils = {
  escapeHtml: s => s,
  formatDate: s => s
};
const certRows = t
  .map((p) => {
    let statusHtml = "";
    let certDate = p.medical_cert_expires_at
      ? new Date(p.medical_cert_expires_at)
      : null;
    let isExpired = certDate && certDate < today;
    let isExpiring = certDate && !isExpired && certDate < future60;

    if (isExpired) {
      medCertStats.expired++;
      statusHtml = '<span class="badge badge-danger">Scaduto</span>';
    } else if (isExpiring) {
      medCertStats.expiring++;
      statusHtml = '<span class="badge badge-warning">In scadenza</span>';
    } else if (certDate) {
      medCertStats.valid++;
      statusHtml = '<span class="badge badge-success">Valido</span>';
    } else {
      medCertStats.missing++;
      statusHtml = '<span class="badge">Mancante</span>';
    }

    let contractStatusHtml = "";
    if (p.contract_status === "firmato") {
      contractStatusHtml =
        '<span class="badge badge-success">Firmato</span>';
    } else if (p.contract_status === "inviato") {
      contractStatusHtml =
        '<span class="badge badge-warning">Inviato</span>';
    } else {
      contractStatusHtml = '<span class="badge">Nessuno</span>';
    }

    return `<tr style="cursor:pointer;" data-staff-id="${Utils.escapeHtml(p.id)}">
        <td><strong>${Utils.escapeHtml(p.full_name)}</strong></td>
        <td>${Utils.escapeHtml(p.role || "—")}</td>
        <td style="color:${isExpired ? "var(--color-pink)" : isExpiring ? "var(--color-warning)" : "var(--color-text)"}">
            ${certDate ? Utils.formatDate(p.medical_cert_expires_at) : '<span style="color:var(--color-text-muted)">—</span>'}
        </td>
        <td>${statusHtml}</td>
        <td>${Utils.escapeHtml(p.identity_document || "—")}</td>
        <td>${Utils.escapeHtml(p.fiscal_code || "—")}</td>
        <td>${contractStatusHtml}</td>
    </tr>`;
  })
  .join("");
console.log(certRows);
