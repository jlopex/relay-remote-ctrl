/* HTTP server port */
PORT = 8002;

var sys = require('sys'),
fs = require('fs'),
url = require('url'),
http = require('http'),
util = require('./util');

/* Instantiate the HTTP server */
var server = http.createServer(function(req, res) {

	/* Check for authorization */
	var auth = req.headers['authorization'];
	console.log("Authorization Header is: ", auth);

	if (!auth) {
		res.statusCode = 401;
		res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
		res.end('<html><body>Need some creds son</body></html>');
		return;

	} else if (auth) {
		var tmp = auth.split(' ');
		var buf = new Buffer(tmp[1], 'base64');
		var plain_auth = buf.toString();
		console.log("Decoded Authorization ", plain_auth);

		// At this point plain_auth = "username:password"
		var creds = plain_auth.split(':');
		var username = creds[0];
		var password = creds[1];

		if((username != 'admin') || (password != 'pass')) {
			res.statusCode = 401; // Force them to retry authentication
			res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
			res.end('<html><body>You shall not pass</body></html>');
			return;
		}
	}

	/* We only get there if authentication has happened */

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

