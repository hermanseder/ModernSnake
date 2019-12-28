// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const server = require('./server/server.js');
const config = require('./config.js');

// Initialization
const app = express();
const httpServer = http.Server(app);

// Configuration
app.set('port', config.port);
app.use('/', express.static(__dirname + config.clientPath));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Start
server.startServer(httpServer, config.authenticateTimeout, __dirname + config.userCredentialPath);
httpServer.listen(app.get('port'), function() {
    console.log('Server started!');
});
