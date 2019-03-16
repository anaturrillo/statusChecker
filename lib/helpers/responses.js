module.exports = function(document){
	return {
		notFound: {
			statusCode: 404,
			responseData: {msg: document + ' was not found'}
		},
		ok: {
			statusCode: 200,
			responseData: {msg: 'Your request has been processed', data: document}
		},
		failed: {
      statusCode: 500,
			responseData: {error: 'We were no able to perform the task: ' + document}
		},
		alreadyExists: {
			statusCode: 400,
			responseData: {error: 'The ' + document + ' already exists'}
		},
		missing: {
      statusCode: 400,
			responseData: {error: 'Missing ' + document}
		},
		forbidden: {
			statusCode: 403,
			responseData: {error: 'Unable to authenticate to perform "' + document + '"'}
		}
	}
};