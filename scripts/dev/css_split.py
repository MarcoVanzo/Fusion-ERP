#!/usr/bin/env python3
"""
CSS Splitter v2 — Extracts sections from style_v2.css into modular files.
Fixed: gaps, overlaps, and missing sections from v1.

IMPORTANT: Line ranges are 1-indexed, inclusive, and MUST be contiguous
(end of range N == start of range N+1 - 1). Validated at runtime.
"""

import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(BASE, "css", "style_v2.css")

# Read original (from a backup if built, or original source)
# First try the backup, then the current file
backup = os.path.join(BASE, "css", "style_v2.backup.css")
source = backup if os.path.exists(backup) else SRC

with open(source, "r", encoding="utf-8") as f:
    lines = f.readlines()

total = len(lines)
print(f"[CSS Splitter v2] Read {total} lines from {os.path.basename(source)}")

# Define extraction ranges (line numbers are 1-indexed, inclusive)
# RULE: ranges must be contiguous — no gaps allowed.
# Format: (output_file, start_line, end_line, description)
SECTIONS = [
    # ─── Base layer ───
    ("base/_tokens.css",      1,   101,  "Design tokens (:root variables)"),
    ("base/_reset.css",       102, 163,  "CSS reset & base styles"),
    ("base/_typography.css",  164, 223,  "Typography system"),

    # ─── Layout (shell = sidebar + topbar + search box) ───
    ("base/_shell.css",       224, 622,  "App shell, sidebar, topbar, search box"),

    # ─── Components ───
    ("components/_search.css",     623, 720,  "Global search results dropdown"),
    ("components/_buttons.css",    721, 757,  "Icon buttons, topbar actions"),
    ("components/_dropdown.css",   758, 870,  "Dropdown menu"),
    ("components/_forms.css",      871, 1412, "Form inputs, selects, textareas"),
    ("components/_badges.css",     1413, 1503, "Badges & ACWR gauge"),
    ("components/_toast.css",      1504, 1559, "Toast notifications"),
    ("components/_modal.css",      1560, 1635, "Modal system"),
    ("components/_skeleton.css",   1636, 1669, "Skeleton loaders"),

    # ─── Hero Athlete Profile + Documents Tab (was MISSING in v1!) ───
    ("modules/_athlete-profile.css", 1670, 1809, "Hero athlete profile + documents tab"),

    # ─── More components ───
    ("components/_tabs.css",       1810, 1941, "Tabs macro-component (THE TRENCH)"),
    ("components/_bottom-nav.css", 1942, 1991, "Mobile bottom nav"),
    ("components/_filters.css",    1992, 2023, "Filter bar"),
    ("components/_empty-state.css",2024, 2058, "Empty state component"),
    ("components/_upload.css",     2059, 2079, "Upload zone"),

    # ─── Auth ───
    ("modules/_auth.css",     2080, 2555, "Auth screen, login, animations"),

    # ─── Base utilities ───
    ("base/_scrollbar.css",   2556, 2573, "Scrollbar styling"),
    ("base/_utils.css",       2574, 2661, "Utility classes + image filters"),

    # ─── Module-specific ───
    ("modules/_splash.css",       2662, 2754, "Splash screen"),
    ("modules/_onboarding.css",   2755, 2881, "Onboarding screens + push badges"),
    ("modules/_social.css",       2882, 3480, "Social module (connect, dashboard, posts)"),
    ("modules/_tasks.css",        3481, 4300, "Tasks module"),
    ("modules/_finance.css",      4301, 4887, "Finance + compliance module"),
    ("modules/_profile.css",      4888, 5054, "Profile modal & avatar"),

    # ─── Late additions ───
    ("base/_accessibility.css",   5055, 5683, "Onboarding tour, WCAG fixes, utility extensions"),

    # ─── Extended modules ───
    ("modules/_extended.css",     5684, total, "Extended module styles (transport, ecommerce, staff, etc.)"),
]

# ─── VALIDATION ──────────────────────────────────────────────────────────────

# Sort by start line
SECTIONS.sort(key=lambda x: x[1])

errors = []
for i in range(len(SECTIONS)):
    fname, s, e, desc = SECTIONS[i]
    if s > e:
        errors.append(f"  {fname}: start ({s}) > end ({e})")
    if i > 0:
        prev_fname, _, prev_end, _ = SECTIONS[i-1]
        if s != prev_end + 1:
            gap = s - prev_end - 1
            if gap > 0:
                errors.append(f"  GAP: {gap} lines missing between {prev_fname} (end {prev_end}) and {fname} (start {s})")
            else:
                errors.append(f"  OVERLAP: {-gap} lines between {prev_fname} (end {prev_end}) and {fname} (start {s})")

if errors:
    print("\n🚨 VALIDATION ERRORS:")
    for e in errors:
        print(e)
    sys.exit(1)
else:
    print("✅ Validation passed: no gaps, no overlaps, full coverage")

# ─── EXTRACTION ──────────────────────────────────────────────────────────────

created = []
for filename, start, end, desc in SECTIONS:
    end = min(end, total)
    start_idx = max(0, start - 1)
    end_idx = end

    content_lines = lines[start_idx:end_idx]
    content = "".join(content_lines).strip()

    if not content:
        print(f"  ⚠️  Skipping {filename} (empty)")
        continue

    header = f"/* {desc}\n * Extracted from style_v2.css (lines {start}-{end})\n */\n\n"
    full_content = header + content + "\n"

    outpath = os.path.join(BASE, "css", filename)
    os.makedirs(os.path.dirname(outpath), exist_ok=True)

    with open(outpath, "w", encoding="utf-8") as f:
        f.write(full_content)

    line_count = len(content_lines)
    print(f"  ✅ {filename} ({line_count} lines) — {desc}")
    created.append(filename)

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

entry = """/* ═══════════════════════════════════════════════════════════════════════════
   Fusion ERP — CSS Entry Point
   All styles organized by layer: tokens → base → components → modules
   ════════════════════════════════════════════════════════════════════════════ */

/* ─── 1. Design System Foundation ─── */
@import url('base/_tokens.css');
@import url('base/_reset.css');
@import url('base/_typography.css');

/* ─── 2. Layout ─── */
@import url('base/_shell.css');

/* ─── 3. Components (shared, reusable) ─── */
@import url('components/_search.css');
@import url('components/_buttons.css');
@import url('components/_dropdown.css');
@import url('components/_forms.css');
@import url('components/_badges.css');
@import url('components/_toast.css');
@import url('components/_modal.css');
@import url('components/_skeleton.css');
@import url('components/_tabs.css');
@import url('components/_bottom-nav.css');
@import url('components/_filters.css');
@import url('components/_empty-state.css');
@import url('components/_upload.css');

/* ─── 4. Base Utilities ─── */
@import url('base/_scrollbar.css');
@import url('base/_utils.css');
@import url('base/_accessibility.css');

/* ─── 5. Module Styles ─── */
@import url('modules/_auth.css');
@import url('modules/_athlete-profile.css');
@import url('modules/_splash.css');
@import url('modules/_onboarding.css');
@import url('modules/_social.css');
@import url('modules/_tasks.css');
@import url('modules/_finance.css');
@import url('modules/_profile.css');
@import url('modules/_extended.css');
"""

entry_path = os.path.join(BASE, "css", "style.css")
with open(entry_path, "w", encoding="utf-8") as f:
    f.write(entry)

print(f"\n✅ Created entry point: css/style.css")
print(f"✅ Split into {len(created)} files")
print(f"✅ Total lines covered: {sum(min(e, total) - max(0, s-1) for _, s, e, _ in SECTIONS)}")
