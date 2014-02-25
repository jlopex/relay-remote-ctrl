/* HW only supports 1-8 relays */
ALL_RELAYS = 0;
MAX_RELAYS = 8;

var App = App || {};

App.config = {
	socket: null,
};

/* Send button click handler */

$('#sendButton').live('click', function(e) {

	var command = $('#cmdInput').attr('value');
	console.log(command);

	/* Validate the input */

	if (command.length > 50) {
		alert('command too long. 50 characters max');
		return false;
	}

	/* Split the command */
	var strArr = command.split(" ");
	
	/* We don't expect more than 2 args */
	/* If length == 1 only TEMP and STATUS accepted*/
	if (strArr.length > 2 || 
	    (strArr.length == 1 &&
	     strArr[0] != 'TEMP' && 
	     strArr[0] != 'STATUS' &&
	     strArr[0] != 'ON' &&
             strArr[0] != 'OFF')) {
		alert('unexpected command');
		return false;
	}

	/* If length == 2 only ON/OFF accepted */
	if (strArr.length == 2) {
		if (strArr[0] != 'ON' && 
		    strArr[0] != 'OFF' ) {
			alert('unexpected command 2');
			return false;
		}
		/* Check that second arg is a number */	
		if (/[^\0-9]/.test(strArr[1])) {
			alert('Bad character found. Only numbers are allowed');
			return false;
		}
		/* Check that the number is smaller than MAX_RELAYS */
		if (parseInt(strArr[1]) > MAX_RELAYS ||
		    parseInt(strArr[1]) < ALL_RELAYS) {
			alert('Check the relay number being used.');
			return false;
		}
	}

	if (strArr.length == 1) {
		/* Send command event */
		App.config.socket.emit('command', {
			'cmd': strArr[0],
			'arg': "0"});
	} else {

		/* Send command event */
		App.config.socket.emit('command', {
			'cmd': strArr[0],
			'arg': strArr[1]});
	}

	return false;

});

/* Connect to IO socket and set IO event callbacks */

App.connectIoSocket = function () {

	App.config.socket = io.connect('http://127.0.0.1:8002');

	/* We got a connection confirmation event */
	App.config.socket.on('connected', function(data) {
		console.log('Connected, this is what I received : ', data);
	});

	/* We got a response event */
	App.config.socket.on('response', function (data) {
		console.log(data);
		$('#resVal').text('Response: ' + data.toString());
		App.showResponse();
	});

}

/* Show Command input div */

App.showCmdInput = function() {
	$('#execute').show();
	$('#response').hide();
	$('#cmdInput').focus();
};

/* Show response div */

App.showResponse = function() {
	$('#execute').show();
	$('#response').show();
};

/* Main */

$(function() {
	App.showCmdInput();
	App.connectIoSocket();
});

