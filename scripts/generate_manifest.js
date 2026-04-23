#!/usr/bin/env node
/**
 * Fusion ERP — Deploy Manifest Generator
 * Scansiona il progetto e genera deploy_manifest.json con la lista dei file
 * che devono essere presenti in produzione.
 * 
 * Basato sulla logica di MV ERP generate_manifest.js, adattato per Fusion ERP
 * (gestione React apps, struttura Modules/Shared, ecc.)
 */

const fs = require('fs');
const path = require('path');

// ── Directory names to exclude (matched against individual directory names) ──
const EXCLUDE_DIR_NAMES = [
    '.git', 'node_modules', '__pycache__', '.venv', '.gemini', '.vscode',
    '.idea', '.agent', '.agents', '.npm-cache', '.phpunit.cache', '.github',
    'uploads', 'scripts', 'tests', 'docs', 'types', 'docker',
    'screenshots', 'screenshots_messy', 'scratch', 'tmp',
    '.quarantine', 'storage', 'mobile',
    // React app internals (only dist/ is deployed)
    'src', 'public',
];

// Full relative paths to exclude
const EXCLUDE_DIR_PATHS = [
    // We handle fusion-website and fusion-erp-react specially
    'fusion-website/node_modules',
    'fusion-erp-react/node_modules',
];

// ── Files to exclude by exact name ──
const EXCLUDE_FILES = [
    'deploy_manifest.json', '.deploy_cache.json', 'deploy.py', 'deploy.mp',
    // Deploy infrastructure (deploy_update.php lives on server, not overwritten)
    'deploy_update.php',
    'package-lock.json', 'package.json', 'composer.json', 'composer.lock', 'composer.phar',
    'Dockerfile', 'docker-compose.yml', '.dockerignore',
    'vite.config.js', 'tsconfig.json', 'phpstan.neon', 'phpunit.xml',
    'eslint.config.mjs', '.stylelintrc.json', '.stylelintignore',
    '.editorconfig', '.cursorrules', 'README.md',
    'Sviluppo_ERP_Fusion.mp', 'brand_identity.mp', 'UX_UI_Review.md',
    'gas_proxy.gs', 'test_stress.py',
    'modello_import_allenatori.csv',
    '.DS_Store',
    // Database files (never deploy)
    'fusion_erp.db', 'database.sqlite', 'fusion.db',
    // style backup
    'style_v2.backup.css',
];

// ── File name prefixes to exclude ──
const EXCLUDE_PREFIXES = [
    'diag_',      // Diagnostic tools
    'debug',      // Debug scripts
    'test_',      // Test scripts  
    'tmp_',       // Temporary files
    'reset_',     // Reset scripts
    'seed_',      // Database seed scripts
    'migrate_',   // One-off migration scripts
    'ftp_',       // FTP utility scripts
    'find_',      // Search/find utility scripts
    'fix_',       // Fix scripts (one-off)
    'check_env_', // Environment check scripts
    'list_models',// Model listing scripts
    'query_',     // Query debug scripts
];

// ── Extensions to exclude ──
const EXCLUDE_EXTENSIONS = [
    '.zip', '.log', '.swp', '.swo', '.pyc', '.db', '.sqlite',
    '.mp',  // Mindmap/notes files
    '.py',  // Python scripts (deploy tools, not production code)
];

// ── Specific file paths to always exclude ──
const EXCLUDE_PATHS = [
    '.env',          // Local dev env — .env.prod is deployed as .env
    '.env.example',
    '.credentials',
    'api/diag_audit.php',    // Diagnostic tool
    'api/crash.log',
    'api/ai_debug.log',
    'api/fipav_err.log',
    'api/fusion.db',
    'api/database.sqlite',
    'api/sessions',          // Server-side sessions dir
];

const crypto = require('crypto');

/**
 * Calcola SHA-256 di un file.
 */
