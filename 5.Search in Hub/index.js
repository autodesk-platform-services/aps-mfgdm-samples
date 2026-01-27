import MyApp from './app.js'; 
import MyAuth from './auth.js';

// Replace the string literal values with your own client id, client secret, 
// hub name, propertyName, and propertyValue.
const clientId = '<YOUR_CLIENT_ID>';
const clientSecret = '<YOUR_CLIENT_SECRET>';
const hubName = '<YOUR_HUB_NAME>';
const propertyName = '<YOUR_PROPERTY_NAME>';
const propertyValue = '<YOUR_PROPERTY_VALUE>';

// Create an instance of auth.js.
let myApsAuth = new MyAuth(clientId, clientSecret);

// Get an access token from your auth.js instance. 
let accessToken = await myApsAuth.getAccessToken(); 

// Create an instance of app.js using the variable set above. 
let myApsApp = new MyApp(
  accessToken
);

let results =await myApsApp.searchInHub(
  hubName,
  propertyName,
  propertyValue
);

console.log(`Search results: ${JSON.stringify(results, null, 2)}`);