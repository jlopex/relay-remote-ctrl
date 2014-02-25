/* HTTP server port */
PORT = 8002;
/* Serial port Name */
var portName = '/dev/ttyUSB0';

var sys = require('sys'),
fs = require('fs'),
url = require('url'),
http = require('http'),
sio = require('socket.io'),
util = require('./util'),
serial = require('serialport');

/* Instantiate the HTTP server */
var server = http.createServer(function(req, res) {
	var handler = util.getMap[url.parse(req.url).pathname] || util.not_found;

	res.simpleJSON = function(code, obj) {
		var body = JSON.stringify(obj);
		res.writeHead(code, {
			'Content-Type': 'text/json',
			'Content-Length': body.length
		});
		res.write(body);
		res.end();
	};
	handler(req, res);
});

/* Instantiate IO socket on server */
var io = sio.listen(server);

/* define serial port */

var serialPort = serial.SerialPort;
var sp = new serialPort(portName, {
	baudRate: 9600,
	dataBits: 8,
	parity: 'none',
	stopBits: 1,
	flowControl: false
});


function writeCmdToSerial (socket, data) {
	var dec = 0;

	if (data['cmd'] == 'STATUS') {
		dec = 91;
	} else if (data['cmd'] == 'TEMP') {
		dec = 98;
	} else if (data['cmd'] == 'ON') {
		dec = (100 + parseInt(data['arg']));
	} else if (data['cmd'] == 'OFF') {
		dec = (110 + parseInt(data['arg']));
	} 
	console.log('DEC: ' + dec + ' HEX: 0x' + dec.toString(16));

	sp.write(String.fromCharCode(dec), function (err, bytesWritten) {
                console.log('bytes written:', bytesWritten);
        });
}

function pad(width, string, padding) {
	return (width <= string.length) ? string : pad(width, padding + string, padding)
}

/* IO (socket and serial) event handler */
io.sockets.on('connection', function(socket) {
	var req_data;
	var buffer = '';
	console.log("Socket connected");
	socket.emit('connected', 123);

	/* IO socket command event */
	socket.on('command', function(data) {
		req_data = data;
		console.log("Received command: " + data['cmd']);
		console.log("Received command: " + data['arg']);
		writeCmdToSerial(socket, data);
	});

	/* Serial port data event */
	sp.on('data', function (data) {

		if (req_data == null)
			return;

		console.log("Received serial data: " + data);
		buffer += data.toString()
		/* TEMP returns as char array */
		if (req_data['cmd'] == 'TEMP' &&
		    buffer.indexOf('\n') === -1)
			return;

		if (req_data['cmd'] == 'STATUS') {
			var dec = data.readUInt8(0)
			var binStr = parseInt(dec).toString(2);
			buffer = pad(8, binStr, '0');
		}

		socket.emit('response', buffer);
		buffer = '';
		req_data = null;
	});
 
	/* Serial port close event */
	sp.on('close', function (err) {
		console.log('serial port has been closed');
	});
 
	/* Serial port error event */
	sp.on('error', function (err) {
		console.error("serial port error", err);
	});
 
	/* Serial port open event */
	sp.on('open', function () {
		console.log('serial port has been opened');
	});
});

/* Start listening on PORT */
server.listen(PORT);
console.log('Server running at port: ' + PORT.toString() + '/');

