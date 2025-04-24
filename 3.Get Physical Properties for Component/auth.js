// Axios is a promise-based HTTP client for the browser and node.js.  
// See npmjs.com/package/axios 
import axios from 'axios';

// Express is a JavaSscript web application framework. See expressjs.com. 
import express from 'express';

// Instantiate an express application.
let app = express();

// Export the Auth class for use by other app modules. 
export default class Auth {
  // Construct the class instance and set global variables, based on the client ID and secret. 
  constructor(clientId, clientSecret) {
    this.host = 'https://developer.api.autodesk.com/';
    this.authAPI = `${this.host}authentication/v2/`;
    this.port = 8080;
    this.redirectUri = `http://localhost:${this.port}/callback/oauth`;

    this.accessTokenPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // Handle the callback/redirection by the Autodesk server once the user approves our app’s access to their data. 
    app.get('/callback/oauth', async (req, res) => {
      const { code } = req.query;

      // When you are redirected to the callback URL, the URL also contains a ‘code’ parameter with a value that you can exchange for an actual access token.
      try {
        const response = await axios({
          method: 'POST',
          url: `${this.authAPI}token`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}&redirect_uri=${this.redirectUri}`
        })

        // Set the accessToken variable to the value in the response. 
        this.accessToken = response.data.access_token

        // Resolve the Promise passed by the getAccessToken() function below with the access token. 
        // Let the rest of the application continue.  
        this.resolve(this.accessToken);

        // No need to listen for incoming calls anymore. 
        this.server.close();

        res.redirect('/');
      } catch (error) {
        console.log(error);
        this.reject(error);
      }    
    });
    
    app.get('/', async (req, res) => {
      // Once you have the access token, then there is nothing more to do. 
      if (this.accessToken) {
        res.send('Got the access token. You can close the browser!').end();
        return;
      }

      // Otherwise, redirect the user to the Autodesk log-in site where they can log in with their credentials 
      // and approve our app’s access to their data. 
      // Once that happens, the Autodesk server redirects the user to the callback URL provided. 
      // That callback is handled above in the app.get('/callback/oauth' …) function. 
      const url =
        `${this.authAPI}authorize?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${this.redirectUri}` +
        '&scope=data:read data:write data:create';
      res.redirect(url);
    })

    this.server = app.listen(this.port);

    console.log(
      `Open http://localhost:${this.port} in a web browser in order to log in with your Autodesk account!`
    );
  }

  // Pass back a Promise that only resolves and lets the rest of the application continue 
  // once you have an access token. 
  getAccessToken = async () => {
    return this.accessTokenPromise;
  }
}


