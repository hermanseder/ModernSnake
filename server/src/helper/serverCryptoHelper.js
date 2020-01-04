// Dependencies
const config = require('../../serverConfig');
const bcrypt = require('bcrypt');
const util = require('util');
const sha256 = require('js-sha256');
const jwt = require('jsonwebtoken');

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

async function isRequestTokenValidAsync(token, username) {
    let jwtData;
    try {
        jwtData = await _getTokenDataAsync(token);
    } catch (e) {
        return false;
    }

    return jwtData.username === username;
}


// Internal functions
async function _getTokenDataAsync(token) {
    if (token === undefined) throw new Error('TOKEN_INVALID');

    try {
        const verifyPromise = util.promisify(jwt.verify);
        return await verifyPromise.call(jwt, token, config.jsonWebTokenSecret);
    } catch (e) {
        throw new Error('TOKEN_INVALID');
    }
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
    isRequestTokenValidAsync: isRequestTokenValidAsync
};
