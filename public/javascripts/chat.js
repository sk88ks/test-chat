$(function(){
	var userId = $('input#userId').val();
	var userName = $('input#userName').val();
	var roomId = $('input#roomId').val();
	var roomName= $('input#roomName').val();
	var chat = io.connect('/chat/' + roomName);

	chat.on('chat-connected', function(){
		socket.json.emit('init-chat', {userId: userId, userName: userName, roomId: roomId});
	});


	$('button.comment').on('click', function(e){
		var roomId = $(this).attr('id');
		var comment = $('textarea.comment').val();
		chat.json.emit('send-comment', {'roomId': roomId, 'comment': comment});
	});
});
