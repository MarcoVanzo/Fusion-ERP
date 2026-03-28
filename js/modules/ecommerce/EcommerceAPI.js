/**
 * EcommerceAPI
 * Gateway for eCommerce data operations, interacting with both the offline IndexedDB
 * (EcommerceDB) and the remote backend (Store.api).
 */

const EcommerceAPI = {
    // ------------------------------------------------------------------------
    // API - OFFLINE DB (IndexedDB wrapper functions)
    // ------------------------------------------------------------------------

    async getArticles() {
        return await EcommerceDB.getArticoli();
    },

    async countArticles() {
        return await EcommerceDB.countArticoli();
    },

    async saveArticle(article) {
        return await EcommerceDB.saveArticolo(article);
    },

    async bulkSaveArticles(articles) {
        return await EcommerceDB.bulkSaveArticoli(articles);
    },

    async deleteArticle(id) {
        return await EcommerceDB.deleteArticolo(id);
    },

    async getMeta(key) {
        return await EcommerceDB.getMeta(key);
    },

    async setMeta(key, value) {
        return await EcommerceDB.setMeta(key, value);
    },

    async fileToBase64(file) {
        return await EcommerceDB.fileToBase64(file);
    },

    async urlToBase64(url) {
        return await EcommerceDB.urlToBase64(url);
    },

    // ------------------------------------------------------------------------
    // API - REMOTE SERVER (Store)
    // ------------------------------------------------------------------------

    async fetchRemoteProducts() {
        // Triggers the scrape of Fusion-Shop WordPress items
        Store.invalidate("scrapeShop");
        return await Store.api("scrapeShop", "ecommerce");
    },

    async getOrders() {
        const res = await Store.get("getOrders", "ecommerce");
        return res.orders || [];
    },

    async syncOrders() {
        const res = await Store.api("syncOrders", "ecommerce");
        Store.invalidate("getOrders");
        return res;
    },

    async updateOrderStatus(id, stato) {
        return await Store.api("updateOrderStatus", "ecommerce", { id, stato });
    },

    // ------------------------------------------------------------------------
    // UTILITIES
    // ------------------------------------------------------------------------

    /**
     * Legacy utility that removes white background from product images
     * and converts JPEG into PNG with transparent alpha channel.
     * Preserved because it creates a unified aesthetic for products.
     */
    async processImageTransparent(base64Str) {
        return new Promise((resolve) => {
            if (!base64Str || !base64Str.startsWith("data:image/")) {
                return resolve(base64Str);
            }
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // Distance from white (255, 255, 255)
                    const dist = Math.sqrt((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2);
                    
                    if (dist < 30) {
                        data[i + 3] = 0; // completely transparent
                    } else if (dist < 80) {
                        const alphaRatio = Math.max(0, (dist - 30) / 50);
                        data[i + 3] = Math.floor(a * alphaRatio);
                        
                        // Contrast adjust
                        const crt = 71225 / 60945;
                        data[i] = Math.max(0, Math.min(255, crt * (r - 128) + 128));
                        data[i + 1] = Math.max(0, Math.min(255, crt * (g - 128) + 128));
                        data[i + 2] = Math.max(0, Math.min(255, crt * (b - 128) + 128));
                    } else if (a > 0) {
                        const crt = 71225 / 60945;
                        data[i] = Math.max(0, Math.min(255, crt * (r - 128) + 128));
                        data[i + 1] = Math.max(0, Math.min(255, crt * (g - 128) + 128));
                        data[i + 2] = Math.max(0, Math.min(255, crt * (b - 128) + 128));
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            
            img.onerror = () => resolve(base64Str);
            img.src = base64Str;
        });
    }
};

export default EcommerceAPI;
