
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/GeoScam', { useNewUrlParser: true });

// http://mongoosejs.com/docs/guide.html

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

const tokenSchema = mongoose.Schema({token: Object});
const Token = mongoose.model('Token', tokenSchema);

let schema = mongoose.Schema({
  email: {type: String, required: true, unique: true},
  contacted: {type: Boolean, default: false},
});

function storeToken(token, next) {
    let mytoken = new Token({token: token});
    Token.deleteMany({}, function (err) {
        if (err) next(err)
    }).then(() => {
        mytoken.save().then(()=> {
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
  }
};
