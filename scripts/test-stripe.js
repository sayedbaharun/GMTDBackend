require('dotenv').config();
const Stripe = require('stripe');

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function testStripeConnection() {
  try {
    console.log('Testing Stripe connection...');
    
    // Try to retrieve the account information
    const account = await stripe.account.retrieve();
    
    console.log('✅ Successfully connected to Stripe!');
    console.log(`Account: ${account.id} (${account.business_type})`);
    
    // List available products
    const products = await stripe.products.list({ limit: 5 });
    console.log(`\nFound ${products.data.length} products:`);
    products.data.forEach(product => {
      console.log(`- ${product.id}: ${product.name}`);
    });
    
    // List available prices
    const prices = await stripe.prices.list({ limit: 5 });
    console.log(`\nFound ${prices.data.length} prices:`);
    prices.data.forEach(price => {
      const amount = price.unit_amount / 100;
      const currency = price.currency.toUpperCase();
      console.log(`- ${price.id}: ${amount} ${currency} (${price.product})`);
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error testing Stripe connection:', error.message);
    return { success: false, error: error.message };
  }
}

// Execute the test
testStripeConnection();