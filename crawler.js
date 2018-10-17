var request = require('request')
var url = 'https://www.signal-arnaques.com/scam-using-paypal?ajax=scam-table' // input your url here

// use a timeout value of 10 seconds
var timeoutInMilliseconds = 10*1000
var opts = {
  url: url,
  timeout: timeoutInMilliseconds
}

module.exports = {
  crawl: function () {
      request(opts, function (err, res, body) {
        if (err) {
          console.dir(err)
          return
        }
        var statusCode = res.statusCode
        var myRegexp = /\/scam\/view\/\d+">(.*?@.*?\..*?)<\/a>/g
        var match = myRegexp.exec(body);
        while (match != null) {
          console.log(match[1])
          match = myRegexp.exec(body);
        }
      })
  }
};
