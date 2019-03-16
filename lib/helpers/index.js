/*
 * Helpers for various tasks
 *
 */

const crypto = require('crypto');
const config = require('./../config');

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
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

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
}


helpers.mainHandler =  handlers => function(data, callback){
	const methods = Object.keys(handlers);
	const method = data.method;

	if (methods.includes(method)) {
		debugger
		handlers[method](data, callback)
	} else {
		callback(405)
	}
}


module.exports = helpers;