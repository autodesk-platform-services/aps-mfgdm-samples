// Axios is a promise-based HTTP client for the browser and node.js.
import axios from "axios";

// Application constructor
export default class App {
  constructor(accessToken) {
    this.graphAPI = "https://developer.api.autodesk.com/mfg/v3/graphql";
    this.accessToken = accessToken;
  }

  getRequestHeaders() {
    return {
      "Content-type": "application/json; charset=utf-8",
      Authorization: "Bearer " + this.accessToken,
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
          hubs(filter:{name:$hubName}) {
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

// <getModelHierarchy>
  async getModelHierarchy(hubName, projectName, componentName) {
    try {
      let projectId = await this.getProjectId(hubName, projectName);

      let modelId = await this.getModelId(projectId, componentName);

      let model = {
        assemblyRelations: {
          results: []
        }
      };
      let cursor = null;

      do {
        // Get first batch of occurrences
        let response = await this.sendQuery(
          `query GetModel($modelId: ID!, $cursor: String) {
            model(modelId: $modelId) {
              name {
                displayValue
              }
              assemblyRelations(pagination: {cursor: $cursor}) {
                results {
                  fromModel {
                    id
                    name {
                      displayValue
                    }
                  }
                  toModel {
                    id
                    name {
                      displayValue
                    }
                  }
                }
                pagination {
                  cursor
                }
              }
            }
          }`,
          {
            modelId,
            cursor
          }
        );

        model.id = modelId;
        model.name = response.data.data.model.name;

        model.assemblyRelations.results =
          model.assemblyRelations.results.concat(
            response.data.data.model.assemblyRelations.results
          );

        cursor = response.data.data.model.assemblyRelations.pagination.cursor; 
      } while (cursor);

      return model;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }
// </getModelHierarchy>
}
