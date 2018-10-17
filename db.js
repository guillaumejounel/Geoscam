var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/Contacts', { useNewUrlParser: true });

// http://mongoosejs.com/docs/guide.html

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var schema = mongoose.Schema({
  email: {type: String, required: true, unique: true},
  contacted: {type: Boolean, default: false},
});


db.once('open', function() {
    var Scam = mongoose.model('Scam', schema);
    var scam1 = new Scam({ email: 'Scammer Pro' });
    var scam2 = new Scam({ email: 'Scammer Pro', contacted: true });

    // scam1.save(function (err, scam1) {
    //     if (err) return console.error(err);
    //     console.log(scam1.email); // 'Silence'
    // });
    //
    // scam2.save(function (err, scam2) {
    //     if (err) return console.error(err);
    //     console.log(scam2.email); // 'Silence'
    // });

});
