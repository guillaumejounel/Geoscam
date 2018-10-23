const mongoose = require('mongoose');
const http = require('http');

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('count', false);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/GeoScam', { useNewUrlParser: true });

// http://mongoosejs.com/docs/guide.html

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

const tokenSchema = mongoose.Schema({token: Object});
const Token = mongoose.model('Token', tokenSchema);

const scammerSchema = mongoose.Schema({
    email: {type: String, unique: true},
    contacted: {type: Boolean, default: false},
    tracked: {type: Boolean, default: false},
    date: Date,
    ip: String,
    isp: String,
    agent: String,
    lang: String,
    loc: {
        type: { type: String },
        coordinates: []
    }
});

scammerSchema.index({ loc: '2dsphere' });

const Scammer = mongoose.model('Scammer', scammerSchema);

function saveScammer(email, next) {
    let myScammer = new Scammer({ email: email, loc: { type: "Point", coordinates: [0,0]}})
    myScammer.save().then(()=> {
        next(null)
    }, function(err) {
        if (err) next(err)
    });
}

function emailScammers() {
    Scammer.find({contacted: false, tracked: false}).exec(function(err, scammers) {
        if (err) return console.error(err)
        for (let i = 0; i < scammers.length; i++) {
            email.sendEmail(scammers[i]["email"], scammers[i]["_id"], (id) => {
                Scammer.findOneAndUpdate({_id: mongoose.Types.ObjectId(id)}, {$set:
                    {contacted: true, date: Date.now()}
                }).exec((err, res)=> {
                    if (err) return console.error(err)
                });
            })
        }
    });
}

function checkScammer(id, then) {
    Scammer.countDocuments({_id: mongoose.Types.ObjectId(id), tracked: false}).exec(function(err, count) {
        if(err) return console.error(err)
        if(count > 0){
            then()
        }
    })
}

function trackScammer(id, agent, lang, ip) {
    console.log("req = "+'http://ip-api.com/json/'+"67.163.57.254")
    http.get(process.env.IP_LOCATOR_URL + ip, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });

        // The whole response has been received.
        resp.on('end', () => {
            let result = JSON.parse(data)
            let isp = result.isp
            let coord = [result.lat, result.lon]

            Scammer.findOneAndUpdate({_id: mongoose.Types.ObjectId(id)}, {$set:
                {tracked: true, ip: ip, agent: agent, lang: lang, isp: isp, loc: {type: 'Point', coordinates: coord}}
            }).exec((err, res) => {
                if(err) return console.error(err)
                console.log(id+" has been located at "+coord)
            });
        });

    }).on("error", (err) => {
        return console.error(err)
    });
}

// A.find({ loc: { $near: { type: 'Point', coordinates:[-179.0, 0.0] }}}, function (err, docs) {
//         if (err) return done(err);
//         console.log(docs);
//         done();
//       })

function storeToken(token, next) {
    let myToken = new Token({token: token});
    Token.deleteMany({}, function (err) {
        if (err) next(err)
    }).then(() => {
        myToken.save().then(()=> {
            next(null)
        }, function(err) {
            if (err) next(err)
        });
    })
}

function retrieveToken(next) {
    Token.findOne({}, function (err, token) {
        if (err) {
            next(err)
        }
        else {
            if (token == null) {
                next(new Error("No token stored. You may want to run this:\n"+
                "node -r dotenv/config -e 'require(\"./email\").getToken()'"))
            } else {
                next(null, token.token)
            }
        }
    })
}

module.exports = {
    storeToken: function(token, next) {
        storeToken(token, next)
    },
    retrieveToken: function(next) {
        retrieveToken(next)
    },
    saveScammer: function(email, next) {
        saveScammer(email, next)
    },
    emailScammers: function() {
        emailScammers()
    },
    checkScammer: function(id, then) {
        checkScammer(id, then)
    },
    trackScammer: function(id, agent, lang, ip) {
        trackScammer(id, agent, lang, ip)
    }
};

let email = require("./email")
