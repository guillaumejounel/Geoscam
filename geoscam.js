let express = require('express')
let app = express()
let fs = require('fs');

let crawler = require('./crawler')
let db = require('./db')
let email = require('./email')

// crawler.crawl()
// email.sendEmail(process.env.EMAIL_DEV)

/* TODO :
 1. Scrap scam websites, indicate email/kind of scam/not contacted/date
 2. Contact not contacted emails with a tracker image (https://nodemailer.com/about/)
 3. Tracker image: change not contacted, add IP / Accept-Language / User-Agent)
 4. If opened several times, add IP / Accept-Language / User-Agent to list and update nb_contacted
 5. For each IP, obtain domain/ ISP / Country/ City / Lat / Long (https://www.infobyip.com)
    Request: http://ip-api.com/json/<IP>
 6. Deploy!
 7. Visualize scam origins... */


app.get('/', function(req, res) {
     res.send('Hello World!')
     // console.log("1--- " + JSON.stringify(req.headers))
     //console.log("2--- " + JSON.stringify(req.ip))
     //console.log(req.headers["host"]) //for localhost

     // let ip = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
     //     req.connection.remoteAddress ||
     //     req.socket.remoteAddress ||
     //     req.connection.socket.remoteAddress
})

app.get("/test/:tagId", function(req, res) {
    var img = fs.readFileSync('./IMG_5021.JPG');
     res.writeHead(200, {'Content-Type': 'image/gif' });
     res.end(img, 'binary');
     console.log(req.params.tagId + " image loaded on host "+req.headers["host"])
})

app.listen(process.env.PORT || 5000, () => console.log("GeoScam Launched!"))
