class UserHandler {
    constructor(credentialPath) {
        this._credentialPath = credentialPath;
        this._userCredentials = new Map();
        this._loggedInUsers = new Map();
    }

    initialize() {
        const jsonFile = require(this._credentialPath);
        for (const entry of jsonFile) {
            this._userCredentials.set(entry["userName"], entry["password"]);
        }
    }

    login(userName, password, data) {
        let isValid = true;
        isValid = isValid && !this.isUserLoggedIn(userName);
        isValid = isValid && this._userCredentials.has(userName) && this._userCredentials.get(userName) === password;
        if (isValid) {
            this._loggedInUsers.set(userName, data);
        }
        return isValid;
    }

    logout(userName) {
        if (this._loggedInUsers.has(userName)) {
            this._loggedInUsers.delete(userName);
        }
    }

    isUserLoggedIn(userName) {
        return this._loggedInUsers.has(userName);
    }
}

module.exports = UserHandler;
