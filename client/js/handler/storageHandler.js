const StorageHandler = (function () {
    /* Declarations */
    let _storage;
    let _sessionStorage;

    /* Constants */
    const _keyUsername = 'username';
    const _keyToken = 'token';

    function initialize() {
        _storage = window.localStorage;
        _sessionStorage = window.sessionStorage;
    }

    function setUsername(username) {
        if (!_storage) return;
        _storage.setItem(_keyUsername, username);
    }

    function getUsername() {
        if (_storage) {
            return _storage.getItem(_keyUsername);
        }
        return undefined;
    }

    function resetUsername() {
        if (!_storage) return;
        _storage.removeItem(_keyUsername);
    }

    function setToken(token) {
        if (!_sessionStorage) return;
        _sessionStorage.setItem(_keyToken, token);
    }

    function getToken() {
        if (_sessionStorage) {
            return _sessionStorage.getItem(_keyToken);
        }
        return undefined;
    }

    function resetToken() {
        if (!_sessionStorage) return;
        _sessionStorage.removeItem(_keyToken);
    }

    /* Exports */
    return {
        initialize: initialize,

        setUsername: setUsername,
        getUsername: getUsername,
        resetUsername: resetUsername,

        setToken: setToken,
        getToken: getToken,
        resetToken: resetToken
    };
})();
