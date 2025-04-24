// Axios is a promise-based HTTP client for the browser and node.js. 
import axios from "axios";

// We need the following in order to save files to the machine
import fs from "fs";  
import path from "path"; 

// Application constructor 
export default class App {
  constructor(accessToken) {
    this.graphAPI = 'https://developer.api.autodesk.com/mfg/v3/graphql';
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

      return response;
    } catch (err) {
      if (err.response.data.errors) {
        let formatted = JSON.stringify(err.response.data.errors, null, 2);
        console.log(`API error:\n${formatted}`);
      }

      throw err;
    }
  }

  async getProjectId(hubName, projectName) {
    try {
      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetProjectId($hubName: String!, $projectName: String!) {
          hubs(filter: {name: $hubName}) {
            results {
              name
              projects(filter:{name:$projectName}) {
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

      let projectId = response.data.data.hubs.results[0].projects.results[0].id;
      return projectId;
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

      let modelId = response.data.data.project.items.results[0].tipRootModel.id;
      return modelId;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

// <getPhysicalProperties>
  async getPhysicalProperties(hubName, projectName, componentName) {
    try {
      let projectId = await this.getProjectId(hubName, projectName);

      let modelId = await this.getModelId(projectId, componentName);

      while (true) {
        let response = await this.sendQuery(
          `query GetPhysicalProperties($modelId: ID!) {
            model(modelId: $modelId) {
              physicalProperties {
                status
                area {
                  displayValue
                  definition {
                      units {
                        name
                      }
                    }
                }
                volume {
                  displayValue
                  definition {
                      units {
                        name
                      }
                    }
                }
                mass {
                  displayValue
                  value
                  definition {
                      units {
                        name
                      }
                    }
                }
                density {
                  displayValue
                  definition {
                      units {
                        name
                      }
                    }
                }
                boundingBox {
                  length {
                    displayValue
                    definition {
                      units {
                        name
                      }
                    }
                  }
                  height {
                    displayValue
                    definition {
                      units {
                        name
                      }
                    }
                  }
                  width {
                    displayValue
                    definition {
                      units {
                        name
                      }
                    }
                  }
                }
              }       
            }
          }`,
          {
            modelId
          }
        )

        let geometry = response.data.data.model.physicalProperties;

        if (geometry.status === "COMPLETED") {
          return geometry;
        }
      }
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </getPhysicalProperties>
}