function fileSHA256(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively scan directory and collect deployable files.
 * Returns array of {path, hash} objects.
 */
function getFiles(dir, allFiles = []) {
    let entries;
    try {
        entries = fs.readdirSync(dir);
    } catch {
        return allFiles;
    }

    entries.forEach(file => {
        const filePath = path.join(dir, file);
        let stats;
        try {
            stats = fs.statSync(filePath);
        } catch {
            return;
        }
        
        const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

        if (stats.isDirectory()) {
            const dirName = path.basename(filePath);
            
            // Skip excluded dir names
            if (EXCLUDE_DIR_NAMES.includes(dirName)) return;
            // Skip hidden dirs (except specific ones)
            if (dirName.startsWith('.') && dirName !== '.htaccess') return;
            // Skip excluded full paths
            if (EXCLUDE_DIR_PATHS.some(p => relPath === p || relPath.startsWith(p + '/'))) return;
            
            // Special handling for React apps: only descend into dist/
            if (relPath === 'fusion-website' || relPath === 'fusion-erp-react') {
                const distPath = path.join(filePath, 'dist');
                if (fs.existsSync(distPath)) {
                    getFiles(distPath, allFiles);
                }
                return; // Don't descend into anything else in these dirs
            }

            // Special handling for assets: only deploy specific files
            if (relPath === 'assets') {
                // Allow anatomy/ and media/ subdirs, and specific root files
                const allowedRootFiles = ['favicon.svg', 'cestino.png'];
                const allowedSubdirs = ['anatomy', 'media'];
                
                entries.forEach(assetEntry => {
                    const assetPath = path.join(filePath, assetEntry);
                    const assetRelPath = path.relative(process.cwd(), assetPath).replace(/\\/g, '/');
                    try {
                        const assetStat = fs.statSync(assetPath);
                        if (assetStat.isDirectory() && allowedSubdirs.includes(assetEntry)) {
                            getFiles(assetPath, allFiles);
                        } else if (assetStat.isFile() && allowedRootFiles.includes(assetEntry)) {
                            const hash = fileSHA256(assetPath);
                            allFiles.push({ path: assetRelPath, hash });
                        }
                    } catch { /* skip */ }
                });
                return;
            }

            getFiles(filePath, allFiles);
        } else {
            const ext = path.extname(file);
            const baseName = path.basename(file);

            // Skip dot-files (except .htaccess and .env.prod)
            if (baseName.startsWith('.') && baseName !== '.htaccess' && baseName !== '.env.prod') return;
            // Skip files in the explicit exclude list
            if (EXCLUDE_FILES.includes(baseName)) return;
            // Skip files matching excluded extensions
            if (EXCLUDE_EXTENSIONS.includes(ext)) return;
            // Skip files matching excluded prefixes
            if (EXCLUDE_PREFIXES.some(prefix => baseName.startsWith(prefix))) return;
            // Skip files matching excluded full paths
            if (EXCLUDE_PATHS.includes(relPath)) return;
            // Must have an extension (skip extensionless binaries/stray files)
            if (ext.length === 0 && baseName !== '.htaccess' && baseName !== '.env.prod') return;
            // Skip backup/original files
            if (baseName.includes('.bak') || baseName.includes('.orig')) return;

            const hash = fileSHA256(filePath);
            allFiles.push({ path: relPath, hash });
        }
    });

    return allFiles;
}

// ── Main ──
console.log('═══════════════════════════════════════════');
console.log('  Fusion ERP — Manifest Generator v3');
console.log('═══════════════════════════════════════════');
try {
    const startTime = Date.now();
    const files = getFiles(process.cwd());
    files.sort((a, b) => a.path.localeCompare(b.path));

    const manifest = {
        version: 3,
        generated_at: new Date().toISOString(),
        file_count: files.length,
        files: files,
    };

    fs.writeFileSync('deploy_manifest.json', JSON.stringify(manifest, null, 2));
    const elapsed = Date.now() - startTime;
    console.log(`✅ Manifest generato: ${files.length} file con hash SHA-256 (${elapsed}ms)`);
} catch (err) {
    console.error('❌ Error generating manifest:', err);
    process.exit(1);
}
