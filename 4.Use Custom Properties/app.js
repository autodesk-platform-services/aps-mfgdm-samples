// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";
import { create } from "domain";

// We need the following in order to save files to the machine
import fs from "fs";  
import path from "path"; 

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer.api.autodesk.com/mfg/v3/graphql/public';
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

  async getHubAndProjectId(hubName, projectName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetProjectId($hubName: String!, $projectName: String!) {
          hubs(filter: {name: $hubName}) {
            results {
              id
              projects(filter:{name: $projectName}) {
                results {
                  name
                  id
                }
              }
            }
          }
        }`,
        {
          hubName,
          projectName
        }
      );

      let hubId = response.data.data.hubs.results[0].id;
      let projectId = response.data.data.hubs.results[0].projects.results[0].id;
      return { hubId, projectId };
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async getModelId(projectId, componentName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetComponentVersionId($projectId: ID!, $componentName: String!) {
          project(projectId: $projectId) {
            name
            items(filter:{name:$componentName}) {
              results {
                ... on DesignItem {
                  name
                  tipRootModel {
                    id
                  }
                }
              }
            }
          }
        }`,
        {
          projectId,
          componentName
        }
      );

      let modelId = response.data.data.project.items.results.find(item => item.tipRootModel).tipRootModel.id;
      return modelId;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async getComponentId(modelId) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetProperties($modelId:ID!) {
          model(modelId: $modelId) {
            component {
              id
            }
          }
        }`,
        {
          modelId
        }
      );

      let componentId = response.data.data.model.component.id;
      return componentId;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async getCollections() {
    try {
      let response = await this.sendQuery(
        `query GetCollections {
          application {
            propertyDefinitionCollections {
              results {
                name
                id
              }
            }
          }
        }`,
        {
        }
      );

      let collections = response.data.data.application.propertyDefinitionCollections.results;
      return collections;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async createCollection(name) {
    try {
      let response = await this.sendQuery(
        `mutation CreateCollection($name: String!) {
          createPropertyDefinitionCollection(input: { name: $name }) {
            propertyDefinitionCollection {
              name
              id
            }
          }
        }`,
        {
          name
        }
      );

      let collection = response.data.data.createPropertyDefinitionCollection.propertyDefinitionCollection;
      return collection;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async getProperties(collectionId) {
    try {
      let response = await this.sendQuery(
        `query GetCollections($collectionId: ID!) {
          application {
            propertyDefinitionCollections (filter: {id: [$collectionId]}) {
              results {
                name
                id
                definitions {
                  results {
                    name
                    id
                  }
                }
              }
            }
          }
        }`,
        {
          collectionId
        }
      );

      let properties = response.data.data.application.propertyDefinitionCollections.results[0].definitions.results;
      return properties;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

  async createProperty(collectionId, name) {
    try {
      let response = await this.sendQuery(
        `mutation CreateProperty($collectionId:ID!, $name: String!) {
          createPropertyDefinitions(input: { 
            propertyDefinitionCollectionId: $collectionId, 
            propertyDefinitionsInput: [{ 
              name: $name, 
              propertyBehavior: STANDARD,
              specification: STRING,
              shouldCopy:true,
              isHidden: false,
              isReadOnly: false,
              isArchived: false
            }]
          }) {
            propertyDefinitions {
              name
              id
            }
          }
        }`,
        {
          collectionId, 
          name
        }
      );

      let property = response.data.data.createPropertyDefinitions.propertyDefinitions[0];
      return property;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }  

  async linkCollection(collectionId, hubId) {
    try {
      await this.sendQuery(
        `mutation LinkCollection($hubId: ID!, $collectionId:ID!) {
          linkPropertyDefinitionCollection(input: {
            hubId: $hubId,
            propertyDefinitionCollectionId: $collectionId
          }) {
            hub {
              id 
            }
          }
        }`,
        {
          collectionId, 
          hubId
        }
      );
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  } 
  
  async setProperty(propertyId, componentId, propertyValue) {
    try {
      let response = await this.sendQuery(
        `mutation SetProperty($propertyId: ID!, $componentId: ID!, $propertyValue: PropertyValue!) {
          setProperties(input: {
            targetId: $componentId, propertyInputs: [{
              propertyDefinitionId: $propertyId,
              value: $propertyValue
            }]
          }) {
            properties {
              value
            }
          }
        }`,
        {
          propertyId,
          componentId,
          propertyValue 
        }
      );

      let property = response.data.data.setProperties.properties[0];
      return property;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }  

// <addPropertyWithValue>
  async addPropertyWithValue(hubName, projectName, componentName, collectionName, propertyName, propertyValue) {
    try {
      let { hubId, projectId } = await this.getHubAndProjectId(hubName, projectName);

      let modelId = await this.getModelId(projectId, componentName);

      let collections = await this.getCollections();

      let collection = collections.find(col => col.name === collectionName);

      if (!collection) {
        console.log(`Creating collection: ${collectionName}`);
        collection = await this.createCollection(collectionName);
      } else {
        console.log(`Collection: ${collectionName} already exists.`);
      }

      let properties = await this.getProperties(collection.id);

      let property = properties.find(prop => prop.name === propertyName);

      if (!property) {
        console.log(`Creating property: ${propertyName}`);
        property = await this.createProperty(collection.id, propertyName);
      } else {
        console.log(`Property: ${propertyName} already exists.`);
      }

      console.log(`Linking collection: ${collection.name} to hub id: ${hubId}`);
      await this.linkCollection(collection.id, hubId);

      let componentId = await this.getComponentId(modelId);

      console.log(`Setting property: ${property.name} to component id: ${componentId} with value: ${propertyValue}`);
      await this.setProperty(property.id, componentId, propertyValue);
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </addPropertyWithValue>
}
