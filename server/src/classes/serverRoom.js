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

    getDifficulty() {
        return this._speedDegree;
    }

    getLevel() {
        return this._level;
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

    hasPlayer(playerId) {
        return this._currentPlayers.has(playerId);
    }

    joinRoom(socketSource) {
        if (!this.isAccessible()) throw new Error('ROOM_NOT_ACCESSIBLE');
        if (this._currentPlayers.has(socketSource.id)) throw new Error('ALREADY_IN_ROOM');

        this._currentPlayers.set(socketSource.id, {socket: socketSource, username: socketSource.username});
        console.log('join ' + socketSource.id + ' to ' + this._name);
        socketSource.join(this._name);

        if (this.getRemainingPlaces() <= 0) {
            this._startGame();
        }
    }

    leaveRoom(socketId) {
        if (this._currentPlayers.has(socketId)) {
            if (this._currentPlayers.get(socketId).socket.username) this._currentPlayers.get(socketId).socket.leave(this._name);
            if (this._currentGame !== undefined) {
                this._currentGame.playerLeave(socketId);
            }
            this._currentPlayers.delete(socketId);
            return true;
        }
        return false;
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
