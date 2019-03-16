const _data = require('./../data');

module.exports = function (token, phone, callback) {
  _data.read('tokens', token, function(err, tokenData){

    if (!err && tokenData) {
      if(tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }

    } else {
      callback(false)
    }
  })
};