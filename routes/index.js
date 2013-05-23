var _ = require('underscore'),
	async = require('async');
var lib = require('../lib');

var routes = {
	'get': {
		'/login': lib.view.loginIndex,
		'/register': lib.view.registerIndex,
		'/home': lib.view.goHome,
		'/chat/:room': lib.view.goChat
	},
	post: {
		'/register': lib.view.register,
		'/login': lib.view.loginConfirm
	}
};

function init(app) {
	for(var method in routes){
		for(var key in routes[method]){
			if(key === '/login' || '/register') {
				app[method](key, routes[method][key]);
			}else {
				app[method](key, lib.auth.ensureAuthentication, routes[method][key]);
			}
		}
	}
	return app;
}

module.exports.init = init;