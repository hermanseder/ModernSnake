/*

_ioCommunication: socketio;

_name: string;

_level: string;

_countPlayers: int;

_currentPlayers: Map<string, { socket: socketio, username: string }>

_currentGame: ServerGame;

_roomEndCallback: function(name: string): boolean;

_speedDegree: integer;

 */

const config = require('../../serverConfig.js');
const socketCommands = require('../../socketCommands');
const serverGameHandler = require('../handler/serverGameHandler');

class ServerRoom {

    constructor(socket, name, level, countPlayers, speedDegree, roomEndCallback) {
        this._ioCommunication = socket;
        this._name = name;
        this._level = level;
        this._countPlayers = countPlayers;
        this._currentPlayers = new Map();
        this._currentGame = undefined;
        this._speedDegree = speedDegree;
        this._roomEndCallback = roomEndCallback;
    }

    getLevel() {
        return this._level;
    }

    getCountPlayers() {
        return this._countPlayers;
    }

    getSize() {
        return this._countPlayers;
    }

    isAccessible() {
        return (this.getRemainingPlaces() > 0 && this._currentGame === undefined);
    }

    getRemainingPlaces() {
        return this._countPlayers - this._currentPlayers.size;
    }

    joinRoom(socketSource) {
        if (!this.isAccessible()) throw new Error('ROOM_NOT_ACCESSIBLE');

        this._currentPlayers.set(socketSource.id, {socket: socketSource, username: socketSource.username});
        if (socketSource.username) {
            socketSource.join(this._name);
        } else {
            console.log('no socket');
        }

        if (this.getRemainingPlaces() <= 0) {
            this._startGame();
        }
    }

    leaveRoom(socketId) {
        if (this._currentPlayers.has(socketId)) {
            if (this._currentPlayers.get(socketId).socket.username) this._currentPlayers.get(socketId).socket.leave(this._name);
            this._currentGame.playerLeave(socketId);
            this._currentPlayers.delete(socketId);
        }
    }

    roomEmptyAndGameStarted() {
        return (this._currentPlayers.size <= 0 && this._currentGame !== undefined);
    }

    closeRoom() {
        serverGameHandler.stopGame(this._name);
        this._currentGame = undefined;
    }

    _startGame() {
        this._currentGame = serverGameHandler.startGame(this._name, this._level, this._currentPlayers,
            this._speedDegree, this._gameDoneCallback.bind(this));
    }

    _gameDoneCallback() {
        const playerIds = this._currentPlayers.keys();
        for (const playerId of playerIds) {
            this.leaveRoom(playerId);
        }
        this._roomEndCallback(this._name);
    }
}

module.exports = ServerRoom;
