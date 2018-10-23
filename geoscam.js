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
 5. For each IP/ ISP / Country / region / City / zipcode / Lat / Long (https://www.infobyip.com)
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

app.get("/image/:tagId", function(req, res) {
    db.checkScammer(req.params.tagId, ()=> {
        var img = fs.readFileSync('./pixel.png')
        res.writeHead(200, {'Content-Type': 'image/gif' })
        res.end(img, 'binary')

        let agent = req.headers['user-agent']
        let lang = req.headers['accept-language']
        let ip = (req.headers['x-forwarded-for'] || '').split(',').pop()
        db.trackScammer(req.params.tagId, agent, lang, ip)
    })
})

db.retrieveToken((err)=>{
    if(err) return console.error(err)
})

app.listen(process.env.PORT || 5000)
