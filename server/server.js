/*
socketResult: {
    success: boolean;
    failure?: string;
    data?: any;
}
 */

// Dependencies
const socketIO = require('socket.io');
const socketAuth = require('socketio-auth');

const config = require(require.resolve('./serverConfig'));
const socketAuthenticationHelper = require(require.resolve('./src/helper/socketAuthenticationHelper'));
const databaseHelper = require(require.resolve('./src/helper/databaseHelper'));
const socketCommands = require(require.resolve('./socketCommands'));
const requestHelper = require(require.resolve('./src/helper/requestHelper'));

const serverLoginHandler = require(require.resolve('./src/handler/serverLoginHandler'));
const serverRoomHandler = require(require.resolve('./src/handler/serverRoomHandler'));
const serverGameHandler = require(require.resolve('./src/handler/serverGameHandler'));

// Variables
let ioCommunication;

// External functions
async function startServerAsync(server) {
    try {
        await databaseHelper.initializeAsync();

        ioCommunication = socketIO.listen(server);
        _initializeSocket();
        _initializeAuthentication();

        _initializeGames();
        _initializeRooms();
    } catch (e) {
        console.error(e.message);
        throw e;
    }
}

function stopServer() {
    ioCommunication.disconnect();
}


// Internal functions
function _initializeSocket() {
    // nothing to do.
}

function _initializeAuthentication() {
    socketAuth(ioCommunication, {
        authenticate: socketAuthenticationHelper.authenticate,
        postAuthenticate: _initializeHandlers,
        disconnect: socketAuthenticationHelper.disconnect,
        timeout: 'none'
    });
}

function _initializeHandlers(socket, data) {
    _initializeHandlersGame(socket);
    _initializeHandlerScore(socket);
}

/* GAME */

function _initializeHandlersGame(socket) {
    socket.on(socketCommands.logout, (auth, callback) => _logout(socket, auth, callback));

    socket.on(socketCommands.getDifficulty, _getDifficulty);
    socket.on(socketCommands.getLevels, _getLevels);

    socket.on(socketCommands.startSinglePlayer, ((auth, difficulty, level, callback) =>
        _startSinglePlayer(auth, socket, difficulty, level, callback)));
    socket.on(socketCommands.leaveRoom, (auth) => _leaveRoom(auth, socket.id));
    socket.on(socketCommands.createRoom2, (auth, roomName, level, difficulty, callback) => _createRoom(auth, roomName, level, difficulty, 2, callback));
    socket.on(socketCommands.createRoom3, (auth, roomName, level, difficulty, callback) => _createRoom(auth, roomName, level, difficulty, 3, callback));
    socket.on(socketCommands.createRoom4, (auth, roomName, level, difficulty, callback) => _createRoom(auth, roomName, level, difficulty, 4, callback));

    socket.on(socketCommands.getRooms2, (auth, callback) => _getRooms(2, auth, callback));
    socket.on(socketCommands.getRooms3, (auth, callback) => _getRooms(3, auth, callback));
    socket.on(socketCommands.getRooms4, (auth, callback) => _getRooms(4, auth, callback));

    socket.on(socketCommands.getRoomNames, _getRoomNames);

    socket.on(socketCommands.getCurrentRoom2, (auth, callback) => _getCurrentRoom(2, auth, socket.id, callback));
    socket.on(socketCommands.getCurrentRoom3, (auth, callback) => _getCurrentRoom(3, auth, socket.id, callback));
    socket.on(socketCommands.getCurrentRoom4, (auth, callback) => _getCurrentRoom(4, auth, socket.id, callback));

    socket.on(socketCommands.joinRoom, (auth, name, callback) => _joinRoom(auth, name, socket, callback));
}

function _initializeHandlerScore(socket) {
    socket.on(socketCommands.loadScore, _loadScore);
}

