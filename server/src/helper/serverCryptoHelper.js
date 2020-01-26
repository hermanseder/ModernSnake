// Dependencies
const bcrypt = require('bcrypt');
const util = require('util');
const sha256 = require('js-sha256');
const jwt = require('jsonwebtoken');
const config = require(require.resolve('../../serverConfig'));

// External functions
async function generateSaltAsync() {
    const genSaltPromise = util.promisify(bcrypt.genSalt);
    return genSaltPromise.call(bcrypt, config.saltRounds);
}

async function generateHashAsync(password, salt) {
    const hashPromise = util.promisify(bcrypt.hash);
    return hashPromise.call(bcrypt, password, salt);
}

async function generateDummySaltAsync(username) {
    // TODO generate user defined salt.
    return generateSaltAsync();
    // const version = await _getBcryptVersionAsync();
    // const trimmedHash = sha256(username).slice(0, 16);
    // return `$${version}$${config.saltRounds}$${trimmedHash}.`;
}

async function compareHashAsync(password, serverSalt, clientHash) {
    const comparePromise = util.promisify(bcrypt.compare);
    const hash = await generateHashAsync(password, serverSalt);
    return comparePromise.call(bcrypt, hash, clientHash);
}

async function generatePasswordHashAsync(data, salt) {
    return sha256(`${data}:${salt}`);
}

async function generateJsonWebTokenAsync(data) {
    return jwt.sign(
        data,
        config.jsonWebTokenSecret, {
            expiresIn: config.jsonWebTokenExpirationInSeconds
        }
    );
}

async function isRequestTokenValidAsync(token, username, timeStamp) {
    let jwtData;
    try {
        jwtData = await _getTokenDataAsync(token);
    } catch (e) {
        return _checkExpiredError(e, timeStamp);
    }

    return jwtData.username === username;
}

async function isTokenValidAsync(token, result) {
    let jwtData;
    try {
        jwtData = await _getTokenDataAsync(token);
    } catch (e) {
        return false;
    }

    if (result) {
        result.username = jwtData.username;
    }
    return true;
}

// Internal functions
async function _getTokenDataAsync(token) {
    if (token === undefined) throw new Error('TOKEN_INVALID');

    const verifyPromise = util.promisify(jwt.verify);
    return await verifyPromise.call(jwt, token, config.jsonWebTokenSecret);
}

function _checkExpiredError(error, timeStamp) {
    if (!error) return false;
    if (!timeStamp) return false;
    if (error.name != 'TokenExpiredError') return false;
    if (error.expiredAt < timeStamp) return false;
    return true;
}

async function _getBcryptVersionAsync() {
    // Get correct version
    return '2b';
}

// Exports
module.exports = {
    generateSaltAsync: generateSaltAsync,
    generateHashAsync: generateHashAsync,
    compareHashAsync: compareHashAsync,
    generateDummySaltAsync: generateDummySaltAsync,
    generatePasswordHash: generatePasswordHashAsync,
    generateJsonWebToken: generateJsonWebTokenAsync,
    isRequestTokenValidAsync: isRequestTokenValidAsync,
    isTokenValidAsync: isTokenValidAsync
};
