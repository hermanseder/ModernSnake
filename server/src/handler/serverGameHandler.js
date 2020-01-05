/*
_ioCommunication: socketio;

_games: [
    id: {
        gameInstance: Game,
        endCallback: function();
    }
]

 */

const config = require('../../serverConfig.js');
const ServerGame = require('../classes/serverGame');

class ServerGameHandler {

    constructor() {
        this._games = new Map();
    }

    initialize(socket) {
        this._ioCommunication = socket;
    }

    startGame(id, level, players, speedDegree, gameDoneCallback) {
        const game = new ServerGame(this._ioCommunication, id, level, players, speedDegree,
            this._gameEndCallback.bind(this));
        this._games.set(id, {
            gameInstance: game,
            endCallback: gameDoneCallback
        });
        game.startGame();
        return game;
    }

    stopGame(id) {
        if (this._games.has(id)) {
            this._games.get(id).gameInstance.stopGame();
            delete this._games.get(id);
            this._games.delete(id);
        }
    }

    _gameEndCallback(id) {
        if (this._games.has(id)) {
            this._games.get(id).endCallback();
            this._games.delete(id);
        }
    }

}

module.exports = new ServerGameHandler();
