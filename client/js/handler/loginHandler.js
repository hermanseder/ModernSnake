const LoginHandler = (function () {
    /* Declarations */
    let _socketCommunication;

    let _requestReceived;
    let _requestedUser;
    let _passwordHash;
    let _currentToken;
    let _currentUser;

    /* External functions */
    function initialize(socket) {
        _socketCommunication = socket;
        _requestReceived = false;
    }

    function checkAutoLogin() {
        const sessionToken = StorageHandler.getToken();
        if (!sessionToken) return;

        _requestReceived = true;
        _socketCommunication.on(socketCommands.unauthorized, _unauthorizedHandler);
        _socketCommunication.on(socketCommands.loginSucceeded, _loginSucceeded);
        _socketCommunication.emit(socketCommands.authentication, {token: sessionToken});
    }

    function login(username, password) {
        _requestedUser = username;
        _passwordHash = _getPasswordHash(password);
        _socketCommunication.connect();

        _socketCommunication.on(socketCommands.unauthorized, _unauthorizedHandler);
        _socketCommunication.on(socketCommands.loginRequest, _loginRequest);
        _socketCommunication.on(socketCommands.loginSucceeded, _loginSucceeded);

        _socketCommunication.emit(socketCommands.authentication, {username: username});
    }

    function logout() {
        _socketCommunication.emit(socketCommands.logout, getAuth(), _logoutDone);
    }

    function autoLogout() {
        _logoutDone({success: true}, true);
    }

    function _logoutDone(result, isAutoLogout = false) {
        if (!result) return;
        if (result.success) {
            _socketCommunication.disconnect();
            _currentUser = undefined;
            _currentToken = undefined;
            StorageHandler.resetToken();
            if (!isAutoLogout) StorageHandler.resetUsername();
            LoginUiHandler.loginLogoutSucceeds();
        } else {
            ErrorHandler.showErrorMessage(result.failure);
        }
    }

    function isLoggedIn() {
        return _currentUser !== undefined;
    }

    function getAuth() {
        return {
            username: _currentUser,
            token: _currentToken
        };
    }

    /* Internal functions */
    function _getPasswordHash(password) {
        return CryptoHelper.generatePasswordHash(password, ModernSnakeConfig.userSalt);
    }

    function _loginRequest(data) {
        if (!_requestReceived || !data || !data.salt) {
            _loginFailed('MISSING_DATA');
            return;
        }

        const serverSalt = data.salt;
        CryptoHelper.generateSaltAsync().then(function (clientSalt) {
            CryptoHelper.generateHashAsync(_passwordHash, serverSalt).then(function (serverHash) {
                CryptoHelper.generateHashAsync(serverHash, clientSalt).then(function (clientHash) {
                    _socketCommunication.emit(socketCommands.authentication, {
                        username: _requestedUser,
                        hash: clientHash
                    });
                });
            });
        }).catch(function () {
            _loginFailed('UNEXPECTED_ERROR');
        });
    }

    function _loginSucceeded(data) {
        if (!_requestReceived || !data || !data.token) {
            _loginFailed('MISSING_DATA');
            return;
        }

        _currentToken = data.token;
        _currentUser = _requestedUser || data.username;
        _requestReceived = false;
        _passwordHash = undefined;
        _requestedUser = undefined;

        StorageHandler.setUsername(_currentUser);
        StorageHandler.setToken(_currentToken);
        LoginUiHandler.loginLogoutSucceeds(_currentUser);
        ContentHandler.closeUsermenu();
        _loginEnd();
    }

    function _loginEnd() {
        _socketCommunication.removeAllListeners(socketCommands.unauthorized);
        _socketCommunication.removeAllListeners(socketCommands.loginRequest);
        _socketCommunication.removeAllListeners(socketCommands.loginSucceeded);
    }

    function _loginFailed(message) {
        if (_requestedUser) {
            LoginUiHandler.showError();
        }
        _loginEnd();
        console.error(message);
    }

    function _unauthorizedHandler(data) {
        if (!data) return;
        if (!data.message) return;

        switch (data.message) {
            case ModernSnakeMessages.loginRequested: {
                _requestReceived = true;
                break;
            }
            default:
                _loginFailed(data.message);
        }
    }

    /* Exports */
    return {
        initialize: initialize,
        checkAutoLogin: checkAutoLogin,
        login: login,
        logout: logout,
        autoLogout: autoLogout,
        isLoggedIn: isLoggedIn,
        getAuth: getAuth,
    };
})();
