/*
_ioCommunication: socketio;

_games: [
    id: {
        gameInstance: Game,
        endCallback: function();
    }
]

 */

const ServerGame = require(require.resolve('../classes/serverGame'));
const socketCommands = require(require.resolve('../../socketCommands'));
const databaseHelper = require(require.resolve('../helper/databaseHelper'));


class ServerGameHandler {

    constructor() {
        this._games = new Map();
    }

    initialize(socket) {
        this._ioCommunication = socket;
    }

    async startGameAsync(id, level, players, speedDegree, difficulty, gameDoneCallback) {
        const game = new ServerGame(this._ioCommunication, id, level, players, speedDegree, 
            difficulty, this._gameEndCallbackAsync.bind(this));
        this._games.set(id, {
            gameInstance: game,
            endCallback: gameDoneCallback
        });
        await game.startGameAsync();
        return game;
    }

    stopGame(id) {
        if (this._games.has(id)) {
            this._games.get(id).gameInstance.stopGame();
            delete this._games.get(id);
            this._games.delete(id);
        }
    }

    async _gameEndCallbackAsync(id, level, gameSize, difficulty, gameStoreData) {
        if (this._games.has(id)) {
            try {
                await databaseHelper.storeGameResultAsync(id, level, gameSize, difficulty, gameStoreData);
                const scoreData = await databaseHelper.loadScoreDataAsync();
                this._ioCommunication.emit(socketCommands.updateScore, scoreData);
            } catch (e) {
                console.error(e.message);
            }
            this._games.get(id).endCallback();
            this._games.delete(id);
        }
    }

}

module.exports = new ServerGameHandler();
