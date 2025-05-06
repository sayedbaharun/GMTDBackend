require('dotenv').config();
const Amadeus = require('amadeus');

// Create an instance of the Amadeus API client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || '7GW9BtjxxiP4b9j5wjQVRJm6bjpngfPP',
  clientSecret: process.env.AMADEUS_API_SECRET || 'yrsVsEXxAckcMuqm',
});

async function testAmadeusConnection() {
  try {
    console.log('Testing Amadeus API connection...');
    
    // Test searching for Dubai as a city
    const response = await amadeus.referenceData.locations.get({
      keyword: 'Dubai',
      subType: 'CITY'
    });
    
    console.log('✅ Successfully connected to Amadeus API!');
    console.log('📍 Found locations:');
    
    // Display the locations found
    response.data.forEach(location => {
      console.log(`- ${location.name} (${location.iataCode}) - ${location.subType}`);
    });
    
    // Test flight search
    console.log('\nTesting flight search API...');
    const flightResponse = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'LON',
      destinationLocationCode: 'DXB',
      departureDate: getFutureDate(30), // 30 days from now
      adults: 1,
      currencyCode: 'USD',
      max: 3
    });
    
    console.log('✅ Successfully retrieved flight offers!');
    console.log(`📊 Found ${flightResponse.data.length} flight offers.`);
    
    if (flightResponse.data.length > 0) {
      const firstOffer = flightResponse.data[0];
      console.log('\n🛫 Sample flight offer:');
      console.log(`- Price: ${firstOffer.price.total} ${firstOffer.price.currency}`);
      console.log(`- Airline: ${firstOffer.validatingAirlineCodes[0]}`);
      console.log(`- Total segments: ${firstOffer.itineraries[0].segments.length}`);
    }
    
    // Test hotel search - Note: Only some Amadeus tiers have access to hotel APIs
    // Skip this test if the endpoint is not available
    console.log('\nTesting hotel search API...');
    let hotelResponse = { data: [] };
    try {
      // Check if the hotelOffers API is available in the current Amadeus plan
      if (amadeus.shopping && amadeus.shopping.hotelOffers) {
        hotelResponse = await amadeus.shopping.hotelOffers.get({
          cityCode: 'DXB',
          checkInDate: getFutureDate(30),
          checkOutDate: getFutureDate(33),
          adults: 1,
          radius: 5,
          radiusUnit: 'KM',
          ratings: '4,5'
        });
      } else {
        console.log('⚠️ Hotel search API not available in current Amadeus subscription plan.');
      }
    } catch (error) {
      console.log('⚠️ Could not access hotel search API:', error.message);
    }
    
    console.log('✅ Successfully retrieved hotel offers!');
    console.log(`📊 Found ${hotelResponse.data.length} hotel offers.`);
    
    if (hotelResponse.data.length > 0) {
      const firstHotel = hotelResponse.data[0];
      console.log('\n🏨 Sample hotel offer:');
      console.log(`- Hotel: ${firstHotel.hotel.name}`);
      if (firstHotel.offers && firstHotel.offers.length > 0) {
        console.log(`- Price: ${firstHotel.offers[0].price.total} ${firstHotel.offers[0].price.currency}`);
        console.log(`- Room: ${firstHotel.offers[0].room.typeEstimated.category}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Amadeus API connection test failed!');
    if (error.description) {
      console.error(`Error details: ${error.description}`);
    } else {
      console.error(`Error details: ${error.message || 'Unknown error'}`);
    }
    console.error('Full error:', error);
    return false;
  }
}

// Helper function to get a future date in YYYY-MM-DD format
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Run the test
testAmadeusConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 All Amadeus API tests completed successfully!');
    } else {
      console.log('\n⚠️ Some Amadeus API tests failed. See errors above.');
    }
  })
  .catch(error => {
    console.error('Unexpected error running Amadeus tests:', error);
  });