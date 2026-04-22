#!/usr/bin/env zsh
# ============================================================================
# Fusion ERP — Root Cleanup Script
# ============================================================================
# Moves stale test/debug/tmp/check files out of the project root into a
# quarantine folder. Run with --dry-run first to preview changes.
#
# Usage:
#   ./scripts/cleanup_root.sh              # Interactive mode (preview → confirm)
#   ./scripts/cleanup_root.sh --dry-run    # Preview only, no changes
#   ./scripts/cleanup_root.sh --force      # Skip confirmation, execute immediately
#   ./scripts/cleanup_root.sh --delete     # Delete instead of quarantine
#
# ============================================================================

set -eo pipefail

# --- Configuration ---
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
QUARANTINE_DIR="${PROJECT_ROOT}/.quarantine/${TIMESTAMP}"
DRY_RUN=false
FORCE=false
DELETE_MODE=false

# --- Parse arguments ---
for arg in "$@"; do
    case $arg in
        --dry-run)  DRY_RUN=true ;;
        --force)    FORCE=true ;;
        --delete)   DELETE_MODE=true ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--force] [--delete]"
            echo ""
            echo "  --dry-run   Preview files that would be cleaned up"
            echo "  --force     Skip confirmation prompt"
            echo "  --delete    Permanently delete instead of quarantine"
            echo ""
            exit 0
            ;;
    esac
done

# --- Banner ---
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           Fusion ERP — Root Cleanup Tool                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# --- Protected files (NEVER touch) ---
is_protected() {
    case "$1" in
        .DS_Store|.credentials|.deploy_cache.json|.dockerignore) return 0 ;;
        .env|.env.example|.env.prod|.gitignore|.htaccess) return 0 ;;
        .stylelintrc.json|Dockerfile|composer.json|composer.lock|composer.phar) return 0 ;;
        docker-compose.yml|eslint.config.mjs|index.html) return 0 ;;
        package.json|package-lock.json|phpunit.xml|phpstan.neon) return 0 ;;
        tsconfig.json|vite.config.js|sitemap.php|cron_trigger.php) return 0 ;;
        deploy.py|deploy.mp|metadata.xml|UX_UI_Review.md) return 0 ;;
        Sviluppo_ERP_Fusion.mp|brand_identity.mp) return 0 ;;
        modello_import_allenatori.csv|minify.py|setup_env.php) return 0 ;;
        capture_callback.php|resend.php|gas_proxy.gs|ping.php) return 0 ;;
        audit.py|audit2.py|compare_env.py|route_checker.py|sql_checker.py) return 0 ;;
        *) return 1 ;;
    esac
}

