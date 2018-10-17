# Geoscam

Geoscam is a web server that locates scammers around the world by emailing them and locating their IP address.

### Setup

- [Enable the Gmail API](https://console.developers.google.com/apis/library/gmail.googleapis.com) on a Google project
- Client secret, client ID and project ID should respectively be saved as `GMAIL_CLI_SECRET`, `GMAIL_CLI_ID`, `GMAIL_PRO_ID` config vars in `.env`.
- Set the `token.js` by running `node -r dotenv/config -e 'require("./email").getToken()'`.

(more detailed instructions to come)
