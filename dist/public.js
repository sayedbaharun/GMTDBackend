"use strict";
/**
 * This file exports a simple function to render an HTML page showing the API documentation
 * and providing an interface to test the API endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtml = renderHtml;
function renderHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Express API Backend</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    h2 {
      margin-top: 30px;
    }
    .endpoint {
      background-color: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 10px 15px;
      margin-bottom: 15px;
    }
    .method {
      font-weight: bold;
      color: #28a745;
      display: inline-block;
      min-width: 60px;
    }
    .method.post {
      color: #fd7e14;
    }
    .url {
      font-family: monospace;
    }
    .description {
      margin-top: 5px;
      color: #666;
    }
    .btn {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 10px;
      cursor: pointer;
    }
    .btn:hover {
      background-color: #0069d9;
    }
    .result {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
      white-space: pre-wrap;
      font-family: monospace;
      display: none;
    }
  </style>
</head>
<body>
  <h1>Express API Backend</h1>
  <p>This is a demonstration of the Express backend API with TypeScript for Next.js applications. The backend includes Auth0 authentication, Pusher real-time features, multi-step onboarding, and Stripe subscription management.</p>
  
  <h2>Health Check</h2>
  <div class="endpoint">
    <div><span class="method">GET</span> <span class="url">/health</span></div>
    <div class="description">Check if the server is running correctly.</div>
    <button class="btn" onclick="testHealthCheck()">Test Endpoint</button>
  </div>
  <div id="healthCheckResult" class="result"></div>
  
  <h2>Stripe Integration</h2>
  <div class="endpoint">
    <div><span class="method">GET</span> <span class="url">/api/test/stripe</span></div>
    <div class="description">Test Stripe connection and configuration.</div>
    <button class="btn" onclick="testStripeConnection()">Test Endpoint</button>
  </div>
  <div id="stripeConnectionResult" class="result"></div>
  
  <div class="endpoint">
    <div><span class="method">GET</span> <span class="url">/api/test/products</span></div>
    <div class="description">List all Stripe products and prices.</div>
    <button class="btn" onclick="listProducts()">Test Endpoint</button>
  </div>
  <div id="productsResult" class="result"></div>
  
  <div class="endpoint">
    <div><span class="method post">POST</span> <span class="url">/api/test/create-checkout</span></div>
    <div class="description">Create a Stripe checkout session for subscription.</div>
    <button class="btn" onclick="createCheckout()">Test Endpoint</button>
  </div>
  <div id="checkoutResult" class="result"></div>
  
  <h2>Payment Intent</h2>
  <div class="endpoint">
    <div><span class="method post">POST</span> <span class="url">/api/payments/create-payment-intent</span></div>
    <div class="description">Create a payment intent for one-time payments.</div>
    <button class="btn" onclick="createPaymentIntent()">Test Endpoint</button>
  </div>
  <div id="paymentIntentResult" class="result"></div>

  <script>
    // Helper function to make API calls and display results
    async function fetchAPI(url, method = 'GET', body = null) {
      try {
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        if (body) {
          options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        return {
          status: response.status,
          data
        };
      } catch (error) {
        return {
          status: 500,
          data: { error: error.message }
        };
      }
    }
    
    // Function to display results
    function displayResult(elementId, result) {
      const element = document.getElementById(elementId);
      element.textContent = JSON.stringify(result, null, 2);
      element.style.display = 'block';
    }
    
    // Health check endpoint
    async function testHealthCheck() {
      const result = await fetchAPI('/health');
      displayResult('healthCheckResult', result);
    }
    
    // Test Stripe connection
    async function testStripeConnection() {
      const result = await fetchAPI('/api/test/stripe');
      displayResult('stripeConnectionResult', result);
    }
    
    // List Stripe products
    async function listProducts() {
      const result = await fetchAPI('/api/test/products');
      displayResult('productsResult', result);
    }
    
    // Create checkout session
    async function createCheckout() {
      const result = await fetchAPI('/api/test/create-checkout', 'POST', {});
      
      if (result.status === 200 && result.data.url) {
        // Add the option to redirect to the checkout URL
        const checkoutResult = document.getElementById('checkoutResult');
        checkoutResult.textContent = JSON.stringify(result, null, 2);
        checkoutResult.style.display = 'block';
        
        // Create a button to redirect to the checkout page
        const redirectBtn = document.createElement('button');
        redirectBtn.className = 'btn';
        redirectBtn.style.marginTop = '10px';
        redirectBtn.textContent = 'Go to Checkout Page';
        redirectBtn.onclick = () => window.open(result.data.url, '_blank');
        
        // Remove any existing button before adding a new one
        const existingBtn = checkoutResult.nextElementSibling;
        if (existingBtn && existingBtn.tagName === 'BUTTON') {
          existingBtn.remove();
        }
        
        checkoutResult.after(redirectBtn);
      } else {
        displayResult('checkoutResult', result);
      }
    }
    
    // Create payment intent
    async function createPaymentIntent() {
      const result = await fetchAPI('/api/payments/create-payment-intent', 'POST', { amount: 1999 });
      displayResult('paymentIntentResult', result);
    }
  </script>
</body>
</html>`;
}
//# sourceMappingURL=public.js.map