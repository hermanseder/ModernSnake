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
const config = require('./serverConfig');
const socketAuthenticationHelper = require('./src/helper/socketAuthenticationHelper');
const serverCryptoHelper = require('./src/helper/serverCryptoHelper');
const databaseHelper = require('./src/helper/databaseHelper');
const socketCommands = require('./socketCommands');
const requestHelper = require('./src/helper/requestHelper');

const serverLoginHandler = require('./src/handler/serverLoginHandler');
const serverRoomHandler = require('./src/handler/serverRoomHandler');
const serverGameHandler = require('./src/handler/serverGameHandler');

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

function _initializeAuthentication(timeout) {
    socketAuth(ioCommunication, {
        authenticate: socketAuthenticationHelper.authenticate,
        postAuthenticate: _initializeHandlers,
        disconnect: socketAuthenticationHelper.disconnect,
        timeout: 'none'
    });
}

function _initializeHandlers(socket, data) {
    _initializeHandlersGame(socket);
}

/* GAME */

function _initializeHandlersGame(socket) {
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

function _initializeRooms() {
    serverRoomHandler.initialize(ioCommunication);

    serverRoomHandler.createRoom('room 2 easy', 1, 2, 0);
    serverRoomHandler.createRoom('room 2 normal', 1, 2, 1);
    serverRoomHandler.createRoom('room 2 hard', 1, 2, 2);
    serverRoomHandler.createRoom('room 3', 1, 3, 0);
    serverRoomHandler.createRoom('room 4', 1, 4, 0);
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


//
//
// // Functions
// function startServer(server, timeout, userCredentialPath) {
//     socketCommunication.connect(server);
// }
//
// async function test() {
//     await databaseHelper.initializeAsync();
//
//
//     // server
//     const serverSalt = await serverLoginHandler.requestLoginAsync('1234', 'rudi');
//     console.log(`SERVER SALT: ${serverSalt}`);
//
//     // client
//     const clientSalt = await serverCryptoHelper.generateSaltAsync();
//     const passwordHash1 = await serverCryptoHelper.generatePasswordHash('pw', 'ModernSnake');
//     // const passwordHash = await serverCryptoHelper.generatePasswordHash(passwordHash1, serverSalt);
//     const clientHash1 = await serverCryptoHelper.generateHashAsync(passwordHash1, serverSalt);
//     const clientHash = await serverCryptoHelper.generateHashAsync(clientHash1, clientSalt);
//
//     // server
//     try {
//         await serverLoginHandler.loginAsync('1234', 'rudi', clientHash);
//         console.log(serverLoginHandler.getToken('1234', 'rudi'));
//         // console.log(await serverLoginHandler.isLoggedInAndValidAsync('1234', 'rudi', t));
//         // console.log(await serverLoginHandler.isLoggedInAndValidAsync('123', 'rudi', t));
//         // console.log(await serverLoginHandler.isLoggedInAndValidAsync('1234', 'geri', t));
//     } catch (e) {
//         console.log(e);
//     }
//
//     return ;
//
//     const result2 = await serverCryptoHelper.compareHashAsync(await serverCryptoHelper.generatePasswordHash('password', 'ModernSnake'), serverSalt, clientHash);
//     console.log(`COMPARE2: ${result2}`);
//     console.log(`DUMMY: ${await serverCryptoHelper.generateDummySaltAsync('rudi')}`);
//     console.log(`DUMMY: ${await serverCryptoHelper.generateDummySaltAsync('rudi')}`);
//     console.log(`DUMMY: ${await serverCryptoHelper.generateDummySaltAsync('geri')}`);
//
// }
// function initializeAuthentication(timeout) {
//     socketAuth(io, {
//         authenticate: authenticate,
//         postAuthenticate: postAuthenticate,
//         disconnect: disconnect,
//         timeout: timeout
//     })
// }
//
// function authenticate(socket, data, callback) {
//     if (userHandler.isUserLoggedIn(data.username)) {
//         return callback({ message: 'ALREADY_LOGGED_IN' });
//     }
//
//     const success = userHandler.login(data.username, data.password, socket);
//     if (success) {
//         socket.user = data.username;
//         return callback(null, success);
//     } else {
//         return callback({ message: 'INVALID_CREDENTIALS_OR_USER' });
//     }
// }
//
// function postAuthenticate(socket, data) {
//     console.log('post authenticated');
//     socket.on('movement', function (data) {
//         console.log('movement: ' + data);
//         io.sockets.emit('update', data);
//     });
// }
//
// function disconnect(socket) {
//     console.log(socket.user);
//     userHandler.logout(socket.user);
//     console.log(socket.id + ' disconnected');
// }
//
// function initializeSockets() {
//     io.set('authorization', function (handshake, callback) {
//         // accept everything. future check domain or something like this.
//         callback(null, true);
//     });
//     io.on('connect', function (socket) {
//         console.log('connection');
//     });
// }