# --- Define categories and their glob patterns ---
# Format: "category_name|display_name|pattern1 pattern2 ..."
CATEGORIES=(
    "test_files|🧪 Test files|test_* test.* test[0-9]*.* testDB.* testList*.* test-* db_test.* public_*test* run_test.js"
    "tmp_files|🗑️  Temporary files|tmp_* temp_*"
    "debug_files|🐛 Debug scripts|debug_*.php debug_*.json fv_debug.* local_debug.*"
    "check_files|🔍 Check/verify scripts|check_* scratch_check_*"
    "fix_scripts|🔧 One-off fix scripts|fix_* fix-phpunit-casing"
    "dump_diag|📊 Dump/diagnostic scripts|dump_* diag_* desc_table.*"
    "output_files|📄 Output/result files|out.json out2.json out5.json out_router.txt output.txt output_test.txt output_cognito.txt"
    "cookie_files|🍪 Cookie/session files|cookie.txt cookies.txt mycookie*.txt"
    "cognito_debris|☁️  Cognito test data|cognito_*.json cognito_body.json"
    "log_report|📝 Log/report files|report.json report2.json phpstan_errors.json phpstan.log"
    "diff_txt|📑 Diff/discrepancy files|diff.txt full_diff.txt temp_diff.txt discrepancies.txt current_db_discrepancies.txt"
    "info_txt|ℹ️  Info/notes text files|athlete_cols.txt vald_info.txt remote_htaccess.txt full_models_list.txt prod_repo.txt"
    "old_scripts|📦 Obsolete scripts|old_trans.js outseason.js replace_athletes.* list_models.php list_teams.php find_models.php read_*.php query_db.php run_query.php vd.php get_errors_777.php public_getver_2.php"
    "stale_media|🎬 Stale media files|voice*.aiff *.webm presentation_*.mp4 emax.png dummy_logo.png"
    "one_off_scripts|⚡ One-off utility scripts|add_*.php apply_*.php inject_*.php update_*.php import_*.php run_import.php run_mig.php run_migrate.php fill_patchwork.py make_messy_patchwork.py generate_wow_video.py split_fipav.py parse_db.py admin_logs.php clean_acwr_table.php clear_cache.php prod_cleanup.php remove_acwr.php rename_index.py upload_test.py"
    "migration_onetime|🔄 Old migration scripts|run_migration_*.php _migrate_*.php migrate_*.php run_*_migration.py run_v050.php"
    "stale_misc|🧹 Miscellaneous debris|getMessage test local_empty.txt local_test_file.php team11.json teams.json entries.json schema.json prod_matchcenter.json plan.md"
    "deploy_onetime|🚀 One-off deploy scripts|deploy_repo.py deploy_single.py list_remote_migrations.py remove_v050_ftp.py run_tipo_migration.py"
    "data_dumps|💾 Data dumps|fusion_dump.sql database.sqlite audit-hardening.bundle"
)

# --- Scan & collect files ---
TOTAL_COUNT=0
TOTAL_SIZE=0
ALL_FILES=()        # flat list of all matched file paths
ALL_CATS=()         # parallel array: category for each file
ALL_DISPLAYS=()     # parallel array: display name for each category

# Track already-seen files to avoid duplicates
SEEN_FILES=""

for category_def in "${CATEGORIES[@]}"; do
    cat_key="${category_def%%|*}"
    rest="${category_def#*|}"
    cat_display="${rest%%|*}"
    cat_patterns="${rest#*|}"
    
    cat_count=0
    
    for pattern in ${(s: :)cat_patterns}; do
        for filepath in ${PROJECT_ROOT}/${~pattern}(N); do
            [ -f "$filepath" ] || continue
            
            filename="$(basename "$filepath")"
            
            # Skip protected
            if is_protected "$filename"; then
                continue
            fi
            
            # Skip duplicates
            if echo "$SEEN_FILES" | grep -qxF "$filepath"; then
                continue
            fi
            SEEN_FILES="${SEEN_FILES}${filepath}
"
            
            ALL_FILES+=("$filepath")
            ALL_CATS+=("$cat_key")
            ALL_DISPLAYS+=("$cat_display")
            
            fsize=$(stat -f%z "$filepath" 2>/dev/null || echo 0)
            TOTAL_SIZE=$((TOTAL_SIZE + fsize))
            TOTAL_COUNT=$((TOTAL_COUNT + 1))
            cat_count=$((cat_count + 1))
        done
    done
done

# --- Display results ---
if [ $TOTAL_COUNT -eq 0 ]; then
    echo "  ✅ Project root is clean! No debris found."
    echo ""
    exit 0
fi

# Human-readable size
if [ $TOTAL_SIZE -gt 1048576 ]; then
    SIZE_DISPLAY="$(echo "scale=1; $TOTAL_SIZE / 1048576" | bc) MB"
elif [ $TOTAL_SIZE -gt 1024 ]; then
    SIZE_DISPLAY="$(echo "scale=1; $TOTAL_SIZE / 1024" | bc) KB"
else
    SIZE_DISPLAY="${TOTAL_SIZE} B"
fi

