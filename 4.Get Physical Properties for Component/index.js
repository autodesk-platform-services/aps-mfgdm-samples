import MyApp from './app.js'; 
import MyAuth from './auth.js';

// Replace the string literal values with your own client id, client secret, 
// hub name, project name and component name.
const clientId = '<YOUR_CLIENT_ID>';
const clientSecret = '<YOUR_CLIENT_SECRET>';
const hubName = '<YOUR_HUB_NAME>';
const projectName = '<YOUR_PROJECT_NAME>';
const componentName = '<YOUR_COMPONENT_NAME>';

// Create an instance of auth.js.
let myApsAuth = new MyAuth(clientId, clientSecret);

// Get an access token from your auth.js instance. 
let accessToken = await myApsAuth.getAccessToken(); 

// Create an instance of app.js using the variable set above. 
let myApsApp = new MyApp(
  accessToken
);

let properties = await myApsApp.getPhysicalProperties(
  hubName,
  projectName,
  componentName
);

console.log("Physical properties:");
printInfo(properties, "");

function printInfo (properties, indent) {
  for (let propertyName of Object.keys(properties)) {
    let property = properties[propertyName];
    if (propertyName === "status") continue;
    if (propertyName === "boundingBox") {
      console.log(`${indent}${propertyName}:`);
      printInfo(property, indent + "  ");
      continue;
    }
    console.log(`${indent}${propertyName}: ${property.displayValue} [${property.propertyDefinition.units.name}]`);
  }
}



