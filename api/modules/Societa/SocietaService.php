<?php
/**
 * Societa Service — Business Logic & File Uploads per il modulo Societa
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Societa;

class SocietaService
{
    private SocietaRepository $repo;
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    public function __construct(SocietaRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Esegue i controlli generici su un caricamento file.
     * Ritorna l'estensione del file. Lanci eccezioni in caso di errore.
     */
    private function validateUploadedFile(array $file, array $allowedMimes): string
    {
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $file['error'] ?? -1;
            throw new \Exception("Errore in fase di caricamento (codice: {$errorCode}).");
        }

        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new \Exception('File troppo grande (max 10 MB).');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, $allowedMimes, true)) {
            throw new \Exception("Tipo file non consentito ({$mime}).");
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        return strtolower($ext ?: 'bin');
    }

    /**
     * Metodo interno per salvare un file su disco
     */
    private function storeFile(array $file, string $tenantId, string $subDir, string $fileName): string
    {
        $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId . '/' . $subDir;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Se il subDir è vuoto (es. logo aziendale), rimuoviamo lo slash finale
        $destPath = $uploadDir . '/' . $fileName;
        $destPath = str_replace('//', '/', $destPath);
        
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            throw new \Exception('Errore nel salvataggio fisico del file sul server.');
        }

        $relPath = 'uploads/societa/' . $tenantId . ($subDir ? '/' . $subDir : '') . '/' . $fileName;
        return str_replace('//', '/', $relPath);
    }

    public function uploadLogo(array $file, string $tenantId): string
    {
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = 'logo_' . date('Ymd_His') . '.' . $ext;
        
        return $this->storeFile($file, $tenantId, '', $fileName);
    }

    public function uploadMemberPhoto(string $memberId, array $file, string $tenantId, ?string $oldPhotoPath): string
    {
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = 'member_' . $memberId . '_' . time() . '.' . $ext;

        $newPath = $this->storeFile($file, $tenantId, 'members', $fileName);

        // Cleanup vecchio file
        if (!empty($oldPhotoPath)) {
            $oldAbsolutePath = dirname(__DIR__, 3) . '/' . ltrim($oldPhotoPath, '/');
            if (file_exists($oldAbsolutePath)) {
                @unlink($oldAbsolutePath);
            }
        }

        return $newPath;
    }

    public function uploadDocument(string $category, array $file, string $tenantId): array
    {
        $validCategories = ['statuto', 'affiliazione', 'licenza', 'assicurazione', 'altro'];
        if (!in_array($category, $validCategories, true)) {
            throw new \Exception("Categoria documento non valida: {$category}");
        }

        $allowed = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
        ];
        
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = $category . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;

        $relPath = $this->storeFile($file, $tenantId, 'docs', $fileName);
        
        return [
            'file_name' => $file['name'],
            'file_path' => $relPath
        ];
    }
    
    public function uploadSponsorLogo(string $sponsorId, array $file, string $tenantId): string
    {
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        $ext = $this->validateUploadedFile($file, $allowed);
        
        $fileName = 'sponsor_' . $sponsorId . '_' . date('Ymd_His') . '.' . $ext;
        return $this->storeFile($file, $tenantId, 'sponsors', $fileName);
    }

    // ─── FORESTERIA ────────────────────────────────────────────────────────
    
    public function getForesteriaFallbackInfo(string $tenantId): array
    {
        $info = $this->repo->getForesteriaInfo($tenantId);
        if (!$info) {
            return [
                'description' => '',
                'address'     => 'Via Bazzera 16, 30030 Martellago (VE)',
                'lat'         => 45.5440000,
                'lng'         => 12.1580000,
            ];
        }
        return $info;
    }

    public function processForesteriaExpense(array $body, ?array $file, string $tenantId, string $userId): array
    {
        $receiptPath = null;
        if ($file && $file['error'] === UPLOAD_ERR_OK) {
            // Qui non usiamo validateUploadedFile in modo rigido perché l'upload era opzionale
            if ($file['size'] > self::MAX_FILE_SIZE) {
                throw new \Exception('Ricevuta troppo grande (max 10 MB).');
            }
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
            $fileName = 'receipt_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);
            
            // Foresteria ha un percorso leggermente diverso dalle altre entità in legacy
            // uploads/{tenantId}/foresteria/
            $uploadDir = dirname(__DIR__, 3) . '/uploads/' . $tenantId . '/foresteria';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $destPath = $uploadDir . '/' . $fileName;
            if (move_uploaded_file($file['tmp_name'], $destPath)) {
                $receiptPath = 'uploads/' . $tenantId . '/foresteria/' . $fileName;
            }
        }

        $id = 'FEX_' . bin2hex(random_bytes(4));
        
        $data = [
            ':id'           => $id,
            ':tenant_id'    => $tenantId,
            ':description'  => htmlspecialchars(trim($body['description'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':amount'       => (float)($body['amount'] ?? 0),
            ':category'     => $body['category'] ?? null,
            ':expense_date' => $body['expense_date'],
            ':receipt_path' => $receiptPath,
            ':notes'        => $body['notes'] ?? null,
            ':created_by'   => $userId,
        ];

        return [
            'id' => $id,
            'data' => $data,
            'receipt_path' => $receiptPath
        ];
    }
    
    public function uploadForesteriaMedia(array $file, string $tenantId, ?string $title, ?string $desc): array
    {
        $allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
        
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new \Exception('Errore di caricamento o file mancante.');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        
        $isImg = in_array($mime, $allowedImages, true);
        $isVid = in_array($mime, $allowedVideos, true);
        
        if (!$isImg && !$isVid) {
            throw new \Exception('Formato non supportato. Accettati: JPG, PNG, WEBP, MP4, WEBM, MOV.');
        }

        $type = $isVid ? 'video' : 'photo';
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $fileName = $type . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;

        $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId . '/foresteria';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destPath = $uploadDir . '/' . $fileName;
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            throw new \Exception('Errore nel salvataggio fisico del media.');
        }

        $relPath = 'uploads/societa/' . $tenantId . '/foresteria/' . $fileName;
        $id = 'FMD_' . bin2hex(random_bytes(4));
        
        return [
            'id' => $id,
            'type' => $type,
            'file_path' => $relPath,
            'title' => $title,
            'description' => $desc
        ];
    }
    
    public function parseForesteriaYoutubeLink(string $url, ?string $title): array
    {
        $url = trim($url);
        if (empty($url)) {
            throw new \Exception("URL YouTube obbligatorio.");
        }

        $videoId = null;
        $patterns = [
            '/(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/',
            '/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/',
            '/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/',
            '/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/',
            '/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                $videoId = $matches[1];
                break;
            }
        }

        if (!$videoId) {
            throw new \Exception('URL YouTube non valido. Incolla il link di un video valido.');
        }

        $canonicalUrl = 'https://www.youtube.com/watch?v=' . $videoId;
        $id = 'FMD_' . bin2hex(random_bytes(4));
        
        return [
            'id' => $id,
            'type' => 'youtube',
            'file_path' => $canonicalUrl,
            'title' => $title ?: $canonicalUrl,
            'description' => null
        ];
    }
}
