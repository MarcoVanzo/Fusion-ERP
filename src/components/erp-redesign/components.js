/**
 * components.js
 * Vanilla JS logic for the ERP Redesign module.
 */

class ERPUI {
  constructor() {
    this.toastContainer = null;
    this.init();
  }

  init() {
    this.setupToastContainer();
    this.initTableSorting();
    this.initFormValidation();
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  setupToastContainer() {
    let container = document.querySelector('.erp-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'erp-toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  showToast(type, title, message, duration = 3000) {
    if (!this.toastContainer) this.setupToastContainer();

    const toast = document.createElement('div');
    toast.className = `erp-toast erp-toast--${type}`;
    toast.setAttribute('role', 'alert');

    const icons = {
      'success': '✓',
      'error': '✕',
      'info': 'i'
    };

    toast.innerHTML = `
      <div class="erp-toast-icon" aria-hidden="true">${icons[type] || '•'}</div>
      <div class="erp-toast-content">
        <h4 class="erp-toast-title">${title}</h4>
        <p class="erp-toast-msg">${message}</p>
      </div>
      <button class="erp-toast-close" aria-label="Chiudi notifica">&times;</button>
    `;

    this.toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.erp-toast-close');
    
    const closeToast = () => {
      toast.classList.add('closing');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    };

    closeBtn.addEventListener('click', closeToast);

    if (duration > 0) {
      setTimeout(() => {
        if (document.body.contains(toast)) {
          closeToast();
        }
      }, duration);
    }
  }

  // =========================================================================
  // TABLE SORTING
  // =========================================================================
  initTableSorting() {
    const sortableHeaders = document.querySelectorAll('.erp-table-sortable');
    
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const table = header.closest('.erp-table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        // Find index of the clicked th
        const thArray = Array.from(header.parentNode.children);
        const index = thArray.indexOf(header);
        
        // Determine order
        const currentSort = header.getAttribute('aria-sort');
        const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';
        
        // Reset all headers
        sortableHeaders.forEach(th => th.removeAttribute('aria-sort'));
        header.setAttribute('aria-sort', newSort);

        // Sort rows
        rows.sort((rowA, rowB) => {
          const cellA = rowA.children[index].textContent.trim();
          const cellB = rowB.children[index].textContent.trim();
          
          if (!isNaN(cellA) && !isNaN(cellB)) {
            return newSort === 'ascending' ? cellA - cellB : cellB - cellA;
          }
          
          return newSort === 'ascending' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        });

        // Re-append sorted rows
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
      });
      
      // Accessibility - handle enter key for sorting
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  // =========================================================================
  // FORM VALIDATION (Inline feedback)
  // =========================================================================
  initFormValidation() {
    const inlineForms = document.querySelectorAll('.erp-form-js');
    
    inlineForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        const requiredInputs = form.querySelectorAll('[required]');
        
        requiredInputs.forEach(input => {
          if (!input.value.trim()) {
            input.setAttribute('aria-invalid', 'true');
            isValid = false;
          } else {
            input.removeAttribute('aria-invalid');
          }
        });

        if (isValid) {
          const btn = form.querySelector('button[type="submit"]');
          const originalText = btn.textContent;
          btn.textContent = 'Salvataggio...';
          btn.disabled = true;

          // Simulazione salvataggio + Skeleton loading demo context (if skeleton table exists)
          this.toggleSkeletons(true);

          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            this.showToast('success', 'Operazione completata', 'I dati sono stati salvati correttamente.');
            this.toggleSkeletons(false);
            form.reset();
          }, 1500);
        } else {
          this.showToast('error', 'Validazione Form', 'Controlla i campi in rosso.', 4000);
          // Focus sul primo elemento non valido
          const firstInvalid = form.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
        }
      });

      // Clear validation state on input
      const inputs = form.querySelectorAll('.erp-input, .erp-select');
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          input.removeAttribute('aria-invalid');
        });
      });
    });
  }

  // =========================================================================
  // SKELETON LOADER DEMO LOGIC
  // =========================================================================
  toggleSkeletons(show) {
    const dataViews = document.querySelectorAll('.erp-data-view');
    const skeletonViews = document.querySelectorAll('.erp-skeleton-view');
    
    if (show) {
      dataViews.forEach(v => v.classList.add('erp-hidden'));
      skeletonViews.forEach(v => v.classList.remove('erp-hidden'));
    } else {
      dataViews.forEach(v => v.classList.remove('erp-hidden'));
      skeletonViews.forEach(v => v.classList.add('erp-hidden'));
    }
  }

}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.ERPUIInstance = new ERPUI();
});
