/*
 * Request Handlers
 */

// Dependencies

const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

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
	const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
	
	// check for optional fields
	const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;


	if (phone) {

		if (firstName || lastName || password) {
			// lookup the user
			const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

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
									console.log(err);
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
handlers._users.delete = function(data, callback){
	// check that the phone number is valid
	const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// lookup the user

		const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
			handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
				if (tokenIsValid) {

					_data.read('users', phone, function(err, data){
					if (!err && data) {
						_data.delete('users', phone, function(err){
							if (!err) {
								// delete each check associated with user
                const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
								const checksToDelete = userChecks.length;
								if (checksToDelete>0){
									let checksDeleted = 0;
									let deletionErrors = false;

									userChecks.forEach(function (checkId) {
										_data.delete('checks', checkId, function (err) {
											if(err){
												deletionErrors = true;
											}
											checksDeleted++;
											if (checksDeleted == checksToDelete) {
												if(!deletionErrors) {
                          callback(200)
												} else {
													callback(500, {error: 'There has been a problem with deletion process'})
												}
											}
                    })
                  })
								} else {
									callback(200)
								}

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


handlers.checks = function(data, callback){
  const acceptableMethods = Object.keys(handlers._checks);

  if (acceptableMethods.includes(data.method)) {
    handlers._checks[data.method](data, callback)
  } else {
    callback(405)
  }
}

handlers._checks = {};


// checks -post
// req data: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.post = function (data, callback) {
	//validate inputs
  const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
  	// get token from headers
		const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
		_data.read('tokens', token, function (err, tokenData) {
			if(!err && tokenData) {
				const userPhone = tokenData.phone;
				_data.read('users', userPhone, function (err, userData) {
					if (!err && userData) {
						const userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
						if (userChecks.length < config.maxChecks) {
							const checkId = helpers.createRandomString(20);
							const checkObj = {
								id: checkId,
								userPhone,
								protocol,
								url,
								method,
								successCodes,
								timeoutSeconds
							};

							_data.create('checks', checkId, checkObj, function (err) {
								if (!err) {

									// add check id to users obj
									userData.checks = userChecks;
									userData.checks.push(checkId);

									// save the new user data

									_data.update('users', userPhone, userData, function (err) {
										if (!err){
											// return data to req
											callback(200, checkObj);
										} else {
											callback(500, {error: 'could not update the user width new check'})
										}
                  })

								}else {
									callback(500, {error: 'Could not create new check'})
								}
              })
						} else {
							callback(400, {error: 'The user already has the max number of checks ('+ config.maxChecks+')'})
						}

					} else {
						callback(403)
					}
        })
			} else {
				callback(403)
			}
    })
	} else {
  	callback(400, {error: 'Missing required fields, or inputs are invalid', fields: {protocol,
      url,
      method,
      successCodes,
      timeoutSeconds}})
	}

};


// checks get
// required: id
handlers._checks.get = function(data, callback){
  // check that the phone number is valid

  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
  	_data.read('checks', id, function (err, checkData) {
			if (!err && checkData) {

        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
          if (tokenIsValid) {
            callback(200, checkData)
          } else {
            callback(403, {error: 'invalid token'})
          }
        })
			} else {
				callback(404)
			}
    })

    // lookup the user
    // get token from header




  } else {
    callback(400, {error: 'Missing required filed'})
  }

};

handlers._checks.put = function(data, callback){
  // check required field
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  // check for optional fields
  const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (id) {
  	if (protocol||url||method||successCodes||timeoutSeconds) {
  		_data.read('checks', id, function (err, checkData) {
				if (!err && checkData) {

          const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

          handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
            if (tokenIsValid) {

            	// update check data
							if (protocol) {
								checkData.protocol = protocol
							}

							if (url) {
								checkData.url = url
							}

              if (method) {
                checkData.method = method
              }

              if (successCodes) {
                checkData.successCodes = successCodes
              }

              if (timeoutSeconds) {
                checkData.timeoutSeconds= timeoutSeconds
              }

              _data.update('checks', id, checkData, function (err) {
								if (!err) {
									callback(200)
								} else {
									callback(500, {error: 'could not update check'})
								}
              })

            } else {
              callback(403, {error: 'invalid token'})
            }
          })


				} else {
					callback(400, {err: 'Check not found'})
				}
      })
		} else {
  		callback(400, {error: 'missing fields to update'})
		}
	} else {
  	callback(400, {error: 'missing req fields'})
	}
};


handlers._checks.delete = function(data,callback){
  // Check that id is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the check
    _data.read('checks',id,function(err,checkData){
      if(!err && checkData){
        // Get the token that sent the request
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
          if(tokenIsValid){

            // Delete the check data
            _data.delete('checks',id,function(err){
              if(!err){
                // Lookup the user's object to get all their checks
                _data.read('users',checkData.userPhone,function(err,userData){
                  if(!err){
                    const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                    // Remove the deleted check from their list of checks
                    const checkPosition = userChecks.indexOf(id);
                    if(checkPosition > -1){

                      userChecks.splice(checkPosition,1);
                      // Re-save the user's data
                      userData.checks = userChecks;
                      _data.update('users',checkData.userPhone,userData,function(err){
                        if(!err){
                          callback(200);
                        } else {
                          callback(500,{'Error' : 'Could not update the user.'});
                        }
                      });
                    } else {
                      callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                    }
                  } else {
                    callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                  }
                });
              } else {
                callback(500,{"Error" : "Could not delete the check data."})
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400,{"Error" : "The check ID specified could not be found"});
      }
    });
  } else {
    callback(400,{"Error" : "Missing valid id"});
  }
};


module.exports = handlers;