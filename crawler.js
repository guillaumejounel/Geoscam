let request = require('request')
let db = require("./db")
let url = process.env.CRAWL_URL

// use a timeout value of 10 seconds
let timeoutInMilliseconds = 10*1000

let opts = {
    url: url,
    timeout: timeoutInMilliseconds
}

module.exports = {
    crawl: function () {
        request(opts, function (err, res, body) {
            if (err) return console.error(err)

            let myRegexp = /\/scam\/view\/.+">(.*?@.*?\..*?)<\/a>/g
            let match = myRegexp.exec(body);
            console.log("Crawler req: " + res.statusCode + " " + process.env.CRAWL_URL)

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
            console.log(nbEmails + " email addresses crawled!")
        })
    }
};
