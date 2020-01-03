let LoginUiHandler = (function () {
    /* Variables */
    let _loginUsername;
    let _loginPassword;
    let _loginButton;

    /* External functions */
    function initialize() {
        _loginUsername = $('#login-username');
        _loginPassword = $('#login-password');
        _loginButton = $('#login-button');

        _initializeClickEvents();
        _initializeKeyEvents();
    }

    function clearLogin() {
        _loginUsername.val('');
        _loginPassword.val('');
    }

    /* Internal functions */
    function _initializeClickEvents() {
        _loginButton.click(_loginButtonClicked);
    }

    function _initializeKeyEvents() {
        _loginUsername.keyup(_updateLoginEnabled);
        _loginPassword.keyup(_updateLoginEnabled);
    }

    function _loginButtonClicked() {
        if (_loginEnabled()) {
            console.log('perform login');
            LoginHandler.login(_loginUsername.val(), _loginPassword.val());
        } else {
            console.log('login not available');
            // TODO add message
        }
    }

    function _updateLoginEnabled() {
        _loginButton.attr('disabled', !_loginEnabled());
    }

    function _loginEnabled() {
        const username = _loginUsername.val();
        if (!username || username.length < ModernSnakeConfig.minimumUsernameLength) return false;

        const password = _loginPassword.val();
        if (!password || password.length < ModernSnakeConfig.minimumPasswordLength) return false;

        return true;
    }

    /* Exports */
    return {
        initialize: initialize,
        clearLogin: clearLogin
    };

})();

