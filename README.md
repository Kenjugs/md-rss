### 🚧 You will need Node.js installed to run this application 🚧
The current LTS should be sufficient (v16.15.0).

### Short description
This application was meant to bridge the gap for missing RSS functionality with
the new MangaDex. This app will log in with the account information you give it
and create RSS files for all of the manga the account is currently following.

**This is specifically for followed manga that has a status of "Reading".**

Followed manga have a notification bell with a checkmark icon. Any other
followed manga with different statuses (such as "Plan to Read" or "Dropped")
will be ignored.

All RSS files are generated and stored in a folder called
`manga/{manga_name_here}` where `{manga_name_here}` is the English title of the
manga, with spaces replaced with underscores (_). For example, "One Piece" would
become "One_Piece".

An RSS file can be accessed by running this app and then navigating your
internet browser to `http://localhost:3000/` and clicking through the directory
listing to the `rss.xml` file.

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