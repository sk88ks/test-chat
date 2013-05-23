var async = require('async');
var _ = require('underscore');
var redis = require('./redis');
var uuid = require('node-uuid');
var io;

function init(app) {
	io = require('socket.io').listen(app);
	var that = this;
	var chat = io.sockets.on('connection', function(socket) {
		var sId = socket.id;
		socket.emit('connected');

		socket.on('init', function(data){
			var params = {
				userId: data.userId,
				userName: data.userName,
				socketSessionId: sId
			};
			redis.setUserSocketInfo(params, function(err, result){
				socket.set('userId', data.userId);
				socket.set('userName', data.userName);
				//socket.json.emit('join-home', {'userId': data.userId, 'userName': data.userName});
				socket.broadcast.json.emit('join-home', {'userId': data.userId, 'userName': data.userName});
			});
		});

		//todo Should use async
		socket.on('createRoom', function(data){
			console.log(data);
			async.parallel({
				userId: function(callback){
					socket.get('userId', function(err, userId){
						callback(err, userId);
					});
				},
				userName: function(callback){
					socket.get('userName', function(err, userName){
						callback(err, userName);
					});
				}
			},function(err, result){
				var userId = result.userId;
				var userName = result.userName;
				var roomId = uuid.v1();
				var roomName = data.roomName;

				var params = {
					roomId: roomId,
					roomName: roomName,
					userId: userId
				};

				async.waterfall([
					function(callback){
						redis.setRoomInfo(params, callback);
					},
					function(result, callback){
						redis.setRoomSet(params, callback);
					},
					function(result, callback){
						redis.setUserRooms(params, callback);
					},
					function(result, callback){
						var membersArray = _.keys(data.roomMembers);
						membersArray.push(userId);
						console.log(membersArray);
						redis.setRoomMembers({roomId: roomId, roomMembers: membersArray}, callback);
					},
					function(result, callback){
						_.each(data.roomMembers, function(value, key){
							redis.getUserFromId(key, function(err, result){
								chat.socket(result.socketSessionId).json.emit('invitation', {'userId': userId, 'userName': userName, 'roomId': roomId,'roomName': roomName});
							});
						});
						callback(null, data.users);
					}
				],
				function(err, result){
					socket.join(roomId);
					socket.json.emit('created-room', {'roomId': roomId, 'roomName': roomName});
				});
			});
		});

		socket.on('join-chat', function(data){
			socket.get('userId', function(err, _userId){
				var userId = _userId;
				var roomId = data.roomId;
				var roomName = data.roomName;

			});
		});

		socket.on('disconnect', function(){
			socket.get('userId', function(err, _userId){
				var userId = _userId;
				redis.removeConnectingUser(userId, function(err, result){
					socket.broadcast.json.emit('out-home', {'userId': userId});
					console.log(userId + 'disconnected');
				});
			});
		});
	});
}

module.exports.init = init;
