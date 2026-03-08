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
      const r = new Date().toISOString(),
        e = t.map((t) => ({ ...t, importatoIl: r, modificatoIl: r }));
      return n().articoli.bulkAdd(e);
    },
    countArticoli: async function () {
      return n().articoli.count();
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
      try {
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
