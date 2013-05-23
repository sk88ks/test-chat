var redis = require('./redis');
var uuid = require('node-uuid');
var async = require('async');
var _ = require('underscore');

function register(params, callback) {
	var userId = uuid.v1();
	var params = {
		userId: userId,
		userName: params.userName,
		password: params.password
	};
	redis.setNameToId(params, function(err, result) {
		if(err) return callback(err, result);
		if(result === 0) return callback(err, result);
		redis.setUser(params, function(err, result) {
			if(err) return callback(err, result);
			callback(
				err,
				{userId: userId}
			);
		});
	});

}

function prepareForHome(params, callback) {
	async.waterfall([
		function(callback){
			getData(params.userId, function(err, data) {
				callback(err, data);
			});
		},
		function(data, callback) {
			redis.getUserFromId(params.userId, function(err, result) {
				callback(err, {userId: result.userId, userName: result.userName, data: data})
			});
		},
		function(data, callback){
			redis.addConnectingUser(params.userId, function(err, redisResult){
				if(err) return callback(err, redisResult);
				callback(err, data);
			});
		}
	],
		function(err, data){
			if(err) return callback(err, data);
			callback(err, data);
		}
	);
}

function confirm(params, callback) {
	async.waterfall([
		function(callback) {
			redis.getUserFromName(params.userName, function(err, result){
				callback(err, result);
			});
		},
		function(id, callback) {
			redis.getUserFromId(id, function(err, result) {
				callback(err, result);
			});
		}
	],
		function(err, user){
			if(err) return callback(err, user);
			if(!user) {
				return callback(1, 'Not found');
			}else if(params.password !== user.password){
				return callback(1, 'Failed');
			}
			callback(err, user);
		}
	);
}

function getData(userId, callback) {
	async.parallel({
		users: function(callback) {
			async.waterfall([
				function(callback){
					redis.getConnectingUsers(function(err, result) {
						callback(err, _.reject(result, function(id) {
							if(id === userId){
								return true;
							}
						}));
					});
				},
				function(ids, callback){
					//todo Use multi
					async.map(ids, function(id, callback){
						redis.getUserFromId(id, function(err, result){
							callback(err, result);
						});
					},
					function(err, result) {
						callback(err, result);
					});
				}
			],function(err, result){
				callback(err, result);
			});
		},
		rooms: function(callback) {
			var params = {userId: userId};
			redis.getUserRooms(params, function(err, result) {
				callback(err, result);
			});
		}
	},function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

module.exports.preparForHome = prepareForHome;
module.exports.confirm = confirm;
module.exports.register = register;
module.exports.getData = getData;
