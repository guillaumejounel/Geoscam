let request = require('request')
let db = require("./db")
let url = process.env.CRAWL_URL

// use a timeout value of 10 seconds
let timeoutInMilliseconds = 10*1000

let opts = {
    url: url,
    timeout: timeoutInMilliseconds
}

//TODO: Use an array of URL/patterns/kind (db?)
//TODO: Check email pattern
//TODO: Alert when no new emails for x hours

module.exports = {
    crawl: function (url) {
        request(opts, function (err, res, body) {
            if (err) return console.error(err)

            let myRegexp = /\/scam\/view\/.+">(.*?@.*?\..*?)<\/a>/g
            let match = myRegexp.exec(body);
            console.log("Crawler req: " + res.statusCode + " " + url)

            let nbEmails = 0
            while (match != null) {
                let email = match[1]
                db.saveScammer(email, (err) => {
                    if (err) { if (err.code != 11000) return console.error(err); return }
                    console.log(email + " saved to database")
                    nbEmails += 1
                })
                match = myRegexp.exec(body);
            }
            setTimeout(()=>{console.log(nbEmails + " email address" + (nbEmails>1?"es":"") + " crawled!")}, 3*1000)
        })
    }
};
