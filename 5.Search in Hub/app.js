// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";
import { create } from "domain";

// We need the following in order to save files to the machine
import fs from "fs";  
import path from "path"; 

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer-stg.api.autodesk.com/mfg/v3/graphql/public';
    this.accessToken = accessToken;
  }

  getRequestHeaders() {
    return {
      "Content-type": "application/json",
      "Authorization": "Bearer " + this.accessToken,
    };
  }

  async sendQuery(query, variables) {
    try {
      let response = await axios({
        method: "POST",
        url: `${this.graphAPI}`,
        headers: this.getRequestHeaders(),
        data: {
          query,
          variables,
        },
      });

      if (response.data.errors) {
        let formatted = JSON.stringify(response.data.errors, null, 2);
        console.log(`API error:\n${formatted}`);
      }

      return response;
    } catch (err) {
      if (err.response.data.errors) {
        let formatted = JSON.stringify(err.response.data.errors, null, 2);
        console.log(`API error:\n${formatted}`);
      }

      throw err;
    }
  }

  async getHubId(hubName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetProjectId($hubName: String!) {
          hubs(filter: {name: $hubName}) {
            results {
              id
            }
          }
        }`,
        {
          hubName
        }
      );

      let hubId = response.data.data.hubs.results[0].id;
      return hubId;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async findProperty(hubId, propertyName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetSearchableProperties($hubId: ID!) {
          searchablePropertiesByHub(hubId: $hubId) {
            results {
              displayName
              propertyDefinition {
                id 
              }
            }
          }
        }`,
        {
          hubId
        }
      );

      let property = response.data.data.searchablePropertiesByHub.results.find(item => item.displayName === propertyName);
      return property;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async findComponents(hubId, propertyId, propertyValue) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query SearchByHub($hubId: ID!, $propId: ID!, $propValue: String!) {
          searchByHub(
            hubId: $hubId
            searchCriteria: {
              desiredSearchResultTypes: [COMPONENT]
              searchFields: [
                {
                  searchableProperty: $propId
                  PropertyQuery: [$propValue]
                }
              ]
            }
          ) {
            results {
              name
              matches {
                matchedPropertyId
                matchedText
              }
              searchResultObject {
                __typename
                ... on Component {
                  id
                }
              }
            }
          }
        }`,
        {
          hubId,
          propId: propertyId,
          propValue: propertyValue
        }
      );

      return response.data.data.searchByHub.results;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

// <searchInHub>
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
// </searchInHub>
}
