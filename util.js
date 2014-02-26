/* Response ptr */
var res_ptr;
/* Requested data */
var req_data;
/* Serial port Name */
var portName = '/dev/ttyUSB0';
/* Buffer to receive serial */
var buffer = '';

var sys = require('sys'),
fs = require('fs'),
qs = require('querystring'),
url = require('url'),
serial = require('serialport'),
util = exports;

/* define serial port */
var serialPort = serial.SerialPort;
var sp = new serialPort(portName, {
	baudRate: 9600,
	dataBits: 8,
	parity: 'none',
	stopBits: 1,
	flowControl: false
}, true, function (err) {
	console.log(err.toString());
});

/* define serial port event callbacks */

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

	res_ptr.simpleJSON(200, {
		data: buffer
	});

	buffer = '';
	req_data = null;
	res_ptr = null;
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

/* define util map */

util.getMap = [];

util.get = function(path, handler) {
	util.getMap[path] = handler;
};

util.not_found = function(req, res) {
	var not_found_msg = 'Not Found';

	res.writeHead(404, {
		'Content-Type': 'text/plain',
		'Content-Length': not_found_msg.length
	});
	res.write(not_found_msg);
	res.end();
};

util.staticHandler = function(filename) {
	var body;

	function loadResponseData(callback) {
		fs.readFile(filename, function(err, data) {
			if (err) {
				sys.debug('Error loadinf file ' + filename);
			} else {
				sys.debug('loading file ' + filename);
				body = data;
			}
			callback();
		});
	}

	return function(req, res) {
		loadResponseData(function() {
			res.writeHead(200, { 
				'Content-Type': 'text/html',
				'Content-Length': body.length
			});
			res.write(body);
			res.end();
		});
	};

};

function writeCmdToSerial (data, res) {
	var dec = 0;

	if (data.cmd == 'STATUS') {
		dec = 91;
	} else if (data.cmd == 'TEMP') {
		dec = 98;
	} else if (data.cmd == 'ON') {
		dec = (100 + parseInt(data['arg']));
	} else if (data.cmd == 'OFF') {
		dec = (110 + parseInt(data['arg']));
	} 
	console.log('DEC: ' + dec + ' HEX: 0x' + dec.toString(16));

	sp.write(String.fromCharCode(dec), function (err, bytesWritten) {
		if (bytesWritten == null) {
			res.simpleJSON(200, {
				data: 'KO'
			});
		} else if (data.cmd == 'ON' || data.cmd == 'OFF') {
			res.simpleJSON(200, {
				data: 'OK'
			});
		} else {
			/* On other cases we need to
			* wait for the async response */
			res_ptr = res;
			req_data = data;
		}
        });
}

function pad(width, string, padding) {
	return (width <= string.length) ? 
		string : 
		pad(width, padding + string, padding)
}

util.get('/', util.staticHandler('index.html'));
util.get('/client.js', util.staticHandler('client.js'));
util.get('/jquery-1.4.2.js', util.staticHandler('jquery-1.4.2.js'));

util.get('/command', function(req, res) {

	var data = qs.parse(url.parse(req.url).query);

	console.log("Received command: " + data.cmd);
	console.log("Received arg: " + data.arg);
	writeCmdToSerial(data, res);
});

