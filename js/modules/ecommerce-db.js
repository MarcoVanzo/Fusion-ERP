/**
 * ecommerce-db.js — IndexedDB via Dexie.js
 * Fusion ERP — Modulo eCommerce
 *
 * Store:
 *   articoli     — prodotti importati/creati manualmente
 *   statiOrdini  — stati locali degli ordini (sovrascrivono Cognito)
 *   metadati     — flag generici (es. importCompletato)
 *
 * NOTA: le immagini sono salvate come base64 direttamente in IndexedDB
 * (non in localStorage — troppo piccolo). IndexedDB regge facilmente
 * decine di MB di dati prodotto.
 */

'use strict';

const EcommerceDB = (() => {

    // ── Dexie instance (lazy-initialised) ──────────────────────────────────
    let _db = null;

    function _getDb() {
        if (_db) return _db;

        _db = new Dexie('FusionERP_Ecommerce');

        _db.version(1).stores({
            articoli: '++id, nome, categoria, disponibile, importatoIl',
            statiOrdini: 'ordineId, stato, aggiornatoIl',
            metadati: 'chiave',
        });

        return _db;
    }

    // ══════════════════════════════════════════════════════════════════════
    // ARTICOLI
    // ══════════════════════════════════════════════════════════════════════

    async function getArticoli() {
        return _getDb().articoli.orderBy('nome').toArray();
    }

    async function getArticolo(id) {
        return _getDb().articoli.get(id);
    }

    async function saveArticolo(articolo) {
        const now = new Date().toISOString();
        const db = _getDb();

        if (articolo.id) {
            // Update existing
            await db.articoli.update(articolo.id, {
                ...articolo,
                modificatoIl: now,
            });
            return articolo.id;
        } else {
            // Insert new
            return db.articoli.add({
                ...articolo,
                importatoIl: now,
                modificatoIl: now,
            });
        }
    }

    async function deleteArticolo(id) {
        return _getDb().articoli.delete(id);
    }

    /** Bulk-insert many articles (used by Import Wizard) */
    async function bulkSaveArticoli(articoli) {
        const now = new Date().toISOString();
        const mapped = articoli.map(a => ({
            ...a,
            importatoIl: now,
            modificatoIl: now,
        }));
        return _getDb().articoli.bulkAdd(mapped);
    }

    async function countArticoli() {
        return _getDb().articoli.count();
    }

    // ══════════════════════════════════════════════════════════════════════
    // STATI ORDINI
    // ══════════════════════════════════════════════════════════════════════

    /** Returns a Map<ordineId, statoObj> for fast lookup */
    async function getAllStatiOrdini() {
        const rows = await _getDb().statiOrdini.toArray();
        const map = new Map();
        rows.forEach(r => map.set(String(r.ordineId), r));
        return map;
    }

    async function setStatoOrdine(ordineId, stato) {
        return _getDb().statiOrdini.put({
            ordineId: String(ordineId),
            stato,
            aggiornatoIl: new Date().toISOString(),
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // METADATI
    // ══════════════════════════════════════════════════════════════════════

    async function getMeta(chiave) {
        const row = await _getDb().metadati.get(chiave);
        return row ? row.valore : null;
    }

    async function setMeta(chiave, valore) {
        return _getDb().metadati.put({ chiave, valore });
    }

    // ══════════════════════════════════════════════════════════════════════
    // IMMAGINI — conversione URL → base64
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Fetches an image URL and converts it to a base64 data-URI.
     * Returns null if the fetch fails (network / CORS error).
     */
    async function urlToBase64(url) {
        try {
            const response = await fetch(url, { mode: 'cors', cache: 'no-store' });
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    }

    /**
     * Converts a File object (from <input type="file">) to a base64 data-URI.
     */
    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Errore lettura file'));
            reader.readAsDataURL(file);
        });
    }

    // ── Public API ─────────────────────────────────────────────────────────
    return {
        // Articoli
        getArticoli,
        getArticolo,
        saveArticolo,
        deleteArticolo,
        bulkSaveArticoli,
        countArticoli,

        // Ordini
        getAllStatiOrdini,
        setStatoOrdine,

        // Metadati
        getMeta,
        setMeta,

        // Image helpers
        urlToBase64,
        fileToBase64,
    };
})();

window.EcommerceDB = EcommerceDB;
