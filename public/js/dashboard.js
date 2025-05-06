document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const dashboardPanels = document.querySelectorAll('.dashboard-panel');
  const menuToggle = document.getElementById('menu-toggle');
  const closeSidebar = document.getElementById('close-sidebar');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const userMenuToggle = document.querySelector('.user-menu-toggle');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const dropdownItems = document.querySelectorAll('.dropdown-item');

  // Navigation handling
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the panel to show
      const panelId = this.getAttribute('data-panel');
      
      // Update active state in navigation
      navItems.forEach(nav => {
        nav.classList.remove('active');
      });
      this.classList.add('active');
      
      // Hide all panels and show the selected one
      dashboardPanels.forEach(panel => {
        panel.classList.remove('active');
      });
      document.getElementById(`${panelId}-panel`).classList.add('active');
      
      // On mobile, close the sidebar after navigation
      if (window.innerWidth < 768) {
        sidebar.classList.remove('active');
      }
    });
  });
  
  // Dropdown items navigation handling
  dropdownItems.forEach(item => {
    const panelId = item.getAttribute('data-panel');
    if (panelId) {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active state in navigation
        navItems.forEach(nav => {
          nav.classList.remove('active');
          if (nav.getAttribute('data-panel') === panelId) {
            nav.classList.add('active');
          }
        });
        
        // Hide all panels and show the selected one
        dashboardPanels.forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(`${panelId}-panel`).classList.add('active');
        
        // Close the dropdown menu
        dropdownMenu.style.display = 'none';
      });
    }
  });

  // Mobile sidebar toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.add('active');
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener('click', function() {
      sidebar.classList.remove('active');
    });
  }

  // User dropdown menu toggle
  if (userMenuToggle) {
    userMenuToggle.addEventListener('click', function() {
      if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
      } else {
        dropdownMenu.style.display = 'block';
      }
    });
  }

  // Close dropdown menu when clicking outside
  document.addEventListener('click', function(e) {
    if (userMenuToggle && !userMenuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.style.display = 'none';
    }
  });

  // FAQ toggles (if present)
  const faqQuestions = document.querySelectorAll('.faq-question');
  if (faqQuestions) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', function() {
        const answer = this.nextElementSibling;
        if (answer.style.display === 'block') {
          answer.style.display = 'none';
          this.querySelector('i').classList.remove('bi-chevron-up');
          this.querySelector('i').classList.add('bi-chevron-down');
        } else {
          answer.style.display = 'block';
          this.querySelector('i').classList.remove('bi-chevron-down');
          this.querySelector('i').classList.add('bi-chevron-up');
        }
      });
    });
  }

  // Support tabs (if present)
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabButtons && tabContents) {
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Update active state on buttons
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        
        // Show selected tab content
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });
  }

  // Travel preference buttons (if present)
  const preferenceButtons = document.querySelectorAll('.preference-button');
  if (preferenceButtons) {
    preferenceButtons.forEach(button => {
      button.addEventListener('click', function() {
        // If it's a single-select group, deselect others
        if (!this.parentElement.classList.contains('multi-select')) {
          preferenceButtons.forEach(btn => {
            if (btn.parentElement === this.parentElement) {
              btn.classList.remove('active');
            }
          });
        }
        this.classList.toggle('active');
      });
    });
  }
});