let express = require('express')
let app = express()
let pug = require('pug');
let fs = require('fs');

let crawler = require('./crawler')
let db = require('./db')
let email = require('./email')

app.get('/', function(req, res) {
    // Compile template.pug, and render a set of data
    res.send(pug.renderFile('index.pug', {token: process.env.MAPBOX_ACCESS_TOKEN}));
})

app.get("/data.geojson", function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    db.getData((data)=> {
        dataJson = '{"type":"FeatureCollection","features": ['
        for(let i in data) {
            if (i > 0) dataJson += ','
            dataJson += '{"type": "Feature", "geometry": { "type": "Point", "coordinates": [' + data[i].loc.coordinates + ']}}'
        }
        dataJson += ']}'
        res.send(dataJson)
    })
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
