/*
_loginRequests: [
    source: {
        username: string,
        salt: string,
        remainingRetries: int,
    }
]

_loggedInUsers: [
    username: {
        token: string,
        source: string
    }
]
 */

const config = require('../../serverConfig.js');
const serverCryptoHelper = require('../helper/serverCryptoHelper');
const databaseHelper = require('../helper/databaseHelper');

class ServerLoginHandler {
    constructor() {
        this._loginRequests = new Map();
        this._loggedInUsers = new Map();
    }

    async requestLoginAsync(source, username) {
        if (this._hasLoginRequest(source)) throw new Error('ALREADY_REQUESTED');

        const userExists = await databaseHelper.isUsernameValidAsync(username);
        const serverSalt = userExists ? await serverCryptoHelper.generateSaltAsync() :
            await serverCryptoHelper.generateDummySaltAsync(username);

        const maximumRetries = config.maximumPasswordRetries;
        this._loginRequests.set(source, {
            username: username,
            salt: serverSalt,
            remainingRetries: maximumRetries
        });

        return serverSalt;
    }

    async loginAsync(source, username, hash) {
        await this._validateLoginAsync(source, username, hash);

        const token = await serverCryptoHelper.generateJsonWebToken({username: username});
        this._loggedInUsers.set(username, {
            token: token,
            source: source
        });

        console.log('validation completed');
        console.log('token: ' + token);
        return token;
    }

    async logoutAsync(username) {
        if (this._hasLoggedIn(username)) {
            this._loggedInUsers.delete(username);
        }
    }

    async getToken(source, username) {
        if (!this._userNameAndSourceValid(source, username)) return '';
        return this._loggedInUsers.get(username).token;
    }

    async isLoggedInAndValidAsync(source, username, token) {
        if (!this._userNameAndSourceValid(source, username)) return false;

        const tokenValid = await serverCryptoHelper.isRequestTokenValidAsync(token, username);
        return tokenValid;
    }


    async _validateLoginAsync(source, username, hash) {
        if (this._hasLoggedIn(username)) throw new Error('ALREADY_LOGGED_IN');
        if (!this._hasLoginRequest(source)) throw new Error('REQUEST_MISSING');

        let isValid = true;
        isValid = isValid && await databaseHelper.isUsernameValidAsync(username);
        console.log('username:' + isValid);

        const password = await databaseHelper.getPasswordAsync(username);
        const salt = this._loginRequests.get(source).salt;
        isValid = isValid && await serverCryptoHelper.compareHashAsync(password, salt, hash);

        if (!isValid) {
            this._reduceRemainingRetries(source);
            throw new Error('INVALID_PASSWORD');
        }
    }

    _hasLoggedIn(username) {
        return this._loggedInUsers.has(username);
    }

    _hasLoginRequest(source) {
        return this._loginRequests.has(source);
    }

    _reduceRemainingRetries(source) {
        if (this._hasLoginRequest(source)) {
            this._loginRequests.get(source).remainingRetries--;
            if (this._loginRequests.get(source).remainingRetries <= 0) {
                this._removeRequest(source);
            }
        }
    }

    _removeRequest(source) {
        if (this._hasLoginRequest(source)) {
            this._loginRequests.delete(source);
        }
    }

    _userNameAndSourceValid(source, username) {
        if (!this._hasLoggedIn(username)) return false;

        const data = this._loggedInUsers.get(username);
        return data.source === source;
    }
}

module.exports = new ServerLoginHandler();
