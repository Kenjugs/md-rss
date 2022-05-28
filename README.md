### 🚧 You will need Node.js installed to run this application 🚧
The current LTS should be sufficient (v16.15.0).

### Short description
This application was meant to bridge the gap for missing RSS functionality with
MangaDex's v5 API. This app will log in with the account information you give it
and create RSS files in the `manga` folder that you can then consume with any
RSS client. An RSS file can be accessed by running this app and then pointing
your RSS client to `http://localhost:3000/{manga-id}/rss.xml`.

### Account information
Modify the file `md-rss-poll/authentication.js` to have your correct account information.
The only portion you will need to modify is the code below:
```
const body = {
    username: '<your username here>',
    password: '<your password here>'
};
```

### Running the app
- Open a terminal where you have downloaded this code to
- Run `node app`