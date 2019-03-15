/*
 * Library for storing and editing data
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers')

// Container for the module
const lib = {}

// base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/') // __dirname: where we are now. path.join, merges both locations

// write data to a file
lib.create = function(dir, file, data, callback){
	// open the file for writing

	fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
		if (!err) {
			// convert data to string
			var stringData = JSON.stringify(data);

			// write to file and close it
			fs.writeFile(fileDescriptor, stringData, function(err){
				if (!err) {
					fs.close(fileDescriptor, function(err){
						if (!err) {
							callback(false)
						} else {
							callback('Error closing the file')
						}
					})
				} else {
					callback('Error writing the new file')
				}
			})
		} else {
			callback('Could not create the file, it may already exist')
		}
	})
};

// Read data from file

lib.read = function(dir, file, callback) {
	fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', function(err, data){
		if (!err && data) {
			const parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData)
		} else {
			callback(err, data)
		} 
		

	})
}

// Update file

lib.update = function(dir, file, data, callback){
	// Open the file for writing
	fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor){
		if (!err && fileDescriptor) {
			const stringData = JSON.stringify(data);

			// Truncate file
			fs.truncate(fileDescriptor, function(err){
				if (!err) {
					// write the file
					fs.writeFile(fileDescriptor, stringData, function(err) {
						if (!err) {

							fs.close(fileDescriptor, function(err){
								if (!err) {
									callback(false)
								} else {
									callback('error closing file')
								}
							})
						} else {
							callback('Error writing to existing file')
						}
					})
				} else {
					callback('error truncating file')
				}

			})

		} else {
			callback('Could not open the file for updating, it may not exist')
		}
	})
}

// delete file

lib.delete = function(dir, file, callback) {
	// unlink the file
	fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err) {
		if (!err) {
			callback(false)
		} else {
			callback('Could not delete file')
		}
	})
}

// Export the module

module.exports = lib