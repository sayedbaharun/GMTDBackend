document.addEventListener('DOMContentLoaded', function() {
  // Inherit common dashboard functionality
  const dashboardScript = document.createElement('script');
  dashboardScript.src = '/js/dashboard.js';
  document.head.appendChild(dashboardScript);

  // Admin-specific DOM Elements
  const settingsNavItems = document.querySelectorAll('.settings-nav-item');
  const settingsPanels = document.querySelectorAll('.settings-panel');

  // Settings panel navigation (if present)
  if (settingsNavItems && settingsPanels) {
    settingsNavItems.forEach(item => {
      item.addEventListener('click', function() {
        const panelId = this.getAttribute('data-settings');
        
        // Update active state in navigation
        settingsNavItems.forEach(nav => {
          nav.classList.remove('active');
        });
        this.classList.add('active');
        
        // Hide all panels and show the selected one
        settingsPanels.forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(`${panelId}-settings`).classList.add('active');
      });
    });
  }

  // Table sorting (if present)
  const tableSortHeaders = document.querySelectorAll('th i.bi-arrow-down-up');
  if (tableSortHeaders) {
    tableSortHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const headerCell = this.parentElement;
        const table = headerCell.closest('table');
        const index = Array.from(headerCell.parentElement.children).indexOf(headerCell);
        let sortDirection = headerCell.getAttribute('data-sort') === 'asc' ? 'desc' : 'asc';
        
        // Update sort direction attribute
        headerCell.setAttribute('data-sort', sortDirection);
        
        // Update sort icon
        tableSortHeaders.forEach(icon => {
          icon.classList.remove('bi-arrow-down', 'bi-arrow-up');
          icon.classList.add('bi-arrow-down-up');
        });
        this.classList.remove('bi-arrow-down-up');
        this.classList.add(sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down');
        
        // Perform table sorting (in a real implementation)
        // This is just a visual demonstration
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Simulate sorting effect by reversing rows
        rows.reverse();
        
        // Clear the table body
        while (tbody.firstChild) {
          tbody.removeChild(tbody.firstChild);
        }
        
        // Append the sorted rows
        rows.forEach(row => {
          tbody.appendChild(row);
        });
      });
    });
  }
  
  // Package add-ons calculation (if present)
  const addonCheckboxes = document.querySelectorAll('.addon-item input[type="checkbox"]');
  const totalPriceElement = document.getElementById('total-price');
  const addonSummary = document.getElementById('addon-summary');
  
  function calculateTotalPrice() {
    if (!totalPriceElement) return;
    
    let basePrice = 499; // Default base price
    const packageOptions = document.querySelectorAll('.package-option');
    
    if (packageOptions.length > 0) {
      // Find selected package
      const selectedPackage = document.querySelector('.package-option.selected');
      if (selectedPackage) {
        basePrice = selectedPackage.getAttribute('data-package') === 'premium' ? 499 : 999;
      }
    }
    
    let addonPrice = 0;
    let selectedAddons = 0;
    
    addonCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedAddons++;
        if (checkbox.id === 'addon_desert_safari') {
          addonPrice += 150;
        } else if (checkbox.id === 'addon_vip_shopping') {
          addonPrice += 200;
        } else if (checkbox.id === 'addon_private_chef') {
          addonPrice += 300;
        }
      }
    });
    
    const totalPrice = basePrice + addonPrice;
    totalPriceElement.textContent = `$${totalPrice}`;
    
    // Update the final summary if present
    const finalTotalPriceElement = document.getElementById('final-total-price');
    if (finalTotalPriceElement) {
      finalTotalPriceElement.textContent = `$${totalPrice}`;
    }
    
    // Show/hide the addon summary based on whether any addons are selected
    if (addonSummary) {
      if (selectedAddons > 0) {
        addonSummary.style.display = 'flex';
        addonSummary.querySelector('div:last-child').textContent = `$${addonPrice}`;
      } else {
        addonSummary.style.display = 'none';
      }
    }
    
    return totalPrice;
  }
  
  if (addonCheckboxes && addonCheckboxes.length > 0) {
    addonCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', calculateTotalPrice);
    });
    
    // Initial calculation
    calculateTotalPrice();
  }
  
  // Package selection handling (if present)
  const packageOptions = document.querySelectorAll('.package-option');
  if (packageOptions.length > 0) {
    packageOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Deselect all packages
        packageOptions.forEach(pkg => {
          pkg.classList.remove('selected');
        });
        
        // Select this package
        this.classList.add('selected');
        
        // Update summary if present
        const summaryPackageRow = document.querySelector('.order-summary .summary-row:first-child div:first-child');
        if (summaryPackageRow) {
          const packageName = this.getAttribute('data-package') === 'premium' ? 'Premium Dubai Experience' : 'Ultimate Dubai Luxury';
          summaryPackageRow.textContent = packageName;
        }
        
        // Recalculate total price
        calculateTotalPrice();
      });
    });
  }
  
  // Filter functionality (if present)
  const filterButtons = document.querySelectorAll('.btn-secondary:contains("Filter")');
  if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        // In a real implementation, this would filter data
        // For the demo, we'll just show a notification
        alert('Filtering applied. In a real application, this would filter the data based on your selections.');
      });
    });
  }
  
  // Maintenance mode toggle (if present)
  const maintenanceModeToggle = document.getElementById('maintenance_mode');
  if (maintenanceModeToggle) {
    maintenanceModeToggle.addEventListener('change', function() {
      const maintenanceFields = document.querySelectorAll('#maintenance_message, #maintenance_date, #maintenance_time, #maintenance_duration');
      
      if (this.checked) {
        maintenanceFields.forEach(field => {
          field.removeAttribute('disabled');
        });
      } else {
        maintenanceFields.forEach(field => {
          field.setAttribute('disabled', 'disabled');
        });
      }
    });
  }
});