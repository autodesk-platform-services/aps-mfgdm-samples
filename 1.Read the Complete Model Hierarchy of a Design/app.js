// Axios is a promise-based HTTP client for the browser and node.js.
import axios from "axios";

// Application constructor
export default class App {
  constructor(accessToken) {
    this.graphAPI = "https://developer.api.autodesk.com/mfg/graphql";
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

  async getComponentVersionId(projectId, componentName) {
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
                  tipRootComponentVersion {
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

      let componentVersionId = response.data.data.project.items.results[0].tipRootComponentVersion.id;
      return componentVersionId;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }

// <getModelHierarchy>
  async getModelHierarchy(hubName, projectName, componentName) {
    try {
      let projectId = await this.getProjectId(hubName, projectName);

      let componentVersionId = await this.getComponentVersionId(projectId, componentName);

      // Get first batch of occurrences
      let response = await this.sendQuery(
        `query GetModelHierarchy($componentVersionId: ID!) {
          componentVersion(componentVersionId: $componentVersionId) {
            id
            name 
            allOccurrences {
              results {
                parentComponentVersion {
                  id 
                }
                componentVersion {
                  id
                  name
                }
              }
              pagination {
                cursor
              }
            }
          }
        }`,
        {
          componentVersionId
        }
      );

      let rootComponentVersion =
        response.data.data.componentVersion;
      let cursor = rootComponentVersion.allOccurrences.pagination.cursor;

      // Keep getting the rest of the occurrences if needed
      while (cursor) {
        response = await this.sendQuery(
          `query GetModelHierarchy($componentVersionId: ID!, $cursor: String) {
            componentVersion(componentVersionId: $componentVersionId) {
              allOccurrences (pagination: {cursor: $cursor}) {
                results {
                  parentComponentVersion {
                    id 
                  }
                  componentVersion {
                    id
                    name
                  }
                }
                pagination {
                  cursor
                }
              }
            }
          }`,
          {
            componentVersionId: rootComponentVersion.id,
            cursor
          }
        );

        rootComponentVersion.allOccurrences.results =
          rootComponentVersion.allOccurrences.results.concat(
            response.data.data.componentVersion.allOccurrences.results
          );
        cursor =
          response.data.data.componentVersion.allOccurrences.pagination.cursor;
      }

      return rootComponentVersion;
    } catch (err) {
      console.log("There was an issue: " + err.message);
    }
  }
// </getModelHierarchy>
}
