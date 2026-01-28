# Seach In Hub

## Setting up your test
In the **terminal** run this to install all the necessary components
```
npm i
``` 

You will need to set the value of `clientId` and `clientSecret` variables in `index.js` based on your **APS app**'s credentials and make sure that the `Callback URL` of the app is set to `http://localhost:8080/callback/oauth` as shown in the picture\
![Get 3-legged token](../readme/credentials.png)

You will also need to set the value of `hubName`, `projectName`, `propertyName` and `propertyValue` variables. You can find them either in **Fusion Teams** web app, in **Fusion 360** or any other place that lets you navigate the contents of your **Autodesk** hubs and projects - including the **Manufacturing Data Model API** itself\
![Get version id](../readme/inputs.png)

## Running the test
In a **terminal**, you can run the test with:
```
npm start
```
As instructed in the console, you'll need to open a web browser and navigate to http://localhost:8080 in order to log into your Autodesk account 

## Output
```
Open http://localhost:8080 in a web browser in order to log in with your Autodesk account!
Search results: [
  {
    "name": "Box",
    "searchResultObject": {
      "__typename": "Component",
      "id": "Y29tcH53TTBJUmZ2ZzNPVUtMdmxiMnh0Mkx0X0wyQ34"
    }
  }
]
```

## Workflow explanation

The workflow can be achieved following these steps:

1. Find id of the property we want to use
2. Search inside the hub for components which have that property with the given value

## Manufacturing Data Model API Query

In `app.js` file, the following GraphQL query searches for components in a hub with a given property value
```
async searchInHub(hubName, propertyName, propertyValue) {
  try {
    let hubId = await this.getHubId(hubName);

    let property = await this.findProperty(hubId, propertyName);
    if (!property) {
      console.log(`Could not find property: ${propertyName}`);
      return;
    }

    let results = await this.findComponents(hubId, property.propertyDefinition.id, propertyValue);
    return results;
  } catch (err) {
    console.log("There was an issue: " + err.message)
  }
}
```

-----------

Please refer to this page for more details: [Manufacturing Data Model API Docs](https://aps.autodesk.com/en/docs/mfgdatamodel-publicbeta/v2/developers_guide/overview/)