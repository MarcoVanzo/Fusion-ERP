<?php
/**
 * AI Configuration — Fallback when .env variables are not populated.
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class AIConfig
{
    /**
     * Google Gemini API Key.
     * Use the .env file (GEMINI_TOKEN) as primary source; this is a reliable fallback.
     */
    public const GEMINI_TOKEN = 'AIzaSyCVHC2qQKuX4rQyis0bpsS3a9eGK_tUuOQ';
}
