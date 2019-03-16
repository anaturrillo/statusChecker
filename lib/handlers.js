/*
 * Request Handlers
 */

// Dependencies

const userHandlers = require('./handlers/users');
const tokenHandlers = require('./handlers/tokens');
const helpers = require('./helpers');
const responses = require('./helpers/responses');

// define handlers
const handlers = {};

handlers.ping = function(data, respond) {
	respond(responses().ok);
}


// not found handler
handlers.notFound = function(data, respond) {
	respond(responses('What ever you were looking for').notFound)
}


handlers._users = {
	post: userHandlers.post,
	get: userHandlers.get,
	put: userHandlers.put,
	delete: userHandlers.delete
};

handlers.users = helpers.mainHandler(handlers._users);

handlers._tokens = {
	post: tokenHandlers.post,
	get: tokenHandlers.get,
	put: tokenHandlers.put,
	delete: tokenHandlers.delete,
	verifyToken: tokenHandlers.verifyToken
};

handlers.tokens = helpers.mainHandler(handlers._tokens);

module.exports = handlers;