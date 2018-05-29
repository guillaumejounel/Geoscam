var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb:27017');

// http://mongoosejs.com/docs/guide.html

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log("we're connected!")

    var scamSchema = mongoose.Schema({
        name: String
    });

    var Scam = mongoose.model('Scam', scamSchema);
    var scam1 = new Scam({ name: 'Scammer Pro' });

    scam1.save(function (err, scam1) {
        if (err) return console.error(err);
        console.log(scam1.name); // 'Silence'
    });
});

app.get('/', function(req, res) {
    res.send('Hello World!')
    console.log(JSON.stringify(req.headers))
    console.log(JSON.stringify(req.ip))
})

/* TODO :
 1. Scrap scam websites, indicate email/kind of scam/not contacted/date
 2. Contact not contacted emails with a tracker image (https://nodemailer.com/about/)
 3. Tracker image: change not contacted, add IP / Accept-Language / User-Agent)
 4. If opened several times, add IP / Accept-Language / User-Agent to list and update nb_contacted
 5. For each IP, obtain domain/ ISP / Country/ City / Lat / Long (https://www.infobyip.com)
 6. Deploy!
 7. Visualize scam origins... */

app.listen(3000, () => console.log('http://localhost:3000'))
