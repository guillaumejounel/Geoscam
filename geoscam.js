let express = require('express')
let app = express()
let fs = require('fs');

let crawler = require('./crawler')
let db = require('./db')
let email = require('./email')

app.get('/', function(req, res) {
     res.send('Welcome to GeoScam!')
})

app.get("/image/:tagId", function(req, res) {
    var img = fs.readFileSync('./pixel.png')
    res.writeHead(200, {'Content-Type': 'image/gif' })
    res.end(img, 'binary')
    db.isScammerId(req.params.tagId, ()=> {
        let agent = req.headers['user-agent']
        let lang = req.headers['accept-language']
        let ip = (req.headers['x-forwarded-for'] || '').split(',').pop()
        if (!ip.startsWith("66.249"))
            db.trackScammer(req.params.tagId, agent, lang, ip)
    })
})

db.retrieveToken((err)=>{
    if(err) return console.error(err)
})

// ROUTINE
// crawler.crawl()
// db.emailScammers()
// email.checkInbox()

app.listen(process.env.PORT || 5000)
