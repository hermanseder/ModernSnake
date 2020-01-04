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

    createRoom(name, level, countPlayers, speedDegree) {
        console.log(name);
        console.log(this._rooms.has(name));
        if (this.hasRoom(name)) throw new Error('NAME_ALREADY_USED');
        this._rooms.set(name, new ServerRoom(this._ioCommunication, name, level,
            countPlayers, speedDegree, this._roomEndCallback.bind(this)));
    }

    removeRoom(name) {
        if (this.hasRoom(name)) {
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
        for (const room of this._rooms.values()) {
            room.leaveRoom(sourceId);
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
                remainingPlaces: room.getRemainingPlaces()
            });
        }
        return result;
    }

    _roomEndCallback(name) {
        if (this._rooms.has(name)) {
            // Recreate room
            const roomData = this._rooms.get(name);
            this._rooms.delete(name);
            this.createRoom(name, roomData.getLevel(), roomData.getCountPlayers());
        }
    }
}

module.exports = new ServerRoomHandler();
