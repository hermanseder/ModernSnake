// Dependencies
const config = require('../../serverConfig');
const fs = require('fs');
const serverCryptoHelper = require('./serverCryptoHelper');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();

// Variables
let database;
let getPromise;


// External functions
async function initializeAsync() {
    const dbExists = _databaseExists();

    database = new sqlite3.Database(config.databaseFile);
    getPromise = util.promisify(database.get);

    if (!dbExists) {
        _createTables();
        await _insertDummyDataAsync();
    }
}

function destroy() {
    database.close();
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

async function _insertDummyDataAsync() {
    const userData = await _sqlDummyDataUserAsync();
    database.serialize(function () {
        for (const sql of userData) {
            database.run(sql);
        }
    });
}

async function _sqlDummyDataUserAsync() {
    const users = [
        {username: 'rudi', password: 'pw'},
        {username: 'geri', password: 'pw'}
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


// Exports
module.exports = {
    initializeAsync: initializeAsync,
    destroy: destroy,
    isUsernameValidAsync: isUsernameValidAsync,
    getPasswordAsync: getPasswordAsync,
}
