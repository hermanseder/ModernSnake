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
    await databaseHelper.initializeAsync();

    ioCommunication = socketIO.listen(server);
    _initializeSocket();
    _initializeAuthentication();

    _initializeGames();
    _initializeRooms();
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
    socket.on(socketCommands.logout, (auth, callback) =>  _logout(socket, auth, callback));

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

function _logout(socket, auth, callback) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUHT_INVALID');
        serverRoomHandler.leaveRoom(socket.id);
        serverLoginHandler.logoutAsync(socket.username)
            .then(() => {
                _removeListener(socket);
                callback({success: true})
            })
            .catch((error) => callback({success: false, failure: error.message}));
    } catch (e) {
        if (callback) callback([]);
        console.log(e);
    }
}

function _getDifficulty(auth, callback) {
    try {
        let result = [];
        if (requestHelper.checkRequestValid(auth)) {
            result = config.gameDifficulty;
        }
        callback(result);
    } catch (e) {
        if (callback) callback([]);
        console.log(e);
    }
}

function _getLevels(auth, callback) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUHT_INVALID');

        databaseHelper.getLevelsAsync()
            .then((result) => callback(result))
            .catch(() => callback([]));
    } catch (e) {
        if (callback) callback([]);
        console.log(e);
    }
}

function _startSinglePlayer(auth, socket, difficulty, level, callback) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUHT_INVALID');
        serverRoomHandler.createRoom(socket.id, level, 1, Number(difficulty));
        serverRoomHandler.joinRoom(socket.id, socket);
        callback(true);
    } catch (e) {
        if (callback) callback(false);
        console.log(e);
    }
}

function _leaveRoom(auth, socketId) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUHT_INVALID');
        serverRoomHandler.leaveRoom(socketId);
    } catch (e) {
        console.log(e);
    }
}

function _getRoomNames(auth, callback) {
    try {
        let result = [];
        if (requestHelper.checkRequestValid(auth)) {
            result = serverRoomHandler.getRoomNames();
        }
        callback({success: true, data: result});
    } catch (e) {
        if (callback) callback({success: false, failure: e.message});
        console.log(e);
    }
}

function _getRooms(size, auth, callback) {
    try {
        let result = [];
        if (requestHelper.checkRequestValid(auth)) {
            result = serverRoomHandler.getRooms(size);
        }
        callback(result);
    } catch (e) {
        if (callback) callback([]);
        console.log(e);
    }
}

function _getCurrentRoom(size, auth, socketId, callback) {
    try {
        let result = undefined;
        if (requestHelper.checkRequestValid(auth)) {
            result = serverRoomHandler.getCurrentRoom(size, socketId);
        }
        callback({success: true, data: result});
    } catch (e) {
        if (callback) callback({success: false, failure: e.message});
        console.log(e);
    }
}

function _createRoom(auth, roomName, level, difficulty, countPlayers, callback) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUTH_INVALID');
        serverRoomHandler.createRoom(roomName, level, countPlayers, Number(difficulty), callback);
        callback({success: true});
    } catch (e) {
        console.log(e);
        if (callback) callback({success: false, failure: e.message});
    }
}

function _joinRoom(auth, name, socket, callback) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUTH_INVALID');
        serverRoomHandler.joinRoom(name, socket);
        callback({success: true});
    } catch (e) {
        console.log(e);
        if (callback) callback({success: false, failure: e.message});
    }
}

function _loadScore(auth, callback) {
    try {
        if (!requestHelper.checkRequestValid(auth)) throw new Error('AUTH_INVALID');
        // load data from database
        databaseHelper.loadScoreDataAsync()
            .then((data) => callback({success: true, result: data}))
            .catch((e) => callback({success: false, failure: e.message}));
    } catch (e) {
        console.log(e);
        if (callback) callback({success: false, failure: e.message});
    }
}

function _initializeRooms() {
    serverRoomHandler.initialize(ioCommunication);

    serverRoomHandler.createRoom('room 2 easy', 'default level', 2, 0);
    serverRoomHandler.createRoom('room 2 normal', 'default level', 2, 1);
    serverRoomHandler.createRoom('room 2 hard', 'default level', 2, 2);
    serverRoomHandler.createRoom('room 3', 'default level', 3, 0);
    serverRoomHandler.createRoom('room 4', 'default level', 4, 0);
    //
    // const dummyData = {id: 'dummy'};
    // serverRoomHandler.joinRoom('room 2', dummyData);
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
