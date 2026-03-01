<?php
/**
 * GoogleDrive — Backup Upload Helper
 * Fusion ERP v1.0
 *
 * Uses OAuth2 refresh_token (no Service Account key needed).
 * Applies immutability features:
 *   1. contentRestrictions (readOnly + ownerRestricted) — file locked
 *   2. Revision keepForever                             — version preserved forever
 *   3. HMAC-SHA256 in file description                  — tamper detection
 *
 * Required .env variables:
 *   GDRIVE_CLIENT_ID
 *   GDRIVE_CLIENT_SECRET
 *   GDRIVE_REFRESH_TOKEN
 *   GDRIVE_FOLDER_ID
 *   APP_SECRET (used as HMAC key)
 */

namespace FusionERP\Shared;

class GoogleDrive
{
    // ── Static convenience wrapper ────────────────────────────────────────────

    /**
     * Upload a file to Google Drive, lock it immutably, and return its Drive file ID.
     *
     * @param string $filePath  Absolute path to the local file
     * @param string $filename  Filename to use on Drive (defaults to basename)
     * @return string           Drive file ID
     * @throws \RuntimeException on failure
     */
    public static function uploadFile(string $filePath, string $filename = ''): string
    {
        if (empty($filename)) {
            $filename = basename($filePath);
        }

        $instance = new self(
            getenv('GDRIVE_CLIENT_ID') ?: '',
            getenv('GDRIVE_CLIENT_SECRET') ?: '',
            getenv('GDRIVE_REFRESH_TOKEN') ?: '',
            getenv('GDRIVE_FOLDER_ID') ?: ''
            );

        if (!$instance->isConfigured()) {
            throw new \RuntimeException('Google Drive non configurato: verifica GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN, GDRIVE_FOLDER_ID nel .env');
        }

        $hmacSecret = getenv('APP_SECRET') ?: 'fusion_erp_default';
        $result = $instance->uploadAndLock($filePath, $filename, $hmacSecret);

        if ($result['status'] !== 'success') {
            throw new \RuntimeException($result['error'] ?? 'Upload Drive fallito');
        }

        return $result['fileId'];
    }

    // ── Instance implementation ───────────────────────────────────────────────

    private string $clientId;
    private string $clientSecret;
    private string $refreshToken;
    private string $folderId;
    private ?string $accessToken = null;
    private int $tokenExpiry = 0;

    public function __construct(string $clientId, string $clientSecret, string $refreshToken, string $folderId)
    {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->refreshToken = $refreshToken;
        $this->folderId = $folderId;
    }

    public function isConfigured(): bool
    {
        return !empty($this->clientId)
            && !empty($this->clientSecret)
            && !empty($this->refreshToken)
            && !empty($this->folderId);
    }

    /**
     * Upload, lock, and sign a backup file.
     *
     * @return array{status:string, fileId?:string, hmac?:string, locked?:bool,
     *               keepForever?:bool, error?:string}
     */
    public function uploadAndLock(string $filePath, string $filename, string $hmacSecret): array
    {
        if (!$this->isConfigured()) {
            return ['status' => 'error', 'error' => 'Google Drive non configurato'];
        }

        try {
            // 1. Get access token
            $token = $this->getAccessToken();
            if (!$token) {
                return ['status' => 'error', 'error' => 'Autenticazione Google fallita (refresh token non valido?)'];
            }

            $content = file_get_contents($filePath);
            if ($content === false) {
                return ['status' => 'error', 'error' => "File non leggibile: {$filePath}"];
            }

            // 2. HMAC signature
            $hmac = hash_hmac('sha256', $content, $hmacSecret);

            // 3. Upload
            $fileId = $this->doUpload($filename, $content, $token);
            if (!$fileId) {
                return ['status' => 'error', 'error' => 'Upload su Google Drive fallito'];
            }

            // 4. Lock (contentRestrictions readOnly + ownerRestricted)
            $locked = $this->lockFile($fileId, $token);

            // 5. keepForever on latest revision
            $kept = $this->setKeepForever($fileId, $token);

            // 6. Store HMAC in file description
            $this->setDescription(
                $fileId,
                'HMAC-SHA256: ' . $hmac . ' | Fusion ERP Backup ' . date('d/m/Y H:i'),
                $token
            );

            return [
                'status' => 'success',
                'fileId' => $fileId,
                'hmac' => $hmac,
                'locked' => $locked,
                'keepForever' => $kept,
            ];
        }
        catch (\Throwable $e) {
            error_log('[FUSION-ERP] GoogleDrive error: ' . $e->getMessage());
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function getAccessToken(): ?string
    {
        // Return cached token if still valid (with 60s margin)
        if ($this->accessToken && time() < $this->tokenExpiry - 60) {
            return $this->accessToken;
        }

        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'refresh_token' => $this->refreshToken,
                'grant_type' => 'refresh_token',
            ]),
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[FUSION-ERP] Google OAuth refresh failed: HTTP ' . $httpCode . ' — ' . $response);
            return null;
        }

        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'] ?? null;
        $this->tokenExpiry = time() + ($data['expires_in'] ?? 3600);

        return $this->accessToken;
    }

    private function doUpload(string $filename, string $content, string $token): ?string
    {
        $mimeType = 'application/zip';
        if (str_ends_with($filename, '.sql')) {
            $mimeType = 'application/sql';
        }

        $metadata = json_encode([
            'name' => $filename,
            'parents' => [$this->folderId],
            'mimeType' => $mimeType,
            'description' => 'Fusion ERP Automatic Backup — ' . date('d/m/Y H:i'),
        ]);

        $boundary = 'fusion_backup_' . bin2hex(random_bytes(8));
        $body = "--{$boundary}\r\n";
        $body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
        $body .= $metadata . "\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: {$mimeType}\r\n\r\n";
        $body .= $content . "\r\n";
        $body .= "--{$boundary}--";

        $ch = curl_init('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$token}",
                "Content-Type: multipart/related; boundary={$boundary}",
                'Content-Length: ' . strlen($body),
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 120,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[FUSION-ERP] Drive upload failed: HTTP ' . $httpCode . ' — ' . $response);
            return null;
        }

        $data = json_decode($response, true);
        return $data['id'] ?? null;
    }

    /**
     * Apply Content Restriction — makes the file read-only and owner-restricted.
     * This is as close to "immutable" as Google Drive permits via API.
     */
    private function lockFile(string $fileId, string $token): bool
    {
        $payload = json_encode([
            'contentRestrictions' => [[
                    'readOnly' => true,
                    'reason' => 'Backup Fusion ERP immutabile — bloccato automaticamente',
                    'ownerRestricted' => true,
                ]],
        ]);

        $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$fileId}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$token}",
                'Content-Type: application/json',
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[FUSION-ERP] Content restriction failed: HTTP ' . $httpCode . ' — ' . $response);
            return false;
        }

        return true;
    }

    /**
     * Set keepForever on the latest revision — prevents Google auto-purging old versions.
     */
    private function setKeepForever(string $fileId, string $token): bool
    {
        // Get revision list
        $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$fileId}/revisions?fields=revisions(id)");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}"],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        $revisions = $data['revisions'] ?? [];
        if (empty($revisions))
            return false;

        $revisionId = end($revisions)['id'];

        $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$fileId}/revisions/{$revisionId}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_POSTFIELDS => json_encode(['keepForever' => true]),
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$token}",
                'Content-Type: application/json',
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }

    private function setDescription(string $fileId, string $description, string $token): void
    {
        $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$fileId}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_POSTFIELDS => json_encode(['description' => $description]),
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$token}",
                'Content-Type: application/json',
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}