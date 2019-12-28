// Dependencies
const socketIO = require('socket.io');
const socketAuth = require('socketio-auth');
const UserHandler = require('./src/userHandler')

// Variables
let io;
let userHandler;

// Functions
function startServer(server, timeout, userCredentialPath) {
    userHandler = new UserHandler(userCredentialPath);
    io = socketIO.listen(server);

    userHandler.initialize();
    initializeAuthentication(timeout);
    initializeSockets(io);
}

function stopServer() {
    io.disconnect();
}

function initializeAuthentication(timeout) {
    socketAuth(io, {
        authenticate: authenticate,
        postAuthenticate: postAuthenticate,
        disconnect: disconnect,
        timeout: timeout
    })
}

function authenticate(socket, data, callback) {
    if (userHandler.isUserLoggedIn(data.username)) {
        return callback({ message: 'ALREADY_LOGGED_IN' });
    }

    const success = userHandler.login(data.username, data.password, socket);
    if (success) {
        socket.user = data.username;
        return callback(null, success);
    } else {
        return callback({ message: 'INVALID_CREDENTIALS_OR_USER' });
    }
}

function postAuthenticate(socket, data) {
    console.log('post authenticated');
    socket.on('movement', function (data) {
        console.log('movement: ' + data);
        io.sockets.emit('update', data);
    });
}

function disconnect(socket) {
    console.log(socket.user);
    userHandler.logout(socket.user);
    console.log(socket.id + ' disconnected');
}

function initializeSockets() {
    io.on('connect', function (socket) {
        console.log('connection');
    });
}

// Exports
module.exports = {
    startServer: startServer,
    stopServer: stopServer
};
