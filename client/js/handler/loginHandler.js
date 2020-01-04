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

    function login(username, password) {
        _requestedUser = username;
        _passwordHash = _getPasswordHash(password);

        _socketCommunication.on(socketCommands.unauthorized, _unauthorizedHandler);
        _socketCommunication.on(socketCommands.loginRequest, _loginRequest);
        _socketCommunication.on(socketCommands.loginSucceeded, _loginSucceeded);

        _socketCommunication.emit(socketCommands.authentication, {username: username});
    }

    function isLoggedIn() {
        return _currentToken !== undefined;
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
        if (!_requestReceived || !data || !data.token){
            _loginFailed('MISSING_DATA');
            return;
        }

        _currentToken = data.token;
        _currentUser = _requestedUser;
        _requestReceived = false;
        _passwordHash = undefined;
        _requestedUser = undefined;

        LoginUiHandler.updateCurrentUser(_currentUser);
        LoginUiHandler.clearLogin();
        ContentHandler.closeUsermenu();
        _loginEnd();
        console.log('current token: ' + _currentToken);
    }

    function _loginEnd() {
        _socketCommunication.off(socketCommands.unauthorized);
        _socketCommunication.off(socketCommands.loginRequest);
        _socketCommunication.off(socketCommands.loginSucceeded);
    }

    function _loginFailed(message) {
        LoginUiHandler.showError();
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
        login: login,
        isLoggedIn: isLoggedIn
    };
})();