echo "  ⚠  Found ${TOTAL_COUNT} debris files (${SIZE_DISPLAY}) in project root"
echo ""

# Print by category
current_cat=""
for i in $(seq 1 ${#ALL_FILES[@]}); do
    idx=$((i))
    filepath="${ALL_FILES[$idx]}"
    cat_key="${ALL_CATS[$idx]}"
    cat_display="${ALL_DISPLAYS[$idx]}"
    
    if [ "$cat_key" != "$current_cat" ]; then
        # Count files in this category
        ccount=0
        for j in $(seq 1 ${#ALL_CATS[@]}); do
            [ "${ALL_CATS[$j]}" = "$cat_key" ] && ccount=$((ccount + 1))
        done
        
        [ -n "$current_cat" ] && echo ""
        echo "  ${cat_display} (${ccount} files)"
        current_cat="$cat_key"
    fi
    
    fname="$(basename "$filepath")"
    fsize=$(stat -f%z "$filepath" 2>/dev/null || echo 0)
    if [ $fsize -gt 1024 ]; then
        fsize_display="$(echo "scale=1; $fsize / 1024" | bc) KB"
    else
        fsize_display="${fsize} B"
    fi
    echo "    ├── ${fname} (${fsize_display})"
done
echo ""

# --- Dry run stops here ---
if $DRY_RUN; then
    echo "  ℹ  Dry run complete. No files were modified."
    echo "     Run without --dry-run to clean up."
    echo ""
    exit 0
fi

# --- Confirmation ---
if ! $FORCE; then
    if $DELETE_MODE; then
        echo "  ⚠  DELETE MODE: Files will be permanently removed!"
    else
        echo "  📦 Files will be moved to: .quarantine/${TIMESTAMP}/"
    fi
    echo ""
    echo -n "  Proceed? (y/N): "
    read confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "  Cancelled."
        echo ""
        exit 0
    fi
fi

# --- Execute cleanup ---
echo ""

if ! $DELETE_MODE; then
    mkdir -p "$QUARANTINE_DIR"
fi

MOVED=0
FAILED=0

for i in $(seq 1 ${#ALL_FILES[@]}); do
    idx=$((i))
    filepath="${ALL_FILES[$idx]}"
    cat_key="${ALL_CATS[$idx]}"
    fname="$(basename "$filepath")"
    
    if $DELETE_MODE; then
        if rm -f "$filepath" 2>/dev/null; then
            echo "  ✗ Deleted: ${fname}"
            MOVED=$((MOVED + 1))
        else
            echo "  ✗ Failed to delete: ${fname}"
            FAILED=$((FAILED + 1))
        fi
    else
        mkdir -p "${QUARANTINE_DIR}/${cat_key}"
        if mv "$filepath" "${QUARANTINE_DIR}/${cat_key}/" 2>/dev/null; then
            echo "  → ${fname} → .quarantine/.../${cat_key}/"
            MOVED=$((MOVED + 1))
        else
            echo "  ✗ Failed to move: ${fname}"
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
if $DELETE_MODE; then
    printf "║  ✅ Deleted %d files                                        ║\n" $MOVED
else
    printf "║  ✅ Quarantined %d files                                    ║\n" $MOVED
fi
if [ $FAILED -gt 0 ]; then
    printf "║  ⚠  %d files failed                                        ║\n" $FAILED
fi
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if ! $DELETE_MODE; then
    echo "  Quarantine: ${QUARANTINE_DIR}"
    echo "  To restore: mv .quarantine/${TIMESTAMP}/<category>/<file> ./"
    echo "  To purge:   rm -rf .quarantine/"
    echo ""
    
    # Generate manifest
    {
        echo "Fusion ERP Cleanup Manifest"
        echo "=========================="
        echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Mode: quarantine"
        echo "Files moved: $MOVED"
        echo "Files failed: $FAILED"
    } > "${QUARANTINE_DIR}/cleanup_manifest.txt"
fi
