/*
_ioCommunication: socketio;

_rooms: [
    name: ServerRoom
]

 */

const socketCommands = require(require.resolve('../../socketCommands'));
const ServerRoom = require(require.resolve('../classes/serverRoom'));


class ServerRoomHandler {

    constructor() {
        this._rooms = new Map();
    }

    initialize(socket) {
        this._ioCommunication = socket;
    }

    createRoom(name, level, countPlayers, difficulty) {
        if (this.hasRoom(name)) throw new Error('NAME_ALREADY_USED');
        this._rooms.set(name, new ServerRoom(this._ioCommunication, name, level,
            countPlayers, difficulty, this._roomEndCallback.bind(this)));
        this._roomsUpdated();
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

        this.leaveRoom(sourceSocket.id, false);
        room.joinRoom(sourceSocket);
        this._roomsUpdated();
    }

    leaveRoom(sourceId, emitEvent = true) {
        let roomLeaved = false;
        for (const [name, room] of this._rooms) {
            const result = room.leaveRoom(sourceId);
            roomLeaved = roomLeaved || result;
            if (room.roomEmptyAndGameStarted()) {
                this.closeRoom(name);
            }
        }
        if (roomLeaved && emitEvent) this._roomsUpdated();
    }

    hasRoom(name) {
        return this._rooms.has(name);
    }

    getCurrentRoom(countPlayers, playerId) {
        for (const [source, room] of this._rooms) {
            if (room.getSize() != countPlayers) continue;
            if (room.hasPlayer(playerId)) {
                return source;
            }
        }
        return undefined;
    }

    getRoomNames() {
        return Array.from(this._rooms.keys());
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

    _roomsUpdated() {
        this._ioCommunication.emit(socketCommands.updateRooms2, this.getRooms(2));
        this._ioCommunication.emit(socketCommands.updateRooms3, this.getRooms(3));
        this._ioCommunication.emit(socketCommands.updateRooms4, this.getRooms(4));
        this._ioCommunication.emit(socketCommands.updateRoomNames, this.getRoomNames());
    }

    _roomEndCallback(name) {
        if (this._rooms.has(name)) {
            this.closeRoom(name);
            this._roomsUpdated();
        }
    }
}

module.exports = new ServerRoomHandler();
