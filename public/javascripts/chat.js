$(function(){
	var userId = $('input#userId').val();
	var userName = $('input#userName').val();
	var roomId = $('input#roomId').val();
	var roomName= $('input#roomName').val();
	var chat = io.connect('/chat/' + roomName);

	chat.on('chat-connected', function(){
		chat.json.emit('init-chat', {userId: userId, userName: userName, roomId: roomId});
	});

	chat.on('message', function(data){
		console.log(data);
		var messageUserId = data.userId;
		var userName = data.userName;
		var comment = data.comment;
		if(userId === messageUserId) {
			$('ul.message').append('<li><span class="label label-success">' + userName + ' : ' + comment + '</span></li>');
		}else {
			$('ul.message').append('<li><span class="label">' + userName + ' : ' +comment+ '</span></li>');
		}
	});

	$('button.comment').on('click', function(e){
		var roomId = $(this).attr('id');
		var comment = $('textarea.comment').val();
		$('textarea.comment').val('');
		chat.json.emit('send-comment', {'roomId': roomId, 'comment': comment});
	});
});
