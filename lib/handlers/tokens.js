const _data = require('./../data');
const helpers = require('./../helpers');
const responses = require('./../helpers/responses');
const verifyToken = require('./../helpers/verifyToken');

module.exports = {
	post: function(data, respond) {
		const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
		const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

		if (phone && password) {
			// lookup user

			_data.read('users', phone, function(err, userData){
				if (!err && userData) {
					// hash pass and compare 
					const hashedPassword = helpers.hash(password);
					if (hashedPassword === userData.hashedPassword) {
						// create a new token set expiration date 1 hour in the future
						const tokenId = helpers.createRandomString(20);
						const expires = Date.now() + 1000 * 60 *60;
						const tokenObj = {
							phone,
							id: tokenId,
							expires
						};

						_data.create('tokens', tokenId, tokenObj, function(err){
							if (!err) {
								respond(responses(tokenObj).ok)
							} else {
								respond(responses('Create token').failed)
							}
						})

					} else {
						respond(responses('Create token').forbidden)
					}

				} else {
					respond(responses('User').notFound)
				}
			})
		} else {
			respond(responses('required fields').missing)
		}
		},
	get: function(data, respond) {
		// check that the phone number is valid
		const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
		if (id) {
			// lookup the user

			_data.read('tokens', id, function(err, tokenData){
				if (!err && tokenData) {
					respond(responses(tokenData).ok);
				} else {
					respond(responses('token').notFound)
				}
			})

		} else {
			respond(responses('required field').missing)
		}
	},
	put: function(data, respond) {
		const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
		const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend;

		if (id && extend) {
			// lookup token
			_data.read('tokens', id, function(err, tokenData){
				if (!err && tokenData) {
					// Check to make sure token is not expired
					if (tokenData.expires > Date.now()) {
						tokenData.expires = Date.now() + 1000*60*60;
						_data.update('tokens', id, tokenData, function(err) {
							if (!err) {
								respond(responses().ok)
							} else {
								respond(responses('Update Token').failed)
							}
						})
					} else {
						respond(responses('Update Token (already expired)').forbidden)
					}
				} else {
					respond(responses('Token').notFound)
				}
			})

		} else {
			respond(responses('required field').missing)
		}

	},
	delete: function(data, respond) {
		const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
		if (id) {
			// lookup the user

			_data.read('tokens', id, function(err, data){
				if (!err && data) {
					_data.delete('tokens', id, function(err){
						if (!err) {
							respond(responses().ok)
						} else {
							respond(responses('Delete Token').failed)
						}
					})
				} else {
					respond(responses('Token').notFound)
				}
			})

		} else {
			respond(responses('required fields').missing)
		}
	}
};