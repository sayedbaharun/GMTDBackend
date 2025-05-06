document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const personalDetailsForm = document.getElementById('personal-details-form');
  const preferencesForm = document.getElementById('preferences-form');
  const contactPreferencesForm = document.getElementById('contact-preferences-form');
  const productSelectionForm = document.getElementById('product-selection-form');
  const paymentForm = document.getElementById('payment-form');
  
  const backButtons = {
    toStep1: document.getElementById('back-to-step-1'),
    toStep2: document.getElementById('back-to-step-2'),
    toStep3: document.getElementById('back-to-step-3'),
    toStep4: document.getElementById('back-to-step-4')
  };
  
  const serviceItems = document.querySelectorAll('.service-item');
  const servicesInput = document.getElementById('services');
  
  const contactMethodOptions = document.querySelectorAll('.contact-method-option');
  const contactMethodInput = document.getElementById('contact_method');
  
  const packageOptions = document.querySelectorAll('.package-option');
  const addonCheckboxes = document.querySelectorAll('.addon-item input[type="checkbox"]');
  
  const cardError = document.getElementById('card-errors');
  const buttonText = document.getElementById('button-text');
  const spinner = document.getElementById('spinner');
  
  const totalPriceElement = document.getElementById('total-price');
  const finalTotalPriceElement = document.getElementById('final-total-price');
  const addonSummary = document.getElementById('addon-summary');

  // State management
  let currentStep = 1;
  const userData = {
    personalDetails: {},
    preferences: {
      services: []
    },
    contactPreferences: {},
    productSelection: {
      package: 'premium',
      addons: [],
      totalPrice: 499
    },
    payment: {}
  };
  
  let stripe;
  let elements;
  let card;

  // Initialize Stripe elements
  function initializeStripe() {
    // Fetch the Stripe public key from the server
    fetch('/api/stripe-key')
      .then(response => response.json())
      .then(data => {
        if (data.publicKey) {
          stripe = Stripe(data.publicKey);
          elements = stripe.elements();
          card = elements.create('card');
          card.mount('#card-element');
          
          // Handle real-time validation errors from the card Element
          card.on('change', function(event) {
            if (event.error) {
              cardError.textContent = event.error.message;
            } else {
              cardError.textContent = '';
            }
          });
        } else {
          console.error('No Stripe public key available');
          cardError.textContent = 'Unable to initialize payment form. Please try again later.';
        }
      })
      .catch(error => {
        console.error('Error fetching Stripe key:', error);
        cardError.textContent = 'Unable to initialize payment form. Please try again later.';
      });
  }

  // Update step indicators in the UI
  function updateStepIndicators(step) {
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('active');
      const stepNumber = parseInt(el.getAttribute('data-step'));
      if (stepNumber < step) {
        el.classList.add('completed');
      } else if (stepNumber === step) {
        el.classList.add('active');
      } else {
        el.classList.remove('completed');
      }
    });
  }

  // Show a specific step and hide others
  function showStep(step) {
    document.querySelectorAll('.onboarding-step-content').forEach(el => {
      el.style.display = 'none';
    });
    document.getElementById(`step-${step}`).style.display = 'block';
    currentStep = step;
    updateStepIndicators(step);

    // Initialize Stripe when reaching payment step
    if (step === 5 && !card) {
      initializeStripe();
    }
    
    // Update final summary if going to payment step
    if (step === 5) {
      updateFinalSummary();
    }
  }
  
  // Update the order summary on the payment page
  function updateFinalSummary() {
    let summaryHTML = '';
    const product = userData.productSelection;
    
    // Add selected package
    const packageName = product.package === 'premium' ? 'Premium Dubai Experience' : 'Ultimate Dubai Luxury';
    const packagePrice = product.package === 'premium' ? 499 : 999;
    
    summaryHTML += `
      <div class="summary-row">
        <div>${packageName}</div>
        <div>$${packagePrice}</div>
      </div>
    `;
    
    // Add any selected add-ons
    if (product.addons.length > 0) {
      product.addons.forEach(addon => {
        let addonName = '';
        let addonPrice = 0;
        
        if (addon === 'Desert Safari') {
          addonName = 'Desert Safari';
          addonPrice = 150;
        } else if (addon === 'VIP Shopping') {
          addonName = 'VIP Shopping Experience';
          addonPrice = 200;
        } else if (addon === 'Private Chef') {
          addonName = 'Private Chef Experience';
          addonPrice = 300;
        }
        
        summaryHTML += `
          <div class="summary-row">
            <div>${addonName}</div>
            <div>$${addonPrice}</div>
          </div>
        `;
      });
    }
    
    // Add total
    summaryHTML += `
      <div class="summary-row total">
        <div>Total</div>
        <div>$${product.totalPrice}</div>
      </div>
    `;
    
    document.getElementById('final-summary').innerHTML = summaryHTML;
    finalTotalPriceElement.textContent = `$${product.totalPrice}`;
  }
  
  // Calculate the total price based on selected package and add-ons
  function calculateTotalPrice() {
    const packagePrice = userData.productSelection.package === 'premium' ? 499 : 999;
    let addonPrice = 0;
    
    userData.productSelection.addons.forEach(addon => {
      if (addon === 'Desert Safari') addonPrice += 150;
      else if (addon === 'VIP Shopping') addonPrice += 200;
      else if (addon === 'Private Chef') addonPrice += 300;
    });
    
    const totalPrice = packagePrice + addonPrice;
    userData.productSelection.totalPrice = totalPrice;
    
    // Update the UI
    totalPriceElement.textContent = `$${totalPrice}`;
    
    // Show/hide addon summary based on whether any addons are selected
    if (userData.productSelection.addons.length > 0) {
      addonSummary.style.display = 'flex';
      addonSummary.querySelector('div:last-child').textContent = `$${addonPrice}`;
    } else {
      addonSummary.style.display = 'none';
    }
  }

  // Handle personal details form submission
  if (personalDetailsForm) {
    personalDetailsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(personalDetailsForm);
      
      // Convert FormData to object
      userData.personalDetails = Object.fromEntries(formData.entries());
      
      // Send data to server
      savePersonalDetails(userData.personalDetails)
        .then(() => {
          showStep(2);
        })
        .catch(error => {
          console.error('Error saving personal details:', error);
          alert('There was an error saving your information. Please try again.');
        });
    });
  }

  // Handle preferences form submission
  if (preferencesForm) {
    preferencesForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(preferencesForm);
      
      // Add selected services to form data
      formData.set('services', JSON.stringify(userData.preferences.services));
      
      // Convert FormData to object
      userData.preferences = Object.fromEntries(formData.entries());
      
      // Parse services back to array
      userData.preferences.services = JSON.parse(userData.preferences.services);
      
      // Send data to server
      savePreferences(userData.preferences)
        .then(() => {
          showStep(3);
        })
        .catch(error => {
          console.error('Error saving preferences:', error);
          alert('There was an error saving your preferences. Please try again.');
        });
    });
  }

  // Handle contact preferences form submission
  if (contactPreferencesForm) {
    contactPreferencesForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(contactPreferencesForm);
      
      // Convert FormData to object
      userData.contactPreferences = Object.fromEntries(formData.entries());
      
      // Send data to server
      saveContactPreferences(userData.contactPreferences)
        .then(() => {
          showStep(4);
        })
        .catch(error => {
          console.error('Error saving contact preferences:', error);
          alert('There was an error saving your contact preferences. Please try again.');
        });
    });
  }

  // Handle product selection form submission
  if (productSelectionForm) {
    productSelectionForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(productSelectionForm);
      
      // Convert FormData to object and merge with existing productSelection data
      const formDataObj = Object.fromEntries(formData.entries());
      userData.productSelection = {
        ...userData.productSelection,
        ...formDataObj
      };
      
      // Send data to server
      saveProductSelection(userData.productSelection)
        .then(() => {
          showStep(5);
        })
        .catch(error => {
          console.error('Error saving product selection:', error);
          alert('There was an error saving your product selection. Please try again.');
        });
    });
  }

  // Handle payment form submission
  if (paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!document.getElementById('terms_agreement').checked) {
        cardError.textContent = 'You must agree to the Terms and Conditions to proceed.';
        return;
      }
      
      // Disable the submit button to prevent multiple clicks
      paymentForm.querySelector('button[type="submit"]').disabled = true;
      buttonText.style.display = 'none';
      spinner.style.display = 'inline-block';
      
      // Create payment method and handle form submission
      stripe.createPaymentMethod({
        type: 'card',
        card: card,
      }).then(function(result) {
        if (result.error) {
          // Show error in payment form
          cardError.textContent = result.error.message;
          paymentForm.querySelector('button[type="submit"]').disabled = false;
          buttonText.style.display = 'inline-block';
          spinner.style.display = 'none';
        } else {
          // Send payment method to server
          userData.payment.paymentMethodId = result.paymentMethod.id;
          userData.payment.amount = userData.productSelection.totalPrice;
          userData.payment.currency = 'usd';
          
          processPayment(userData.payment)
            .then(() => {
              completeOnboarding()
                .then(() => {
                  showStep('complete'); // Show completion step
                })
                .catch(error => {
                  console.error('Error completing onboarding:', error);
                  alert('There was an error finalizing your account. Please contact support.');
                });
            })
            .catch(error => {
              console.error('Error processing payment:', error);
              cardError.textContent = 'There was an error processing your payment. Please try again.';
              paymentForm.querySelector('button[type="submit"]').disabled = false;
              buttonText.style.display = 'inline-block';
              spinner.style.display = 'none';
            });
        }
      });
    });
  }

  // Service selection
  serviceItems.forEach(item => {
    item.addEventListener('click', function() {
      this.classList.toggle('selected');
      const service = this.getAttribute('data-service');
      
      if (this.classList.contains('selected')) {
        userData.preferences.services.push(service);
      } else {
        userData.preferences.services = userData.preferences.services.filter(s => s !== service);
      }
      
      // Update hidden input with selected services
      servicesInput.value = JSON.stringify(userData.preferences.services);
    });
  });

  // Contact method selection
  contactMethodOptions.forEach(option => {
    option.addEventListener('click', function() {
      contactMethodOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      const method = this.getAttribute('data-method');
      contactMethodInput.value = method;
    });
  });

  // Package selection
  packageOptions.forEach(option => {
    option.addEventListener('click', function() {
      packageOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      const packageType = this.getAttribute('data-package');
      userData.productSelection.package = packageType;
      
      // Update order summary
      const summaryPackageRow = document.querySelector('.order-summary .summary-row:first-child div:first-child');
      if (summaryPackageRow) {
        summaryPackageRow.textContent = packageType === 'premium' ? 'Premium Dubai Experience' : 'Ultimate Dubai Luxury';
      }
      
      calculateTotalPrice();
    });
  });
  
  // Add-on selection
  addonCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const addonItem = this.closest('.addon-item');
      const addon = addonItem.getAttribute('data-addon');
      
      if (this.checked) {
        userData.productSelection.addons.push(addon);
      } else {
        userData.productSelection.addons = userData.productSelection.addons.filter(a => a !== addon);
      }
      
      calculateTotalPrice();
    });
  });

  // Back button handlers
  Object.entries(backButtons).forEach(([key, button]) => {
    if (button) {
      button.addEventListener('click', function() {
        const step = parseInt(key.replace('toStep', ''));
        showStep(step);
      });
    }
  });

  // API functions
  async function savePersonalDetails(data) {
    try {
      const response = await fetch('/api/onboarding/user-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save personal details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async function savePreferences(data) {
    try {
      const response = await fetch('/api/onboarding/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  async function saveContactPreferences(data) {
    try {
      const response = await fetch('/api/onboarding/contact-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save contact preferences');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  async function saveProductSelection(data) {
    try {
      const response = await fetch('/api/onboarding/product-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save product selection');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async function processPayment(data) {
    try {
      const response = await fetch('/api/onboarding/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to process payment');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async function completeOnboarding() {
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      const data = await response.json();
      
      // Set confirmation number if available
      if (data.confirmationNumber) {
        document.getElementById('confirmation-number').textContent = data.confirmationNumber;
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  function getAuthToken() {
    // In a real app, get this from localStorage or cookies
    return localStorage.getItem('authToken') || '';
  }

  // Initialize the first step
  showStep(1);
});