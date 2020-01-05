/*
_ioCommunication: socketio;

_rooms: [
    name: ServerRoom
]

 */

const config = require('../../serverConfig.js');
const ServerRoom = require('../classes/serverRoom');


class ServerRoomHandler {

    constructor() {
        this._rooms = new Map();
    }

    initialize(socket) {
        this._ioCommunication = socket;
    }

    createRoom(name, level, countPlayers, difficulty) {
        const speedDegree = this._getSpeedDegree(difficulty);

        if (this.hasRoom(name)) throw new Error('NAME_ALREADY_USED');
        this._rooms.set(name, new ServerRoom(this._ioCommunication, name, level,
            countPlayers, speedDegree, this._roomEndCallback.bind(this)));
    }

    closeRoom(name) {
        if (this.hasRoom(name)) {
            const room = this._rooms.get(name);
            room.closeRoom();
            this._rooms.delete(name);
        }
    }

    joinRoom(name, sourceSocket) {
        if (!this.hasRoom(name)) throw new Error('ROOM_NOT_EXISTS');

        const room = this._rooms.get(name);
        if (!room.isAccessible()) throw new Error('ROOM_NOT_ACCESSIBLE');

        room.joinRoom(sourceSocket);
    }

    leaveRoom(sourceId) {
        for (const [name, room] of this._rooms) {
            room.leaveRoom(sourceId);
            if (room.roomEmptyAndGameStarted()) {
                this.closeRoom(name);
            }
        }
    }

    hasRoom(name) {
        return this._rooms.has(name);
    }

    getRooms(countPlayers) {
        const result = [];
        for (const [source, room] of this._rooms) {
            if (room.getSize() != countPlayers) continue;
            result.push({
                name: source,
                size: room.getSize(),
                remainingPlaces: room.getRemainingPlaces(),
                level: room.getLevel(),
                difficulty: room.getDifficulty(),
            });
        }
        return result;
    }

    _roomEndCallback(name) {
        if (this._rooms.has(name)) {
            this.closeRoom(name);
        }
    }

    _getSpeedDegree(difficulty) {
        switch (difficulty) {
            case 0:
                return config.gameSnakeSpeed0;
            case 1:
                return config.gameSnakeSpeed1;
            case 2:
                return config.gameSnakeSpeed2;
            default:
                throw new Error('INVALID_DIFFICULTY');
        }
    }
}

module.exports = new ServerRoomHandler();
