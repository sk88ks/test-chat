$(function(){
	var chat = io.connect('/chat/');


	chat.on('home-connected', function(){
		var userId = $('input#userId').val();
		var userName = $('input#userName').val();
		var roomId = $('input#roomId').val();
		socket.json.emit('init-chat', {userId: userId, userName: userName, roomId: roomId});
	});

	$('button.comment').on('click', function(e){
		console.log('!!!!!!!!!!!!!');
		var roomId = $(this).attr('id');
		var comment = $('textarea.comment').val();
		chat.json.emit('send-comment', {'roomId': roomId, 'comment': comment});
	});
});
