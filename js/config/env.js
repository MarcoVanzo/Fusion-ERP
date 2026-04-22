'use strict';

/**
 * Environment Config — Runtime Configuration
 * Fusion ERP v1.0
 *
 * Centralizes configuration values that were previously hardcoded.
 * This file is loaded before other modules and sets up window-level config.
 *
 * SECURITY: API keys here are still client-visible (browser JS),
 * but moving them out of inline <script> tags allows CSP to drop 'unsafe-inline'.
 * For production hardening, restrict these keys via Google Cloud Console
 * (HTTP referrer restrictions, API usage quotas).
 */

window.FUSION_CONFIG = Object.freeze({
    /** Google Maps API Key — restricted via HTTP referrer in Google Cloud Console */
    GOOGLE_MAPS_API_KEY: 'AIzaSyBhPUVEj5X5jZ2zsG1pzDys5QiYHbtN6oI',

    /** Password policy (must match backend .env PASSWORD_MIN_LENGTH) */
    PASSWORD_MIN_LENGTH: 12,
});

// Legacy compat: transport module reads window.GOOGLE_MAPS_API_KEY
window.GOOGLE_MAPS_API_KEY = window.FUSION_CONFIG.GOOGLE_MAPS_API_KEY;
