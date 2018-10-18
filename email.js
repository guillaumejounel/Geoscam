// Set up token.json: node -r dotenv/config email.js

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'];

const TOKEN_PATH = 'token.json';

const oAuth2Client = new google.auth.OAuth2(process.env.GMAIL_CLI_ID, process.env.GMAIL_CLI_SECRET, 'urn:ietf:wg:oauth:2.0:oob');

Array.prototype.randItem = function () {
    return this[Math.floor(Math.random() * this.length)]
}

const fields = {
    intro: ["Bonjour", "Bonsoir"],
    relative: ["Ma fille", "Mon fils", "Ma compagne", "Mon petit-fils", "Ma petite-fille", "Ma femme"],
    verb: ["transmis", "communiqué", "fait parvenir", "passé", "renseigné", "donné"],
    address: ["adresse email", "email", "courriel", "adresse électronique", "mail", "e-mail", "adresse e-mail"],
    concerning: ["par rapport à", "vis à vis de", "pour"],
    post: ["l'annonce", "l'achat", "la vente"],
    dunno: ["Je n'y connais pas grand chose", "Je n'ai pas trop l'habitude de faire ça", "C'est la première fois que je fais cela", "Je n'y connais rien", "Je n'ai jamais fait cela auparavant"],
    canu: ["pouvez-vous", "pourriez-vous", "serait-il possible que vous", "puis-je vous demander de", "est-ce qu'il serait possible que vous"],
    explain2me: ["m'expliquez", "m'indiquez", "me renseigner", "me spécifier", "m'apprendre"],
    do: ["procéder", "faire", "s'y prendre", "opérer"],
    transaction: ["le paiement", "la transaction", "l'achat", "la vente"],
    closure: ["Cordialement", "Bien cordialement", "Bonne journée", "Bonne soirée", "Bien à vous"]
}


class Email {
    constructor(to) {
        this.message = fields["intro"].randItem()+",<br/><br/>" + fields["relative"].randItem() + " m'a "+fields["verb"].randItem() + " votre "+fields["address"].randItem()+" "+fields["concerning"].randItem()+" "+fields["post"].randItem()+".<br/><br/>" + fields["dunno"].randItem() + ", " + fields["canu"].randItem()+" " + fields["explain2me"].randItem() +" comment "+fields["do"].randItem() + " pour " + fields["transaction"].randItem() + "?<br/><br/>Merci,<br/><br/>" + fields["closure"].randItem() + ",<br/>"+process.env.APP_FULLNAME
        this.subject = "Annonce en ligne"
        this.email = ["Content-Type: text/html; charset=\"UTF-8\"\n", "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: base64\n" + "to: ", to, "\n", "from: ", process.env.APP_FULLNAME, " <",
        process.env.APP_EMAIL, ">\n", "subject: ", this.subject, "\n\n", this.message].join('');
        this.encodedEmail = Buffer.from(this.email).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
    send(auth) {
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.messages.send({
            auth: auth,
            userId: 'me',
            resource: {
                raw: this.encodedEmail
            }
        }, function(err, response) {
            console.log(err || "Email sent")
        });
    }
}

/**
* Create an OAuth2 client with the given credentials, and then execute the
* callback function or executes its method "send()" if callback is an Email object
* @param {function} callback The callback to call with the authorized client.
*/
function authorize(callback) {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) { console.log("No token.json file provided. You may want to run this first:\nnode -r dotenv/config -e 'require(\"./email\").getToken()'"); return }
        oAuth2Client.setCredentials(JSON.parse(token));
        if (typeof(callback) == "object")
            callback.send(oAuth2Client)
        else
            callback(oAuth2Client)
    });
}

/**
* Get and store new token after prompting for user authorization
* @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
*/
function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close()
        if (typeof code === "undefined" || code == "")
            console.log("\nLooks like you haven't entered the code. You may want to do it using:\nnode -r dotenv/config -e 'require(\"./email\").setToken(\"PASTE_TOKEN_HERE\")'")
        else
            setNewToken(oAuth2Client, code)
    });
}

function setNewToken(oAuth2Client, code) {
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
    });
}

//TODO Iterate on all messages
/**
* Get the recent email from your Gmail account
*
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
function getRecentEmail(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    // Only get the recent email - 'maxResults' parameter
    gmail.users.messages.list({auth: auth, userId: 'me', maxResults: 1,}, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }

        // Get the message id which we will need to retreive tha actual message next.
        let message_id = response['data']['messages'][0]['id'];

        // Retreive the actual message using the message id
        gmail.users.messages.get({auth: auth, userId: 'me', 'id': message_id}, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            text = ""
            for (let txt in response['data']["payload"]["headers"]){
                if (response['data']["payload"]["headers"][txt]["name"] == "Received")
                text += response['data']["payload"]["headers"][txt]["value"]
                if(response['data']["payload"]["headers"][txt]["name"] == "Subject")
                console.log("Subject = " + response['data']["payload"]["headers"][txt]["value"])
                if(response['data']["payload"]["headers"][txt]["name"] == "X-Mailer")
                console.log("X-Mailer = " + response['data']["payload"]["headers"][txt]["value"])
            }
            let myRegexp = /[^\.](\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/g
            let match = myRegexp.exec(text);
            while (match != null) {
                console.log("IP = " +match[1])
                match = myRegexp.exec(text);
            }
            //gmail.users.messages.delete({userId: 'me', 'id': message_id})
            // gmail.users.messages.modify({'userId': 'me', 'id': message_id, resource: {'addLabelIds': [], 'removeLabelIds': ["INBOX", "UNREAD"]}});
        });
    })
}

module.exports = {
    checkInbox: function() {
        authorize(getRecentEmail)
    },
    sendEmail: function(to, from) {
        email = new Email(to)
        authorize(email)
    },
    getToken: function() {
        getNewToken(oAuth2Client)
    },
    setToken: function(code) {
        setNewToken(oAuth2Client, code)
    }
}
