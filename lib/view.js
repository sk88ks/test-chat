var async = require('async');
var config = require('../config');
var login = require('./login');
var chat = require('./chat');
var chatRoom = require('./chatRoom');

function loginIndex(req, res){
	res.render('loginIndex', {title: 'test-chat'});
}

function loginConfirm(req, res) {
	var params = {
		userName: req.body.userName,
		password: req.body.password
	};
	login.confirm(params, function(err, result) {
		if(err) console.log(result);
		req.session.userId = result.userId;
		res.redirect('/home');
	});
}

function goHome(req, res) {
	var userId = req.session.userId;
	console.log(userId);
	if(!userId) res.redirect('/login');
	var params = {userId: userId};
	login.preparForHome(params, function(err, result){
		var address = config.host + ':' + config.port;
		res.render('home', {userId: result.userId, userName: result.userName, address: address, data: result.data});
	});
}

function registerIndex(req, res) {
	res.render('register', {title: 'register'});
}

function register(req, res) {
	var userName = req.body.userName;
	var password = req.body.password;
	var params = {
		userName: userName,
		password: password
	};
	login.register(params, function(err, result){
		if(err) return console.log(err);
		res.render('loginIndex', {title: 'test-chat'});
	});
}

function goChat(req, res) {
	var userId = req.session.userId;
	var roomId = req.query.id;
	var roomName = req.params.room;
	var params = {userId: userId, roomId: roomId, roomName: roomName};
	console.log(params);
	chatRoom.retrieveData(params, function(err, result) {
		console.log(result);
		res.render('chat', {userId: result.user.userId, userName: result.user.userName, roomId: roomId, roomName: roomName, comments: result.comments});
	});
}

module.exports.loginIndex = loginIndex;
module.exports.loginConfirm = loginConfirm;
module.exports.goHome = goHome;
module.exports.registerIndex = registerIndex;
module.exports.register = register;
module.exports.goChat = goChat;