function _removeListener(socket) {
    socket.disconnect;
    for (const eventName of socket.eventNames()) {
        if (eventName === socketCommands.authentication) continue;
        socket.removeAllListeners(eventName);
    }
}

function _callWrapper(auth, socketCallback, functionCallback) {
    try {
        requestHelper.checkRequestValidAsync(auth).then((valid) => {
            if (valid) {
                functionCallback();
            } else {
                if (socketCallback) socketCallback({success: false, failure: config.tokenInvalid});
            }
        });
    } catch (e) {
        if (socketCallback) socketCallback({success: false, failure: error.message});
        console.log(e);
    }
}

function _logout(socket, auth, callback) {
    _callWrapper(auth, callback, () => {
        serverRoomHandler.leaveRoom(socket.id);
        serverLoginHandler.logoutAsync(socket.username)
            .then(() => {
                _removeListener(socket);
                callback({success: true})
            })
            .catch((error) => callback({success: false, failure: error.message}));
    });
}

function _getDifficulty(auth, callback) {
    _callWrapper(auth, callback, () => {
        callback({success: true, data: config.gameDifficulty});
    });
}

function _getLevels(auth, callback) {
    _callWrapper(auth, callback, () => {
        databaseHelper.getLevelsAsync()
            .then((result) => callback({success: true, data: result}))
            .catch((error) => callback({success: false, failure: error.message}));
    });
}

function _startSinglePlayer(auth, socket, difficulty, level, callback) {
    _callWrapper(auth, callback, () => {
        serverRoomHandler.createRoom(socket.id, level, 1, Number(difficulty));
        serverRoomHandler.joinRoom(socket.id, socket);
        callback({success: true});
    });
}

function _leaveRoom(auth, socketId) {
    _callWrapper(auth, undefined, () => {
        serverRoomHandler.leaveRoom(socketId);
    });
}

function _getRoomNames(auth, callback) {
    _callWrapper(auth, callback, () => {
        callback({success: true, data: serverRoomHandler.getRoomNames()});
    });
}

function _getRooms(size, auth, callback) {
    _callWrapper(auth, callback, () => {
        callback({success: true, data: serverRoomHandler.getRooms(size)});
    });
}

function _getCurrentRoom(size, auth, socketId, callback) {
    _callWrapper(auth, callback, () => {
        callback({success: true, data: serverRoomHandler.getCurrentRoom(size, socketId)});
    });
}

function _createRoom(auth, roomName, level, difficulty, countPlayers, callback) {
    _callWrapper(auth, callback, () => {
        serverRoomHandler.createRoom(roomName, level, countPlayers, Number(difficulty), callback);
        callback({success: true});
    });
}

function _joinRoom(auth, name, socket, callback) {
    _callWrapper(auth, callback, () => {
        serverRoomHandler.joinRoom(name, socket);
        callback({success: true});
    });
}

function _loadScore(auth, callback) {
    _callWrapper(auth, callback, () => {
        databaseHelper.loadScoreDataAsync()
            .then((data) => callback({success: true, data: data}))
            .catch((e) => callback({success: false, failure: e.message}));
    });
}

function _initializeRooms() {
    serverRoomHandler.initialize(ioCommunication);

    for (let i = 0; i < databaseHelper.levelNames.length; i++) {
        const levelName = databaseHelper.levelNames[i];
        for (let j = 2; j <= 4; j++) {
            serverRoomHandler.createRoom(`Room ${j} - ${i + 1} easy`, levelName, j, 0);
            serverRoomHandler.createRoom(`Room ${j} - ${i + 1} normal`, levelName, j, 1);
            serverRoomHandler.createRoom(`Room ${j} - ${i + 1} hard`, levelName, j, 2);
        }
    }
}

function _initializeGames() {
    serverGameHandler.initialize(ioCommunication);
}

/* HELPER */

// Exports
module.exports = {
    startServerAsync: startServerAsync,
    stopServer: stopServer
};
