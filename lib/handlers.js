/*
 * Request Handlers
 */

// Dependencies
console.log('este es un cambio')
const _data = require('./data');
const helpers = require('./helpers')

// define handlers
const handlers = {};

handlers.ping = function(data, callback) {
	callback(200);
}


// not found handler
handlers.notFound = function(data, callback) {
	callback(404)
}

handlers.users = function(data, callback){
	const acceptableMethods = Object.keys(handlers._users);

	if (acceptableMethods.includes(data.method)) {
		handlers._users[data.method](data, callback)
	} else {
		callback(405)
	}
}

handlers._users = {};

handlers._users.post = function(data, callback){
	const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
  	// Make sure the user doesn't alreay exist
  	_data.read('users', phone, function(err, data) {
  		if (err) {
  			// hash the password
  			const hashedPassword = helpers.hash(password);
	  			if (hashedPassword) {
	  				// create user object
	  			const userObj = {
	  				firstName,
	  				lastName,
	  				phone,
	  				hashedPassword,
	  				tosAgreement: true
	  			};

	  			// persist the user
	  			_data.create('users', phone, userObj, function(err, data){
	  				if (!err){
	  					callback(200)
	  				} else {
	  					callback(500, {error: 'Could not create the new user'})
	  				}
	  			})	
  			} else {
  				callback(500, {error: 'Could not hash password'})
  			}
  			

  		} else {
  			callback(400, {error: 'A user with that phone number alreay exists'})
  		}
  	})
  } else {
  	callback(400, {error: 'Missing required fields', fileds: {firstName, lastName, phone, password,tosAgreement}})
  }
};

// User - get
// required data: phone
// optional data: none
handlers._users.get = function(data, callback){
	// check that the phone number is valid
	const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// lookup the user
		// get token from header
		const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
			if (tokenIsValid) {
				_data.read('users', phone, function(err, data){
				if (!err && data) {
					// Remove password from the obj before returning ir to the req
					delete data.hashedPassword;
					callback(200, data);
				} else {
					callback(404)
				}
			})
			} else {
				callback(403, {error: 'invalid token'})
			}
		})

		

	} else {
		callback(400, {error: 'Missing required filed'})
	}

};

// users -put
// requires data: phone
// optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data, callback){
	// check required field
	const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	
	// check for optional fields
	const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;


	if (phone) {

		if (firstName || lastName || password) {
			// lookup the user
			const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

			handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
				if (tokenIsValid) {
					_data.read('users', phone, function(err, userData){
						if (!err && userData) {
							// update
							if (firstName) {
								userData.firstName = firstName
							}

							if (lastName) {
								userData.lastName = lastName
							}

							if (password) {
								userData.hashedPassword = helpers.hash(password)
							}

							_data.update('users', phone, userData, function(err){
								if (!err) {
									callback(200);
								} else {
									console.log(err)
									callback(500, {error: 'Could not update user'});
								}
							})

						} else {
							callback(404, {error: 'The user does not exist'});
						}
					})
				} else {
					callback(403, {error: 'invalid token'})
				}
			})

			

		} else {
			callback(400, {error: 'Missing fields to update'})
		}


	} else {
		callback(400, {error: 'Missing required filed'})
	}
};


// Users - delete
// required fields: phone
// @TODO only let authenticated users, do not give access to other users
// @TODO cleanup any other files associated with this user
handlers._users.delete = function(data, callback){
	// check that the phone number is valid
	const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// lookup the user

		const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
				if (tokenIsValid) {

					_data.read('users', phone, function(err, data){
					if (!err && data) {
						_data.delete('users', phone, function(err){
							if (!err) {
								callback(200)
							} else {
								callback(500, {error: 'Could not remove user'})
							}
						})
					} else {
						callback(400, {error: 'Could not find users'})
					}
				})

				} else {
					callback(403, {error: 'invalid token'})
				}
			})
		

	} else {
		callback(400, {error: 'Missing required filed'})
	}
};

handlers.tokens = function(data, callback){
	const acceptableMethods = Object.keys(handlers._tokens);

	if (acceptableMethods.includes(data.method)) {
		handlers._tokens[data.method](data, callback)
	} else {
		callback(405)
	}
}

handlers._tokens = {};

// required: id
handlers._tokens.get = function(data, callback) {
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
};


// require: id, extend
handlers._tokens.put = function(data, callback) {
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

};


// required: phone, password
handlers._tokens.post = function(data, callback) {

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
};

// required: id
handlers._tokens.delete = function(data, callback) {
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
};

handlers._tokens.verifyToken = function(id, phone, callback){
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

module.exports = handlers;