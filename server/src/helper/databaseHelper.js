// Dependencies
const fs = require('fs');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();

const config = require(require.resolve('../../serverConfig'));
const serverCryptoHelper = require(require.resolve('./serverCryptoHelper'));

// Variables
let database;
let getPromise;

// External functions
async function initializeAsync() {
    const dbExists = _databaseExists();
    //create database
    database = new sqlite3.Database(config.databaseFile, (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to the SQlite database.');
      });
    getPromise = util.promisify(database.get);
    getPromise.call(database, 'PRAGMA foreign_keys = ON');
    
    if (!dbExists) {
        _createTables();
        await _insertDummyDataAsync();
    }
}

function destroy() {
    //close database if no longer needed 
    database.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('SQLite database connection.');
      });;
    database = undefined;
    getPromise = undefined;
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
    // TODO implement
    return ['default level'];
}

async function storeGameResultAsync(gameName, level, countUsers, difficulty, userData) {
    try {
        database.serialize(async function () {
            const gameStatement = database.prepare(`
                INSERT INTO game (name, countUser, level, difficulty) values (?, ?, ?, ?);
            `);
            const gameScoreStatement = database.prepare(`
                    INSERT INTO game_score (user_id, game_id, score, rank) VALUES(?, ?, ?, ?);
            `);

            gameStatement.run(gameName, countUsers, level, difficulty);
            const result = await getPromise.call(database, 'SELECT last_insert_rowid() AS id;');
            const gameId = result['id'];
            if (!gameId) throw new Error('INSERT_GAME_FAILED');

            for (const entry of userData) {
                const userId = await _getUserIdFromName(entry.username);
                if (userId === undefined) throw new Error('USER_NOT_FOUND');

                gameScoreStatement.run(userId, gameId, entry.score, entry.rank);
            }
        });
    } catch (e) {
        throw new Error('INSERT_FAILED');
    }
}

async function loadScoreDataAsync() {
return [
    {
        levelName: 'level 1',
        scoreData: [
            {
                username: 'rudi',
                score: 15,
            },                    
            {
                username: 'geri',
                score: 10,
            }
        ]
    },
    {
        levelName: 'level 1',
        scoreData: [
            {
                username: 'rudi',
                score: 15,
            },                    
            {
                username: 'geri',
                score: 10,
            }
        ]
    }
];
}

// Internal functions
function _databaseExists() {
    try {
        return fs.existsSync(config.databaseFile);
    } catch (e) {
        return false;
    }
}

function _createTables() {
    database.serialize(function () {
        database.run(_sqlTableUser());
        database.run(_sqlTableLevel());
        database.run(_sqlTableGame());
        database.run(_sqlTableGameScore());
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

async function _insertDummyDataAsync() {
    const userData = await _sqlDummyDataUserAsync();
    const levelData = await _sqlDummyDataLevelAsync();
    database.serialize(function () {
        for (const sql of userData) {
            database.run(sql);
        }
        for (const sql of levelData) {
            database.run(sql);
        }
    });
}

async function _sqlDummyDataUserAsync() {
    const users = [
        {username: 'rudi', password: 'pw'},
        {username: 'geri', password: 'pw'},
        {username: 'bot1', password: 'pw'},
        {username: 'bot2', password: 'pw'},
        {username: 'bot3', password: 'pw'},
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

async function _sqlDummyDataLevelAsync() {
    const result = [];
    result.push(`
        INSERT INTO level (name) VALUES ('default level');
    `);
    return result;
}

async function _getUserIdFromName(username) {
    const gameStatement = database.prepare('SELECT id FROM user WHERE name = ?;');
    const getPromise = util.promisify(gameStatement.get);
    const result = await getPromise.call(gameStatement, username);
    return result ? result.id : undefined;
}


// Exports
module.exports = {
    initializeAsync: initializeAsync,
    destroy: destroy,
    isUsernameValidAsync: isUsernameValidAsync,
    getPasswordAsync: getPasswordAsync,
    getLevelsAsync: getLevelsAsync,
    storeGameResultAsync: storeGameResultAsync,
    loadScoreDataAsync: loadScoreDataAsync
}
