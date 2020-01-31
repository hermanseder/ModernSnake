// Dependencies
const fs = require('fs');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();

const config = require(require.resolve('../../serverConfig'));
const serverCryptoHelper = require(require.resolve('./serverCryptoHelper'));

// Variables
let database;
let getPromise;
let allPromise;
let runPromise;

// Constants
const levelNames = ['Border'];

// External functions
async function initializeAsync() {
    try {
        const dbExists = _databaseExists();

        //create database
        await _openDatabase(config.databaseFile);

        getPromise = util.promisify(database.get);
        allPromise = util.promisify(database.all);
        runPromise = util.promisify(database.run);
        getPromise.call(database, 'PRAGMA foreign_keys = ON');

        if (!dbExists) {
            await _createTablesAsync();
            await _insertDummyDataAsync();
        }
    } catch (e) {
        console.error(e);
        throw new Error('DATABASE_NOT_AVAILABLE');
    }
}

async function destroyAsync() {
    //close database if no longer needed
    try {
        await _closeDatabase();
        database = undefined;
        getPromise = undefined;
    } catch (e) {
        console.log(e.message);
    }
}

async function isUsernameValidAsync(username) {
    try {
        const statement = `
        SELECT COUNT(*) AS count
            FROM user
            WHERE name = ?`;
        const result = await getPromise.call(database, statement, username);
        return result.count > 0;
    } catch (e) {
        return false;
    }
}

async function getPasswordAsync(username) {
    try {
        const statement = `
        SELECT password
            FROM user
            WHERE name = ?`;
        const result = await getPromise.call(database, statement, username);
        return result.password;
    } catch (e) {
        return '';
    }
}

async function getLevelsAsync() {
    try {
        const result = await allPromise.call(database, 'SELECT name AS name FROM level');
        return result;
    } catch (e) {
        throw new Error('LOAD_FAILED');
    }
}

async function storeGameResultAsync(gameName, level, countUsers, difficulty, userData) {
    try {
        await _serializeWrapper(async () => {
            const gameStatement = database.prepare(`
                    INSERT INTO game (name, countUser, level, difficulty) values (?, ?, ?, ?);
                `);
            const gameScoreStatement = database.prepare(`
                    INSERT INTO game_score (user_id, game_id, score, rank) VALUES(?, ?, ?, ?);
                `);
            const gameStatementRunPromise = util.promisify(gameStatement.run);
            const gameScoreStatementRunPromise = util.promisify(gameScoreStatement.run);

            await gameStatementRunPromise.call(gameStatement, gameName, countUsers, level, difficulty);
            const result = await getPromise.call(database, 'SELECT last_insert_rowid() AS id;');
            const gameId = result['id'];
            if (!gameId) throw new Error('INSERT_GAME_FAILED');

            for (const entry of userData) {
                let userId = await _getUserIdFromNameAsync(entry.username);
                if (userId === undefined) throw new Error('USER_NOT_FOUND');

                await gameScoreStatementRunPromise.call(gameScoreStatement, userId, gameId, entry.score, entry.rank);
            }
        });
    } catch (e) {
        console.log(e.message);
        throw new Error('INSERT_FAILED');
    }
}

async function loadScoreDataAsync() {
    try {
        return _serializeWrapper(async () => {
            const availableLevels = await allPromise.call(database, 'SELECT name AS name FROM level;');

            const result = [];
            const scoreStatement = database.prepare(`
                SELECT user.name AS username, MAX(game_score.score) AS score
                FROM game_score
                    INNER JOIN game ON game.id = game_score.game_id
                    INNER JOIN user ON user.id = game_score.user_id
                WHERE game.level = ? AND game_score.score > 0
                    GROUP BY user.name
                    ORDER BY game_score.score DESC
                LIMIT ${config.maxScoreResult};
                `);
            const allPreparedPromise = util.promisify(scoreStatement.all);

            for (const levelResult of availableLevels) {
                const levelName = levelResult.name;
                const scoreData = await allPreparedPromise.call(scoreStatement, levelName);

                if (scoreData.length > 0) {
                    result.push({name: levelName, scoreData: scoreData});
                }
            }

            return result;
        });
    } catch (e) {
        throw new Error('LOAD_FAILED');
    }
}

