<?php
/**
 * VALD Credentials — fallback config when .env cannot be written on the server.
 * This file is deployed via FTP and takes precedence over the .env file.
 *
 * To regenerate credentials: VALD Hub → Settings → API Keys.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Vald;

class ValdCredentials
{
    // OAuth2 Client Credentials (VALD Hub → Settings → API Keys)
    public const CLIENT_ID     = 'M8P861J18q9Aw2HLtCuMszB31z03VYnE';
    public const CLIENT_SECRET = 'qfQYsxr58z76bLZ1XgNIHuXotRvqfj4Q-zTY1vuybhokVTYwI2VUf4leAX0ircIW';
    public const ORG_ID        = '520b0e3c-60da-48c5-a756-3da0bc5dcfb1';
    public const IDENTITY_URL  = 'https://auth.prd.vald.com/oauth/token';
    public const API_BASE_URL  = 'https://prd-euw-api-extforcedecks.valdperformance.com';
}
