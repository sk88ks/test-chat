var redisClient = require('redis').createClient();
var async = require('async');
var config = require('../config');

function Redis() {}

Redis.prototype.setUserSocketInfo = function(params, callback) {
	var key = config.dbPrefix.user + ':' + params.userId;
	redisClient.hmset(key, params, function(err, result) {
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.setNameToId = function(params, callback) {
	var key = config.dbPrefix.userName + ':' + params.userName;
	redisClient.setnx(key, params.userId, function(err, result) {
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.setUser = function(params, callback) {
	var key = config.dbPrefix.user + ':' + params.userId;
	redisClient.hmset(key, params, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.getUserFromName = function(userName, callback) {
	var key = config.dbPrefix.userName + ':' + userName
	redisClient.get(key, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.getUserFromId = function(userId, callback) {
	var key = config.dbPrefix.user + ':' + userId;
	redisClient.hgetall(key, function(err, result) {
		if(err) return callback(err, result);
		callback(err, result);
	});
}


Redis.prototype.addConnectingUser = function(userId, callback) {
	var key = config.dbPrefix.connectingUser;
	redisClient.sadd(key, userId, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.getConnectingUsers = function(callback) {
	var key = config.dbPrefix.connectingUser;
	redisClient.smembers(key, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.removeConnectingUser = function(userId, callback) {
	var key = config.dbPrefix.connectingUser;
	redisClient.srem(key, userId, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.getAllRooms = function(callback) {
	var key = config.dbPrefix.roomSet;
	redisClient.smembers(key, function(err, result) {
		async.map(result, function(roomId, callback){
			var key = 'room:' + roomId;
			redisClient.hgetall(key, function(err, result){
				callback(err, result);
			});
		},
		function(err, rooms) {
			if(err) return callback(err, rooms);
			callback(err, rooms);
		});
	});
}

Redis.prototype.setRoomSet = function(params, callback) {
	var key = config.dbPrefix.roomSet;
	redisClient.sadd(key, params.roomId, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.setRoomInfo = function(params, callback) {
	var key = config.dbPrefix.room + ':' + params.roomId;
	params.commentCount = 0;
	redisClient.hmset(key, params, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.setRoomMembers = function(params, callback) {
	var key = config.dbPrefix.members + ':' + params.roomId;
	redisClient.sadd(key, params.roomMembers, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.getRoomMembers = function(params, callback) {
	var key = config.dbPrefix.members + ':' + params.roomId;
	redisClient.smembers(key, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.setUserRooms = function(params, callback) {
	var key = config.dbPrefix.userRooms + ':' + params.userId;
	redisClient.sadd(key, params.roomId, function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

Redis.prototype.getUserRooms = function(params, callback) {
	var key = config.dbPrefix.userRooms + ':' + params.userId;
	redisClient.smembers(key, function(err, result) {
		async.map(result, function(roomId, callback){
			var key = 'room:' + roomId;
			redisClient.hgetall(key, function(err, result){
				callback(err, result);
			});
		},
		function(err, rooms) {
			if(err) return callback(err, rooms);
			callback(err, rooms);
		});
	});
}

Redis.prototype.setComments = function(params, callback){
	var key = config.dbPrefix.room + ':' + params.roomId;
	var content = 'commentCount';
	var commentsInfo = params.commentsInfo;
	async.waterfall([
		function(callback){
			redisClient.hget(key, content, callback);
		},
		function(commentCount, callback){
			var count = parseInt(commentCount, 10) + 1;
			var commentKey = 'comment:' + params.roomId + ':' + count;
			redisClient.hmset(commentKey, commentsInfo, callback);
		},
		function(result, callback) {
			redisClient.hincrby(key, content, 1, callback);
		}
	],
		function(err, result){
			if(err) return callback(err, result);
			callback(err, result);
		}
	);
}

Redis.prototype.getComments = function(params, callback){
	var key = config.dbPrefix.room + ':' + params.roomId;
	var content = 'commentCount';
	var comments = [];
	async.waterfall([
		function(callback){
			redisClient.hget(key, content, callback);
		},
		function(commentCount, callback){
			var count = 0;
			while(count < commentCount){
				count++;
				var key = 'comment:' + params.roomId + ':' + count;
				redisClient.hgetall(key, function(err, result){
					if(err) return callback(err, result);
					comments.push(result);
				});
			}
			callback(null, comments);
		}
	],
		function(err, result){
			if(err) return callback(err, result);
			callback(err, result);
		}
	);
}

module.exports = new Redis();

