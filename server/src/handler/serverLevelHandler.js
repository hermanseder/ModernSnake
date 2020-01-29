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
const config = require(require.resolve('./../../serverConfig'));

class ServerLevelHandler {

    constructor() {
    }

    initialize(socket) {
        this._ioCommunication = socket;
    }

    async saveLevelAsync(levelName, levelData) {
        // TODO GERI validate levelName
        const nameResult = await databaseHelper.getLevelsAsync();

        if(!!nameResult.find(r => r.name === levelName)) {
            throw new Error("INVALID_LEVEL_NAME");
        }

        // TODO GERI validate levelData
        let invalidColFound = false;
        for(const entry of levelData) {
            console.log(entry);
            if (entry.x === undefined || entry.y === undefined || entry.x > config.gameDimension || entry.y > config.gameDimension) {
                invalidColFound = true;
            }
        }
        if(invalidColFound) {
            throw new Error("INVALID_DATA_FOUND");
        }
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
