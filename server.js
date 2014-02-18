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

/* TODO: Test serial port 

var serialPort = serial.SerialPort;
var sp = new serialPort(portName, {
	baudRate: 9600,
	dataBits: 8,
	parity: 'none',
	stopBits: 1,
	flowControl: false
});

*/

function writeCmdToSerial (data) {
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

/* TODO: Test serial port
	 * NOT SURE IF WE NEED TO CONVERT TO HEX

	sp.write(dec.toString(16), function (err, bytesWritten) {
		console.log('bytes written:', bytesWritten);
	});

*/
}


/* IO (socket and serial) event handler */
io.sockets.on('connection', function(socket){
	console.log("Socket connected");
	socket.emit('connected', 123);

	/* IO socket command event */
	socket.on('command', function(data) {
		console.log("Received command: " + data['cmd']);
		console.log("Received command: " + data['arg']);
		//console.log(json.toString());
		//console.log(json['cmd']);
		//writeCmdToSerial(data);
		socket.emit('response', data['cmd']);
	});

/* TODO: Test serial port
	
	/* Serial port data event   
	sp.on('data', function (data) {
		console.log(data);
		var sOut = new Buffer(data, 'utf')
		console.log(sOut);
		mbRec = sOut.toString('hex');
		console.log(sOut);
		socket.emit('response', sOut);
	});
 
	/* Serial port close event 
	sp.on('close', function (err) {
		console.log('serial port has been closed');
	});
 
	/* Serial port error event 
	sp.on('error', function (err) {
		console.error("serial port error", err);
	});
 
	/* Serial port open event 
	sp.on('open', function () {
		console.log('serial port has been opened');
	});
*/
});

/* Start listening on PORT */
server.listen(PORT);
console.log('Server running at port: ' + PORT.toString() + '/');

