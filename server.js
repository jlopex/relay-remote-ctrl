/* HTTP server port */
PORT = 8002;

var sys = require('sys'),
fs = require('fs'),
url = require('url'),
http = require('http'),
util = require('./util');

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

/* Start listening on PORT */
server.listen(PORT);
console.log('Server running at port: ' + PORT.toString() + '/');

