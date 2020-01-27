/*
_ioCommunication: socketio;

_games: [
    id: {
        gameInstance: Game,
        endCallback: function();
    }
]

 */

const socketCommands = require(require.resolve('../../socketCommands'));
const databaseHelper = require(require.resolve('../helper/databaseHelper'));


class ServerLevelHandler {

    constructor() {
    }

    initialize(socket) {
        this._ioCommunication = socket;
    }

    async saveLevelAsync(levelName, levelData) {
        // TODO GERI validate levelName
        // TODO GERI validate levelData
        const result = await databaseHelper.storeLevelAsync(levelName, levelData);

        if (result) {
            this.updateLevelNamesAsync();
        }

        return result;
    }

    async updateLevelNamesAsync() {
        this._ioCommunication.emit(socketCommands.updateLevels, await databaseHelper.getLevelsAsync());
    }

}

module.exports = new ServerLevelHandler();