async function getLevelWallsAsync(levelName) {
    const levelWallStatement = database.prepare(`
    SELECT rowNr, colNr, value
    FROM matrix
    WHERE level = ?
    ORDER BY rowNr, colNr;`);
    const getAllPromise = util.promisify(levelWallStatement.all);
    const result = await getAllPromise.call(levelWallStatement, levelName);

    if (result) {
        const matrix = [];

        for (const resultRow of result) {
            if (resultRow.value === 1 && resultRow.rowNr !== undefined && resultRow.colNr !== undefined) {
                matrix.push({x: resultRow.rowNr, y: resultRow.colNr});
            }
        }
        return matrix;
    }
    return [];
}


async function storeLevelAsync(levelName, levelData) {
    try {
        return _serializeWrapper(async () => {
            const levelStatement = database.prepare(`INSERT INTO level(name) VALUES (?);`);

            const levelStatementRunPromise = util.promisify(levelStatement.run);
            await levelStatementRunPromise.call(levelStatement, levelName);


            for (const entry of levelData) {
                const matrixStatement = database.prepare(`INSERT INTO matrix (rowNr, colNr, value, level) VALUES(?, ?, ?, ?);`);
                const matrixStatementRunPromise = util.promisify(matrixStatement.run);
                await matrixStatementRunPromise.call(matrixStatement, entry.y, entry.x, true, levelName);
            }

            return true;
        });
    } catch (e) {
        throw new Error('STORE_FAILED');
    }
}

