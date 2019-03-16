const _data = require('./../data');
const helpers = require('./../helpers')

module.exports = {
	post: function(data, callback) {
		const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
		const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

		if (phone && password) {
			// lookup user

			_data.read('users', phone, function(err, userData){
				if (!err && userData) {
					// hash pass and compare 
					var hashedPassword = helpers.hash(password);
					if (hashedPassword == userData.hashedPassword) {
						// create a new token set expiration date 1 hour in the future
						const tokenId = helpers.createRandomString(20);
						const expires = Date.now() + 1000 * 60 *60;
						const tokenObj = {
							phone,
							id: tokenId,
							expires
						}

						_data.create('tokens', tokenId, tokenObj, function(err){
							if (!err) {
								callback(200, tokenObj)
							} else {
								callback(500, {error: 'Could not create token'})
							}
						})

					} else {
						callback(400, {error: 'wrong password'})
					}

				} else {
					callback(400, {err: 'user not found'})
				}
			})
		} else {
			callback(400, {error: 'Missing required fields'})
		}
		},
	get: function(data, callback) {
		// check that the phone number is valid
		const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
		if (id) {
			// lookup the user

			_data.read('tokens', id, function(err, tokenData){
				if (!err && tokenData) {
					callback(200, tokenData);
				} else {
					callback(404)
				}
			})

		} else {
			callback(400, {error: 'Missing required filed'})
		}
	},
	put: function(data, callback) {
		const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
		const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend;

		if (id && extend) {
			// lookup token
			_data.read('tokens', id, function(err, tokenData){
				if (!err && tokenData) {
					// Check to make sure token is not expired
					if (tokenData.expires > Date.now()) {
						tokenData.expires = Date.now() + 1000*60*60;
						_data.update('tokens', id, tokenData, function(err) {
							if (!err) {
								callback(200)
							} else {
								callback(500, {error: 'Could not update token'})
							}
						})
					} else {
						callback(400, {error: 'token already expired'})
					}
				} else {
					callback(400, {error: 'Token does not exist'})
				}
			})

		} else {
			callback(400, {error: 'Missing field'})
		}

	},
	delete: function(data, callback) {
		const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
		if (id) {
			// lookup the user

			_data.read('tokens', id, function(err, data){
				if (!err && data) {
					_data.delete('tokens', id, function(err){
						if (!err) {
							callback(200)
						} else {
							callback(500, {error: 'Could not remove token'})
						}
					})
				} else {
					callback(400, {error: 'Could not find token'})
				}
			})

		} else {
			callback(400, {error: 'Missing required filed'})
		}
	},
	verifyToken: function(id, phone, callback){
		_data.read('tokens', id, function(err, tokenData){
			if (!err && tokenData) {

				if(tokenData.phone == phone && tokenData.expires > Date.now()) {
					callback(true)
				} else {
					callback(false)
				}

			} else {
				callback(false)
			}
		})
	}
}