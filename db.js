
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
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
  storeToken: function (token, next) {
      storeToken(token, next)
  },
  retrieveToken: function (next) {
      retrieveToken(next)
  },
  saveScammer: function (email, next) {
      saveScammer(email, next)
  }
};
