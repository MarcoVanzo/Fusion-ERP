/* ═══════════════════════════════════════════════════════════════════════════
   Fusion ERP — DatePicker Module
   Automatically enhances <input type="date"> and <input type="datetime-local">
   with Flatpickr calendar/time picker.
   ════════════════════════════════════════════════════════════════════════════ */

const DatePicker = (() => {
    'use strict';

    /* ── Italian locale ────────────────────────────────────────────────────── */
    const IT_LOCALE = {
        firstDayOfWeek: 1,
        weekdays: {
            shorthand: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
            longhand: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
        },
        months: {
            shorthand: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
            longhand: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
        },
        rangeSeparator: ' — ',
        time_24hr: true
    };

    /* ── Track initialized instances to prevent duplicates & allow cleanup ── */
    const _instances = new WeakMap();

    /**
     * Initialize Flatpickr on a single input element.
     * Skips if already initialized.
     */
    function _initSingle(input) {
        if (_instances.has(input) || !input || input.dataset.fpOmit === 'true') return;

        const isDateTime = input.type === 'datetime-local';
        const isDate = input.type === 'date';
        if (!isDate && !isDateTime) return;

        // Preserve existing value
        const existingValue = input.value;

        const config = {
            locale: IT_LOCALE,
            animate: true,
            allowInput: true,
            disableMobile: true,        // always use Flatpickr, even on mobile
            enableTime: isDateTime,
            time_24hr: true,
            dateFormat: isDateTime ? 'Y-m-d\\TH:i' : 'Y-m-d',
            altInput: true,
            altFormat: isDateTime ? 'd M Y — H:i' : 'd M Y',
            theme: 'dark',
            defaultDate: existingValue || null,
            position: 'auto',
            monthSelectorType: 'dropdown',
            prevArrow: '<i class="ph ph-caret-left"></i>',
            nextArrow: '<i class="ph ph-caret-right"></i>',
            onReady(_, __, fp) {
                // Add custom class to container for our styling
                fp.calendarContainer.classList.add('fusion-datepicker');
                // Style the alt input to match form-input class
                if (fp.altInput) {
                    fp.altInput.classList.add('form-input');
                    // Preserve original classes
                    input.classList.forEach(cls => {
                        if (cls !== 'flatpickr-input') fp.altInput.classList.add(cls);
                    });
                }
            },
            onChange(selectedDates, dateStr) {
                // Fire native change event so existing handlers pick it up
                const ev = new Event('change', { bubbles: true });
                input.dispatchEvent(ev);
            }
        };

        try {
            const fp = flatpickr(input, config);
            _instances.set(input, fp);
        } catch (err) {
            console.warn('[DatePicker] Failed to init on', input, err);
        }
    }

    /**
     * Scan a container (or the whole document) and initialize all date inputs.
     */
    function initAll(root = document) {
        const inputs = root.querySelectorAll('input[type="date"], input[type="datetime-local"]');
        inputs.forEach(_initSingle);
    }

    /**
     * Destroy Flatpickr instance on a single input.
     */
    function destroy(input) {
        const fp = _instances.get(input);
        if (fp) {
            fp.destroy();
            _instances.delete(input);
        }
    }

    /**
     * Destroy all instances within a root element.
     */
    function destroyAll(root = document) {
        const inputs = root.querySelectorAll('input[type="date"], input[type="datetime-local"]');
        inputs.forEach(destroy);
    }

    /* ── MutationObserver: auto-init new date inputs added to the DOM ──── */
    const _observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                // Check if the added node itself is a date input
                if (node.matches && node.matches('input[type="date"], input[type="datetime-local"]')) {
                    _initSingle(node);
                }
                // Check children
                if (node.querySelectorAll) {
                    const inputs = node.querySelectorAll('input[type="date"], input[type="datetime-local"]');
                    inputs.forEach(_initSingle);
                }
            }
        }
    });

    /* ── Bootstrap ─────────────────────────────────────────────────────── */
    function start() {
        // Init any already-present inputs
        initAll();
        // Watch for dynamically added inputs (modals, tabs, etc.)
        _observer.observe(document.body, { childList: true, subtree: true });
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        // Small delay to let other modules render first
        setTimeout(start, 100);
    }

    /* ── Public API ────────────────────────────────────────────────────── */
    return { initAll, destroy, destroyAll, start };
})();
