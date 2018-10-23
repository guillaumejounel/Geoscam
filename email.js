

const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'];

const oAuth2Client = new google.auth.OAuth2(process.env.GMAIL_CLI_ID, process.env.GMAIL_CLI_SECRET, 'urn:ietf:wg:oauth:2.0:oob');

function randItem(array) {
    return array[Math.floor(Math.random() * array.length)]
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
    constructor(to, id, then) {
        this.to = to
        this.id = id
        this.then = then
        this.message = randItem(fields["intro"])+",<br/><br/>" + randItem(fields["relative"]) + " m'a " +randItem(fields["verb"]) + " votre " + randItem(fields["address"])+" " + randItem(fields["concerning"])+" " + randItem(fields["post"])+".<br/><br/>" + randItem(fields["dunno"]) + ", " + randItem(fields["canu"])+" " + randItem(fields["explain2me"]) + " comment " +randItem(fields["do"]) + " pour " + randItem(fields["transaction"]) + "?<br/><br/>Merci,<br/><br/>" + randItem(fields["closure"]) + ",<br/>" + process.env.APP_FULLNAME + "<img src='" + process.env.APP_URL + "/image/" + this.id + "'/>"
        this.subject = "Annonce en ligne"
        this.email = ["Content-Type: text/html; charset=\"UTF-8\"\n", "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: base64\n" + "to: ", this.to, "\n", "from: ", process.env.APP_FULLNAME, " <",
        process.env.APP_EMAIL, ">\n", "subject: ", this.subject, "\n\n", this.message].join('');
        this.encodedEmail = Buffer.from(this.email).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
    send(auth) {
        let that = this
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.messages.send({
            auth: auth,
            userId: 'me',
            resource: {
                raw: this.encodedEmail
            }
        }, function(err, response) {
            if (err) return console.error(err)
            console.log("Email sent to " + that.to)
            that.then(that.id)
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
    db.retrieveToken((err, token) => {
        if (err)return console.error(err)
        oAuth2Client.setCredentials(token);
        if (typeof(callback) == "object")
            callback.send(oAuth2Client)
        else
            callback(oAuth2Client)
    })
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
        if (typeof code === "undefined" || code == "") {
            console.log("\nLooks like you haven't entered the code. You may want to do it using:\nnode -r dotenv/config -e 'require(\"./email\").setToken(\"PASTE_TOKEN_HERE\")'")
        } else {
            setNewToken(oAuth2Client, code)
        }
    });
}

function setNewToken(oAuth2Client, code) {
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(JSON.stringify(token));

        // Store the token to db for later program executions
        db.storeToken(token, (err) => {
            if (err) return console.error(err)
            console.log("Token stored to database")
        })
    })
    return
}

/**
* Get the emails from your Gmail inbox, save IPs and archive them
*
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
function getRecentEmail(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    // Only get the recent email - 'maxResults' parameter
    gmail.users.messages.list({auth: auth, userId: 'me', labelIds: ["INBOX"]}, function(err, response) {
        if (err) return console.error('The API returned an error: ' + err);
        for (let message in response['data']['messages']) {
            // Get the message id which we will need to retrieve tha actual message next.
            let message_id = response['data']['messages'][message]['id'];
            // retrieve the actual message using the message id
            gmail.users.messages.get({auth: auth, userId: 'me', 'id': message_id}, function(err, response) {
                if (err) return console.error('The API returned an error: ' + err);

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
                gmail.users.messages.modify({'userId': 'me', 'id': message_id, resource: {'addLabelIds': [], 'removeLabelIds': ["INBOX", "UNREAD"]}}, function(err) {
                    if (err) return console.error(err)
                    console.log("Email " + message_id + " archived.")
                });
            });
        }

    })
}

module.exports = {
    checkInbox: function() {
        authorize(getRecentEmail)
    },
    sendEmail: function(to, id, then) {
        email = new Email(to, id, then)
        authorize(email)
    },
    getToken: function() {
        getNewToken(oAuth2Client)
    },
    setToken: function(code) {
        setNewToken(oAuth2Client, code)
    }
}

let db = require('./db')
