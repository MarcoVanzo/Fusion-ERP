"use strict";

const EcommerceDB = (() => {
  let t = null;
  function e() {
    if (!t) {
      t = new Dexie("FusionERP_Ecommerce");
      t.version(1).stores({
        articoli: "++id, nome, categoria, disponibile, importatoIl",
        statiOrdini: "ordineId, stato, aggiornatoIl",
        metadati: "chiave",
      });
    }
    return t;
  }

  async function ensureMigrated() {
    try {
      const meta = await e().metadati.get("ec_migrated_v2");
      if (meta && meta.valore) return; // Already migrated

      const count = await e().articoli.count();
      if (count > 0) {
        const localArticles = await e().articoli.toArray();

        // Chunk size of 5 to avoid post_max_size (8M) limits on Base64 payloads
        const chunkSize = 5;
        for (let i = 0; i < localArticles.length; i += chunkSize) {
          const chunk = localArticles.slice(i, i + chunkSize);
          await Store.api("bulkSaveProdotti", "ecommerce", { prodotti: chunk });
        }

        await e().articoli.clear(); // Remove local items once successfully uploaded
      }
      await e().metadati.put({ chiave: "ec_migrated_v2", valore: 1 });
    } catch (_err) {
      console.error("EcommerceDB Migration Error:", err);
      // Non impostiamo il flag 'ec_migrated_v2' così riprova al prossimo reload
    }
  }

  // Attempt migration only if logged in
  function tryMigration() {
      if (window.App && typeof App.getUser === 'function' && App.getUser()) {
          ensureMigrated();
      } else {
          // Retry later when user might be logged in
          setTimeout(tryMigration, 3000);
      }
  }
  setTimeout(tryMigration, 1000);

  return {
    getArticoli: async function () {
      try {
        const res = await Store.api("getProdotti", "ecommerce");
        return res.prodotti || [];
      } catch (_err) {
        console.error("EcommerceDB.getArticoli error:", err);
        return [];
      }
    },
    getArticolo: async function (id) {
      try {
        const articoli = await this.getArticoli();
        return articoli.find((a) => String(a.id) === String(id));
      } catch (_err) {
        return null;
      }
    },
    saveArticolo: async function (data) {
      const res = await Store.api("saveProdotto", "ecommerce", data);
      // Clear getProdotti cache if stored somewhere (Store.invalidate can be used if appropriate)
      if (window.Store && typeof window.Store.invalidate === "function") {
        Store.invalidate("getProdotti");
      }
      return res.id;
    },
    deleteArticolo: async function (id) {
      const res = await Store.api("deleteProdotto", "ecommerce", { id });
      if (window.Store && typeof window.Store.invalidate === "function") {
        Store.invalidate("getProdotti");
      }
      return res;
    },
    bulkSaveArticoli: async function (prodotti) {
      const _res = await Store.api("bulkSaveProdotti", "ecommerce", {
        prodotti,
      });
      if (window.Store && typeof window.Store.invalidate === "function") {
        Store.invalidate("getProdotti");
      }
      return true;
    },
    countArticoli: async function () {
      try {
        const res = await Store.api("getProdotti", "ecommerce");
        return res.count || 0;
      } catch (_err) {
        return 0;
      }
    },

    // Legacy Dexie methods kept for other functionality
    getAllStatiOrdini: async function () {
      const t = await e().statiOrdini.toArray(),
        o = new Map();
      return (t.forEach((t) => o.set(String(t.ordineId), t)), o);
    },
    setStatoOrdine: async function (t, o) {
      return e().statiOrdini.put({
        ordineId: String(t),
        stato: o,
        aggiornatoIl: new Date().toISOString(),
      });
    },
    getMeta: async function (t) {
      const o = await e().metadati.get(t);
      return o ? o.valore : null;
    },
    setMeta: async function (t, o) {
      return e().metadati.put({ chiave: t, valore: o });
    },
    urlToBase64: async function (t) {
      if (!t) return null;
      try {
        const e = new URL(t);
        if (
          [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "169.254.169.254",
            "::1",
            "::",
          ].includes(e.hostname) ||
          e.hostname.endsWith(".local") ||
          e.hostname.endsWith(".internal")
        )
          throw new Error("Blocked internal domain.");
        const o = await fetch(t, { mode: "cors", cache: "no-store" });
        if (!o.ok) return null;
        const n = await o.blob();
        return new Promise((t) => {
          const e = new FileReader();
          ((e.onloadend = () => t(e.result)),
            (e.onerror = () => t(null)),
            e.readAsDataURL(n));
        });
      } catch {
        return null;
      }
    },
    fileToBase64: async function (t) {
      return new Promise((e, o) => {
        const n = new FileReader();
        ((n.onloadend = () => e(n.result)),
          (n.onerror = () => o(new Error("Errore lettura file"))),
          n.readAsDataURL(t));
      });
    },
  };
})();
window.EcommerceDB = EcommerceDB;
