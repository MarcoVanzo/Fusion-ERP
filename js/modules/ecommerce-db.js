"use strict";
const EcommerceDB = (() => {
  let t = null;
  function n() {
    return (
      t ||
      ((t = new Dexie("FusionERP_Ecommerce")),
        t
          .version(1)
          .stores({
            articoli: "++id, nome, categoria, disponibile, importatoIl",
            statiOrdini: "ordineId, stato, aggiornatoIl",
            metadati: "chiave",
          }),
        t)
    );
  }
  return {
    getArticoli: async function () {
      return n().articoli.orderBy("nome").toArray();
    },
    getArticolo: async function (t) {
      return n().articoli.get(t);
    },
    saveArticolo: async function (t) {
      const r = new Date().toISOString(),
        e = n();
      return t.id
        ? (await e.articoli.update(t.id, { ...t, modificatoIl: r }), t.id)
        : e.articoli.add({ ...t, importatoIl: r, modificatoIl: r });
    },
    deleteArticolo: async function (t) {
      return n().articoli.delete(t);
    },
    bulkSaveArticoli: async function (t) {
      const db = n(),
        now = new Date().toISOString(),
        existing = await db.articoli.toArray(),
        nameMap = new Map();
      existing.forEach((item) => {
        if (item.nome) nameMap.set(item.nome.trim().toLowerCase(), item);
      });
      const toAdd = [],
        toUpdate = [];
      t.forEach((item) => {
        const itemKey = item.nome ? item.nome.trim().toLowerCase() : "";
        if (itemKey && nameMap.has(itemKey)) {
          const matched = nameMap.get(itemKey);
          toUpdate.push({ ...matched, ...item, id: matched.id, modificatoIl: now });
        } else {
          toAdd.push({ ...item, importatoIl: now, modificatoIl: now });
        }
      });
      if (toAdd.length > 0) await db.articoli.bulkAdd(toAdd);
      if (toUpdate.length > 0) await db.articoli.bulkPut(toUpdate);
      return true;
    },
    countArticoli: async function () {
      return n().articoli.count();
    },
    deduplicateArticoli: async function () {
      const db = n(),
        all = await db.articoli.toArray(),
        nameMap = new Map(),
        toDelete = [];
      for (const item of all) {
        if (!item.nome) continue;
        const key = item.nome.trim().toLowerCase();
        if (nameMap.has(key)) {
          const existing = nameMap.get(key);
          const existingHasImage = !!existing.immagineBase64;
          const newHasImage = !!item.immagineBase64;
          const existingDate = existing.modificatoIl ? new Date(existing.modificatoIl) : new Date(0);
          const newDate = item.modificatoIl ? new Date(item.modificatoIl) : new Date(0);

          if (!existingHasImage && newHasImage) {
            toDelete.push(existing.id);
            nameMap.set(key, item);
          } else if (existingHasImage && !newHasImage) {
            toDelete.push(item.id);
          } else if (newDate > existingDate) {
            toDelete.push(existing.id);
            nameMap.set(key, item);
          } else {
            toDelete.push(item.id);
          }
        } else {
          nameMap.set(key, item);
        }
      }
      if (toDelete.length > 0) {
        await db.articoli.bulkDelete(toDelete);
        console.log(`EcommerceDB: Deduplicated ${toDelete.length} articles.`);
      }
      return toDelete.length;
    },
    getAllStatiOrdini: async function () {
      const t = await n().statiOrdini.toArray(),
        r = new Map();
      return (t.forEach((t) => r.set(String(t.ordineId), t)), r);
    },
    setStatoOrdine: async function (t, r) {
      return n().statiOrdini.put({
        ordineId: String(t),
        stato: r,
        aggiornatoIl: new Date().toISOString(),
      });
    },
    getMeta: async function (t) {
      const r = await n().metadati.get(t);
      return r ? r.valore : null;
    },
    setMeta: async function (t, r) {
      return n().metadati.put({ chiave: t, valore: r });
    },
    urlToBase64: async function (t) {
      if (!t) return null;
      try {
        const urlObj = new URL(t);
        if (["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254"].includes(urlObj.hostname) || urlObj.hostname.endsWith(".local") || urlObj.hostname.endsWith(".internal")) {
          throw new Error("Blocked internal domain.");
        }
        const n = await fetch(t, { mode: "cors", cache: "no-store" });
        if (!n.ok) return null;
        const r = await n.blob();
        return new Promise((t) => {
          const n = new FileReader();
          ((n.onloadend = () => t(n.result)),
            (n.onerror = () => t(null)),
            n.readAsDataURL(r));
        });
      } catch {
        return null;
      }
    },
    fileToBase64: async function (t) {
      return new Promise((n, r) => {
        const e = new FileReader();
        ((e.onloadend = () => n(e.result)),
          (e.onerror = () => r(new Error("Errore lettura file"))),
          e.readAsDataURL(t));
      });
    },
  };
})();
window.EcommerceDB = EcommerceDB;
