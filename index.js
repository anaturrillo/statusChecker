/*
* Primary file for the API
*
*/

// dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// server logic
const unifiedServer = function(req, res) {
	// get the url and parse it
	const parsedUrl = url.parse(req.url, true)
	// get url path

	const path = parsedUrl.pathname;
	const trimmePath = path.replace(/^\/+|\/+$/g,'')

	// get query string

	const queryStringObject = parsedUrl.query;

	// get http method
	const method = req.method.toLowerCase();

	// get headers as an object
	const headers = req.headers;

	// get the payload if there is any
	const decoder = new StringDecoder('utf-8');
	let buffer = '';

	req.on('data', function(data){
		buffer += decoder.write(data)
	})

	req.on('end', function(){
		buffer += decoder.end()
		
		// choose handler the req should go to
		const chosenHandler = router[trimmePath] ? router[trimmePath] : handlers.notFound;

		// construct data obj
		const data = {
			trimmePath,
			queryStringObject,
			method,
			headers,
			payload: helpers.parseJsonToObject(buffer)
		}

		// route the req to the handler
		chosenHandler(data, function(statusCode, payload){
			// use the status code called back by the handler, or default
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200

			// use the payload called back by the handler, or default
			payload = typeof(payload) == 'object' ? payload : {}

			// convert payload to a string
			const payloadString = JSON.stringify(payload)

			// return response
			res.setHeader('Content-Type', 'application/json')
			res.writeHead(statusCode);
			res.end(payloadString)
			console.log('returning response: ', statusCode, payloadString)
		});
	});
};

// start servers
const httpServer = http.createServer(unifiedServer);

httpServer.listen(config.httpPort, function(){
	console.log('server listening on port ' + config.httpPort + ', in ' + config.envName + ' mode')
})

const httpsServerOptions = {
	key: fs.readFileSync('./https/key.pem'),
	cert: fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

httpsServer.listen(config.httpsPort, function(){
	console.log('server listening on port ' + config.httpsPort + ', in ' + config.envName + ' mode')
})

// define a request router
const router = {
	'ping': handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks
};