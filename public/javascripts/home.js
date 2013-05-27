$(function(){
	var users = {};
	var socket = io.connect('/');

	var userId = $('input#userId').val();
	var userName = $('input#userName').val();
	console.log(userId + userName);
	socket.on('home-connected', function(){
		socket.json.emit('init', {userId: userId, userName: userName});
	});

	socket.on('join-home', function(data){
		$('ul.users').append('<li><label class="checkbox"><input type="checkbox" class="roomMembers" value="' + data.userId + '">' + data.userName + '</input></label></li>');
	});

	socket.on('out-home', function(data){
		var userId = data.userId;
		$('li#' + userId).remove();
	});

	socket.on('created-room', function(data){
		console.log('created-room');
		var roomId = data.roomId;
		var roomName = data.roomName;
		socket.json.emit('join-chat', {'roomId': roomId, 'roomName': roomName});
		//window.location = info.host + ':' + info.port + '/chat/' + roomName + '?id=' + roomId;
	});

	socket.on('invitation', function(data){
		console.log('invitation');
		$('ul.rooms').append('<li><label><a class="chat-link" id="' + data.roomId +'" name="' + data.roomName + '" href="' + info.host + ':' +info.port + '/chat?name=' + data.roomName + '&id=' + data.roomId + '">'+ data.roomName + '</a></label></li>');
	});

	/*
	socket.on('joined-chat', function(data) {
		var roomId = data.roomId;
		var roomName = data.roomName;
		var link = data.link;
		window.location = link;
	});
	*/

	$('#create-room').on('click', function(e){
		var that = $(this);
		var roomName = $('#roomName').val();
		var members = users;
		socket.json.emit('createRoom', {'roomName': roomName, 'roomMembers': members});
	});


	$('input.roomMembers').on('click', function(e){
		var that = $(this);
		var userId = that.val();
		if(users[userId]) {
			delete users[userId];
		}else {
			users[userId] = 1;
		}
		console.log(users);
	});

	$('a.tab-list').on('click', function(e){
		e.preventDefault();
		var that = $(this).parent('li.tab-list');
		if(that.hasClass('users')){
			that.addClass('active');
			$('li.rooms').removeClass('active');
			$('div.users').removeClass('not-active');
			$('div.rooms').addClass('not-active');
		}else if(that.hasClass('rooms')){
			that.addClass('active');
			$('li.users').removeClass('active');
			$('div.rooms').removeClass('not-active');
			$('div.users').addClass('not-active');
		}
	});

	$('a.chat-link').on('click', function(e){
		e.preventDefault();
		var that = $(this);
		var link = that.attr('href');
		var roomId = that.attr('id');
		var roomName = that.attr('name');
		socket.json.emit('select-chat', {'roomId': roomId, 'roomName': roomName, 'link': link});
		window.location = link;
	});

});
