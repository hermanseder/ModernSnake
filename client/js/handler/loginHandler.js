const LoginHandler = (function () {
    /* Declarations */
    let _socketCommunication;
    let _isLoggedIn;

    let _requestReceived;
    let _requestedUser;
    let _passwordHash;
    let _currentToken;

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

    /* Internal functions */
    function _getPasswordHash(password) {
        return CryptoHelper.generatePasswordHash(password, ModernSnakeConfig.userSalt);
    }

    function _loginRequest(data) {
        if (!_requestReceived) return;
        if (!data) return;
        if (!data.salt) return;

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
        });
    }

    function _loginSucceeded(data) {
        if (!_requestReceived) return;
        if (!data) return;
        if (!data.token) return;

        _currentToken = data.token;
        _requestReceived = false;
        _passwordHash = undefined;

        LoginUiHandler.clearLogin();
        console.log('current token: ' + _currentToken);
    }

    function _unauthorizedHandler(data) {
        if (!data) return;
        if (!data.message) return;

        console.log(data.message);
        switch (data.message) {
            case ModernSnakeMessages.loginRequested: {
                _requestReceived = true;
                break;
            }
        }
    }

    /* Exports */
    return {
        initialize: initialize,
        login: login
    };
})();
