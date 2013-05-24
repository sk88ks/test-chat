var async = require('async');
var _ = require('underscore');
var redis = require('./redis');
var uuid = require('node-uuid');

function initHome(app) {
	var io = require('socket.io').listen(app);
	var that = this;
	var home = io.sockets.on('connection', function(socket) {
		var sId = socket.id;
		socket.emit('home-connected');

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
						redis.setRoomMembers({roomId: roomId, roomMembers: membersArray}, callback);
					},
					function(result, callback){
						_.each(data.roomMembers, function(value, key){
							async.parallel([
								function(callback){
									redis.getUserFromId(key, function(err, result){
										home.socket(result.socketSessionId).json.emit('invitation', {'userId': userId, 'userName': userName, 'roomId': roomId,'roomName': roomName});
										callback(null, result);
									});
								},
								function(callback){
									redis.setUserRooms({userId: key, roomId: roomId}, callback);
								}
							],function(err, result){
								callback(err, data.users);
							});
						});
					}
				],
				function(err, result){
					console.log('!!!!!!!!!!!!!!!!!!');
					socket.json.emit('created-room', {'roomId': roomId, 'roomName': roomName});
				});
			});
		});


		socket.on('join-chat', function(data){
			socket.get('userId', function(err, _userId){
				var userId = _userId;
				var roomId = data.roomId;
				var roomName = data.roomName;
				var params = {
					userId: userId,
					roomId: roomId
				};
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

function initChat(app) {
	var io = require('socket.io').listen(app);
	var that = this;
	var chat = io.sockets.on('connection', function(socket) {


		socket.on('init-chat', function(data){
			var roomId = data.roomId;
			socket.join(roomId);
			socket.set('userId', data.userId);
			socket.set('userName', data.userName);
		});


		socket.on('send-comment', function(data){
			socket.get('userId', function(err, _userId){
				console.log(data);
				var userId = _userId;
				var roomId = data.roomId;
				var comment = data.comment;
				var params = {
					userId: userId,
					roomId: roomId,
					comment: comment
				};
				var info;
				async.waterfall([
					function(callback){
						retrieveDataForComment(params, function(err, result){
							info = result;
							callback(err, result);
						});
					},
					function(result, callback){
						var params = {
							roomId: roomId,
							commentsInfo: info
						};
						redis.setComments(params, callback);
					}
				],function(err, result){
					if(err) return socket.emit('failed');
					var data = {
						'userId': userId,
						'userName': info.userName,
						'comment': info.comment,
						'img': info.img,
						'timestamp': info.timestamp
					};
					chat.to(roomId).json.emit('message', data);
					socket.json.emit('message', data);
				});
			});
		});
	});
}

function retrieveDataForComment(params, callback) {
	var userId = params.userId;
	var comment = params.comment;
	var img = params.img || '';
	var timestamp = parseInt((new Date()) / 1000);
	redis.getUserFromId(userId, function(err, result){
		if(err) return callback(err, result);
		var data = {
			userId: userId,
			userName: result.userName,
			comment: comment,
			img: img,
			timestamp: timestamp
		};
		callback(err, data);
	});
}

function getUsersData(params, callback){
	async.waterfall([
		function(callback){
			redis.getRoomMembers(params, callback);
		},
		function(memberIds, callback){
			async.map(memberIds, function(id, callback){
				redis.getUserFromId(id, callback);
			},
			function(err, result){
				callback(err, result);
			});
		}
	],function(err, result){
		if(err) return callback(err, result);
		callback(err, result);
	});
}

module.exports.initHome = initHome;
module.exports.initChat = initChat;
