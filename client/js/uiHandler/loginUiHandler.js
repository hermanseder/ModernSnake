let LoginUiHandler = (function () {
    /* Variables */
    let _loginUsername;
    let _loginPassword;
    let _loginButton;
    let _loginMessage;
    let _currentUser;

    /* External functions */
    function initialize() {
        _loginUsername = $('#login-username');
        _loginPassword = $('#login-password');
        _loginButton = $('#login-button');
        _loginMessage = $('#login-message');
        _currentUser = $('#current-user');

        _updateLoginEnabled();

        _initializeClickEvents();
        _initializeKeyEvents();
    }

    function clearLogin() {
        _loginUsername.val('');
        _loginPassword.val('');
        _removeErrorMessage();
    }

    function showError() {
        _loginMessage.removeClass('error-message-hidden');
    }

    function updateCurrentUser(username) {
        _currentUser.text(username || 'Login');
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
            _removeErrorMessage();
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

    function _removeErrorMessage() {
        _loginMessage.addClass('error-message-hidden');
    }

    /* Exports */
    return {
        initialize: initialize,
        clearLogin: clearLogin,
        showError: showError,
        updateCurrentUser: updateCurrentUser,
    };

})();

