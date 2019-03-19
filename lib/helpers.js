/*
 * Helpers for various tasks
 *
 */

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

const helpers = {};

// Create a SHA256 hash
helpers.hash = function(str){
	if (typeof(str) == 'string' && str.length > 0) {
		const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
}

// Parse a json string to an object in all cases without throwing
helpers.parseJsonToObject = function(str){
	try {
		const obj = JSON.parse(str);
		return obj;
	} catch (e) {
		return  {}
	}
}

// create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
	strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

	if (strLength) {
		const possibleCharacters = 'abcdefghijkrstuvwxyz0123456789';

		let str = '';

		for (let i = 1; i <= strLength; i++) {
			const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
			str += randomCharacter;
		}
		return str;
	} else {
		return false
	}
};

helpers.sendTwilioSms = function (phone, msg, callback) {
	phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone.trim(): false;
	msg = typeof (msg) ==='string' && msg.trim().length > 0 && msg.trim().length<=1600 ? msg.trim() : false;
	if (phone && msg) {
		// configure req payload
		const payload = {
			From: config.twilio.fromPhone,
			To: '+1'+phone,
			Body: msg
		};

		const stringPayload = querystring.stringify(payload); // se usa querystring.stringify porque no es una api rest

		const requestDetails = {
			protocol: 'https:',
			hostname: 'api.twilio.com',
			method: 'POST',
			path: '2010-04-01/Accounts/' + config.twilio.accountSid+'/Messages.json',
			auth: config.twilio.accountSid+':'+config.twilio.authToken,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}
		};

		const req = https.request(requestDetails, function (res) {
			const status = res.statusCode;
			if (status === 200 || status === 201) {
				callback(false);
			} else {
				callback('Status code returned: '+status);
			}
    });

    req.on('error', function (e) {
      callback(e)
    });

    req.write(stringPayload);

    req.end()

	} else {
		callback('Given parameters were missing or invalid')
	}


};

module.exports = helpers;