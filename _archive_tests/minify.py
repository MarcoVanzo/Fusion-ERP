#!/usr/bin/env python3
"""
minify.py — Minifica tutti i file JS del progetto Fusion ERP con terser.
I sorgenti originali vengono salvati nella cartella js/.src_backup/
prima della minificazione, così sono sempre ripristinabili.

Uso: python3 minify.py
"""
import os, subprocess, shutil, time

# Cartelle da minificare (ricorsive)
JS_DIRS = ['js/modules', 'js/core']

# File da NON minificare (già piccoli o usati per debug)
SKIP_FILES = set()

BACKUP_DIR = 'js/.src_backup'

def ensure_backup(filepath: str) -> None:
    """Salva il file originale nel backup (solo se il backup non esiste ancora)."""
    rel = os.path.relpath(filepath, 'js')
    backup_path = os.path.join(BACKUP_DIR, rel)
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
    if not os.path.exists(backup_path):
        shutil.copy2(filepath, backup_path)

def minify_file(filepath: str) -> tuple[int, int]:
    """Minifica un singolo file JS in-place con terser. Ritorna (orig_size, min_size)."""
    orig_size = os.path.getsize(filepath)

    result = subprocess.run(
        [
            'npx', '--yes', 'terser', filepath,
            '--compress', 'passes=2,drop_console=false,drop_debugger=true',
            '--mangle',
            '--output', filepath,
        ],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print(f'  ❌ ERROR: {filepath}')
        print(f'     {result.stderr.strip()[:200]}')
        return orig_size, orig_size

    min_size = os.path.getsize(filepath)
    return orig_size, min_size

def main():
    print('=== Fusion ERP JS Minifier (terser) ===\n')

    os.makedirs(BACKUP_DIR, exist_ok=True)

    total_orig = 0
    total_min  = 0
    files_done = 0

    for js_dir in JS_DIRS:
        if not os.path.isdir(js_dir):
            continue
        for fname in sorted(os.listdir(js_dir)):
            if not fname.endswith('.js'):
                continue
            if fname in SKIP_FILES:
                print(f'  ⏭  Skipped: {js_dir}/{fname}')
                continue

            fpath = os.path.join(js_dir, fname)
            ensure_backup(fpath)

            print(f'  ⚙️  Minifying {js_dir}/{fname} ...', end='', flush=True)
            t0 = time.time()
            orig, mini = minify_file(fpath)
            elapsed = time.time() - t0

            pct = round((1 - mini / orig) * 100) if orig > 0 else 0
            print(f' {orig//1024}K → {mini//1024}K  (-{pct}%)  [{elapsed:.1f}s]')

            total_orig += orig
            total_min  += mini
            files_done += 1

    print(f'\n✅ Done! {files_done} files minified.')
    total_pct = round((1 - total_min / total_orig) * 100) if total_orig > 0 else 0
    print(f'   Total: {total_orig//1024}K → {total_min//1024}K  (-{total_pct}%)')
    print(f'\n💡 Backup originali in: {BACKUP_DIR}/')

if __name__ == '__main__':
    main()
