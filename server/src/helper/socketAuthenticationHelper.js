// Dependencies
const socketCommands = require(require.resolve('../../socketCommands'));
const serverLoginHandler = require(require.resolve('../handler/serverLoginHandler'));
const serverRoomHandler = require(require.resolve('../handler/serverRoomHandler'));

// External functions
function authenticate(socket, data, callback) {
    if (data === undefined || !data.username) return callback({message: 'INVALID_DATA'});

    if (!data.hash) {
        _authenticateRequest(socket, socket.id, data.username, callback);
    } else {
        _authenticateLogin(socket, socket.id, data.username, data.hash, callback);
    }
}

function disconnect(socket) {
    serverRoomHandler.leaveRoom(socket.id);
    serverLoginHandler.logoutAsync(socket.username).then().catch();
}


// Internal functions
function _authenticateRequest(socket, socketId, username, callback) {
    serverLoginHandler.requestLoginAsync(socketId, username)
        .then((salt) => {
            callback({message: 'LOGIN_REQUESTED',});
            socket.emit(socketCommands.loginRequest, {salt: salt});
        })
        .catch((e) => {
            console.debug(e.message);
            callback({message: 'LOGIN_FAILED'});
        });
}

function _authenticateLogin(socket, socketId, username, hash, callback) {
    serverLoginHandler.loginAsync(socketId, username, hash)
        .then((token) => {
            socket.username = username;
            callback(null, true);
            socket.emit(socketCommands.loginSucceeded, {token: token});
        })
        .catch((e) => {
            console.debug(e.message);
            callback({message: 'LOGIN_FAILED'});
        });
}


// Exports
module.exports = {
    authenticate: authenticate,
    disconnect: disconnect
}


