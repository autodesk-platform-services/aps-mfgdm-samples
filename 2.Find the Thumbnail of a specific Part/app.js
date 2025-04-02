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

// <downloadThumbnail>
  async downloadThumbnail(hubName, projectName, componentName) {
    try {
      let projectId = await this.getProjectId(hubName, projectName);

	    let modelId = await this.getModelId(projectId, componentName);

      while (true) {
        let response = await this.sendQuery(
          `query GetThumbnail($modelId: ID!) {
            model(modelId: $modelId) {
              thumbnail {
                status
                signedUrl
              }          
            }
          }`,
          {
            modelId
          }
        )

        let thumbnail = response.data.data.model.thumbnail;

        if (thumbnail.status === "SUCCESS") {
          // If the thumbnail generation finished then we can download it
          // from the url
          let thumbnailPath = path.resolve('thumbnail.png');
          await this.downloadImage(thumbnail.signedUrl, thumbnailPath);
          return "file://" + encodeURI(thumbnailPath);
        } else {
          console.log("Extracting thumbnail … (it may take a few seconds)")
          // Let's wait a second before checking the status of the thumbnail again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      console.log("There was an issue: " + err.message)
    }
  }
// </downloadThumbnail>

  async downloadImage(url, path) {  
    const writer = fs.createWriteStream(path);
  
    const response = await axios({
      url,
      method: 'GET',
      headers: this.getRequestHeaders(),
      responseType: 'stream'
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}
