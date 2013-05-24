var async = require('async');
var _ = require('underscore');
var redis = require('./redis');

function retrieveData(params, callback) {
	async.parallel({
		user: function(callback){
			redis.getUserFromId(params.userId, callback);
		},
		comments: function(callback){
			redis.getComments(params, callback);
		}
	},function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

module.exports.retrieveData = retrieveData;