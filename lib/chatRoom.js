var async = require('async');
var _ = require('underscore');
var redis = require('./redis');

function retrieveData(params, callback) {
	redis.getComments(params, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

module.exports.retrieveData = retrieveData;