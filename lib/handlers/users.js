const _data = require('./../data');
const helpers = require('./../helpers');
const responses = require('./../helpers/responses');
const verifyToken = require('./../helpers/verifyToken');

module.exports = {
	post: function(data, respond){
		debugger
		return new Promise(function (resolve, reject) {
			resolve(responses({pepe:'hola'}).ok)
    });
		const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
		const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
		const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
		const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
		const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true;

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
		  					respond(responses(data).ok)
		  				} else {
		  					respond(responses('Create User').failed)
		  				}
		  			})	
					} else {
						respond(responses('Hash Password').failed)
					}
				} else {
					respond(responses('User').alreadyExists)
				}
			})
		} else {
			respond(responses('required fields').missing)
		}
	},
	get: function(data, respond){
		// User - get
		// required data: phone
		// optional data: none

		// check that the phone number is valid
		const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
		if (phone) {
			// lookup the user
			// get token from header
			const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

			verifyToken(token, phone, function(tokenIsValid){
				if (tokenIsValid) {
					_data.read('users', phone, function(err, data){
            if (!err && data) {
              // Remove password from the obj before returning ir to the req
              delete data.hashedPassword;
              respond(responses(data).ok);
            } else {
              respond(responses('User').notFound)
            }
          })
				} else {
					respond(responses('Get User').forbidden)
				}
			})
		} else {
			respond(responses('required fields').missing)
		}
	},
	put: function(data, respond){
		// users -put
		// requires data: phone
		// optional data: firstName, lastName, password (at least one must be specified)


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

				verifyToken(token, phone, function(tokenIsValid){
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
										respond(responses().ok);
									} else {
										respond(responses('Update user').failed);
									}
								})

							} else {
								respond(responses('User').notFound);
							}
						})
					} else {
						respond(responses('Update User').forbidden)
					}
				})

				

			} else {
				respond(responses('fields to update').missing)
			}


		} else {
			respond(responses('required fields').missing)
		}
	},
	delete: function(data, respond){
		// Users - delete
		// required fields: phone
		// @TODO only let authenticated users, do not give access to other users
		// @TODO cleanup any other files associated with this user


		
		// check that the phone number is valid
		const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
		if (phone) {
			// lookup the user

			const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
				verifyToken(token, phone, function(tokenIsValid){
					if (tokenIsValid) {

						_data.read('users', phone, function(err, data){
						if (!err && data) {
							_data.delete('users', phone, function(err){
								if (!err) {
									respond(responses().ok)
								} else {
									respond(responses('Remove user').failed)
								}
							})
						} else {
							respond(responses('Users').notFound)
						}
					})

					} else {
						respond(responses('Remove user').forbidden)
					}
				})
			

		} else {
			respond(responses('required fields').missing)
		}
	}
};