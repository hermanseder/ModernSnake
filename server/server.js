// Dependencies
const socketIO = require('socket.io');
const socketAuth = require('socketio-auth');
const socketAuthenticationHelper = require('./src/helper/socketAuthenticationHelper');
const serverCryptoHelper = require('./src/helper/serverCryptoHelper');
const databaseHelper = require('./src/helper/databaseHelper');
const socketCommands = require('./socketCommands');

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
    socket.on(socketCommands.getRooms2, (auth, callback) => _getRooms(2, auth, callback));
    socket.on(socketCommands.getRooms3, (auth, callback) => _getRooms(3, auth, callback));
    socket.on(socketCommands.getRooms4, (auth, callback) => _getRooms(4, auth, callback));

    socket.on(socketCommands.joinRoom, (auth, name, callback) => _joinRoom(auth, name, socket, callback));
}

function _getRooms(size, auth, callback) {
    _checkRequestValid(auth);
    const result = serverRoomHandler.getRooms(size);
    console.log(result);
    callback(result);
}

function _joinRoom(auth, name, socket, callback) {
    try {
        serverRoomHandler.joinRoom(name, socket);
        // TODO update room list
        callback(true);
    } catch (e) {
        console.log(e);
        callback(false);
    }
}

function _initializeRooms() {
    serverRoomHandler.initialize(ioCommunication);

    serverRoomHandler.createRoom('room 2', 1, 2, 2);
    serverRoomHandler.createRoom('room 3', 1, 3, 0);
    serverRoomHandler.createRoom('room 4', 1, 4, 0);

    const dummyData = {id: 'dummy'};
    serverRoomHandler.joinRoom('room 2', dummyData);
}

function _initializeGames() {
    serverGameHandler.initialize(ioCommunication);
}

/* HELPER */

function _checkRequestValid(data) {
    let isValid = true;

    isValid = isValid && data !== undefined;
    isValid = isValid && data.username !== undefined;
    isValid = isValid && data.token !== undefined;

    if (isValid) {
        isValid = isValid && serverCryptoHelper.isRequestTokenValidAsync(data.token, data.username);
    }

    if (!isValid) {
        console.log('not valid');
    }
}


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