// Internal functions
async function _serializeWrapper(callback) {
    return new Promise((resolve, reject) => {
        database.serialize(async function () {
            try {
                const result = await callback(resolve, reject);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function _openDatabase(fileName) {
    return new Promise((resolve, reject) => {
        if (database) {
            reject(new Error('DATABASE_ALREADY_OPEN'));
        } else {
            const tmpDatabase = new sqlite3.Database(config.databaseFile, (err) => {
                if (err) {
                    reject(err);
                } else {
                    database = tmpDatabase;
                    resolve();
                    console.log('Connected to the SQlite database.');
                }
            });
        }
    });
}

async function _closeDatabase() {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject(new Error('DATABASE_ALREADY_CLOSED'));
        } else {
            database.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
    })
}

function _databaseExists() {
    try {
        return fs.existsSync(config.databaseFile);
    } catch (e) {
        return false;
    }
}

async function _createTablesAsync() {
    await _serializeWrapper(async () => {
        await runPromise.call(database, _sqlTableUser());
        await runPromise.call(database, _sqlTableLevel());
        await runPromise.call(database, _sqlTableGame());
        await runPromise.call(database, _sqlTableGameScore());     // TO-DO CHECK IMPLEMENTATION
        await runPromise.call(database, _sqlCreateTableMatrix());  // TO-DO CHECK IMPLEMENTATION
    });
}

function _sqlTableUser() {
    return `
        CREATE TABLE user(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            password TEXT NOT NULL
          );
    `;
}

function _sqlTableLevel() {
    return `
        CREATE TABLE level(
            name TEXT PRIMARY KEY
          );
    `;
}

function _sqlTableGame() {
    return `
        CREATE TABLE game(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            countUser INTEGER NOT NULL,
            level TEXT NOT NULL,
            difficulty INTEGER NOT NULL,
            CONSTRAINT fk_level
                FOREIGN KEY (level)
                REFERENCES level(name)
          );
    `;
}

function _sqlTableGameScore() {
    return `
        CREATE TABLE game_score(
            game_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            rank INTEGER NOT NULL,
            CONSTRAINT pk_game_score
                PRIMARY KEY (user_id, game_id),          
            CONSTRAINT fk_game
                FOREIGN KEY (game_id)
                REFERENCES game(id),
            CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES user(id)
          );
    `;
}

function _sqlCreateTableMatrix() {
    return `
        CREATE TABLE matrix(
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            level TEXT NOT NULL,
            rowNr INTEGER NOT NULL, 
            colNr INTEGER NOT NULL, 
            value BOOLEAN, 
            CONSTRAINT fk_level
                FOREIGN KEY (level)
                REFERENCES level(name)
        ); 
    `;
}

async function _insertDummyDataAsync() {
    const userData = await _sqlDummyDataUserAsync();

    await _serializeWrapper(async () => {
        for (const sql of userData) {
            await runPromise.call(database, sql);
        }
    });

    await _createDummyLevels();
}

async function _sqlDummyDataUserAsync() {
    const users = [
        {username: 'user1', password: 'pw1'},
        {username: 'user2', password: 'pw2'},
        {username: 'user3', password: 'pw3'},
        {username: 'user4', password: 'pw4'},
        {username: 'user5', password: 'pw5'},
        {username: 'user6', password: 'pw6'},
    ];

    const result = [];
    for (const user of users) {
        const passwordHashed = await serverCryptoHelper.generatePasswordHash(user.password, config.userSalt);
        result.push(`
            INSERT INTO user (name, password) VALUES (
                '${user.username}', 
                '${passwordHashed}'
            );`
        );
    }

    return result;
}

async function _createDummyLevels() {
    await _createDummyLevelBorder();
    await _createDummyLevelSmile(); 
}

async function _createDummyLevelSmile() {
    const levelName = 'Smile';
    const walls = [];
    const dimension = config.gameDimensions;

    for (let i = 0; i < dimension; i++) {
        //eyes
        if (i > 8 && i < 17) {
            walls.push({x: 10, y: i});
        }
        if (i > 21 && i < 30) {
            walls.push({x: 10, y: i});
        }
        //mouth
        if (i > 12 && i < 19) {
            walls.push({x: 24, y: i});
        }
        if (i > 19 && i < 26) {
            walls.push({x: 24, y: i});
        }
    }
    //mouth 2nd
    walls.push({x: 23, y: 12});
    walls.push({x: 23, y: 26});
    walls.push({x: 22, y: 11});
    walls.push({x: 22, y: 27});    
    //corner left head
    walls.push({x: 0, y: 0});
    walls.push({x: 0, y: 1});
    walls.push({x: 1, y: 0});
    //corner rigth head
    walls.push({x: 0, y: 37});
    walls.push({x: 0, y: 38});
    walls.push({x: 1, y: 38});
    //corner left bottom 
    walls.push({x: 37, y: 0});
    walls.push({x: 38, y: 1});
    walls.push({x: 38, y: 0});
    //corner right bottom
    walls.push({x: 37, y: 38});
    walls.push({x: 38, y: 38});
    walls.push({x: 38, y: 37});
    //store level in database
    await storeLevelAsync(levelName, walls);
}

async function _createDummyLevelBorder() {
    const levelName = 'Border';
    const walls = [];
    const dimension = config.gameDimensions;

    for (let i = 0; i < dimension; i++) {
        if (i != Math.floor(dimension / 2)) {
            walls.push({x: 0, y: i});
            walls.push({x: dimension - 1, y: i});
            walls.push({x: i, y: 0});
            walls.push({x: i, y: dimension - 1 });
        }
    }

    await storeLevelAsync(levelName, walls);
}

async function _getUserIdFromNameAsync(username) {
    const gameStatement = database.prepare('SELECT id FROM user WHERE name = ?;');
    const getPromise = util.promisify(gameStatement.get);
    const result = await getPromise.call(gameStatement, username);
    return result ? result.id : undefined;
}

// Exports
module.exports = {
    initializeAsync: initializeAsync,
    destroyAsync: destroyAsync,
    isUsernameValidAsync: isUsernameValidAsync,
    getPasswordAsync: getPasswordAsync,
    getLevelsAsync: getLevelsAsync,
    storeGameResultAsync: storeGameResultAsync,
    loadScoreDataAsync: loadScoreDataAsync,
    storeLevelAsync: storeLevelAsync,
    getLevelWallsAsync: getLevelWallsAsync,

    levelNames: levelNames
}
