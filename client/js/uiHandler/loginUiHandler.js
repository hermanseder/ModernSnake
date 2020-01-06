let LoginUiHandler = (function () {
    /* Variables */
    let _loginContainer;
    let _loggedInContainer;

    let _loginUsername;
    let _loginPassword;
    let _loginButton;
    let _loginMessage;
    let _loggedInUser;
    let _logoutButton;

    let _currentUser;

    /* External functions */
    function initialize() {
        _loginContainer = $('#login-container');
        _loggedInContainer = $('#logged-in-container');
        _loggedInUser = $('#logged-in-user');
        _loginUsername = $('#login-username');
        _loginPassword = $('#login-password');
        _loginButton = $('#login-button');
        _logoutButton = $('#logout-button');
        _loginMessage = $('#login-message');
        _currentUser = $('#current-user');

        _updateLoginStates();
        _updateLoginEnabled();
    }

    function showError() {
        _loginMessage.removeClass('error-message-hidden');
    }

    function loginLogoutSucceeds(username) {
        _loggedInUser.text(username || 'Login');
        _currentUser.text(username || 'Login');
        _updateLoginStates();
        ContentHandler.setDefaultLocation();
        ContentHandler.closeUsermenu();
    }

    /* Internal functions */
    function _updateLoginStates() {
        const loggedIn = LoginHandler.isLoggedIn();

        _clearLogin();
        if (loggedIn) {
            _loggedInContainer.show();
            _loginContainer.hide();
        } else {
            _loggedInContainer.hide();
            _loginContainer.show();
        }

        _updateEvents(loggedIn);
    }

    function _updateEvents(loggedIn) {
        _loginButton.off('click');
        _logoutButton.off('click');
        _loginUsername.off('keyup');
        _loginPassword.off('keyup');

        if (loggedIn) {
            _logoutButton.click(_logoutButtonClicked);
        } else {
            _loginButton.click(_loginButtonClicked);
            _loginUsername.keyup(_updateLoginEnabled);
            _loginPassword.keyup(_updateLoginEnabled);
        }
    }

    function _clearLogin() {
        GenericUiHandler.resetMaterialInput(_loginUsername);
        GenericUiHandler.resetMaterialInput(_loginPassword);
        _removeErrorMessage();
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

    function _logoutButtonClicked() {
        LoginHandler.logout();
        _updateLoginStates();
    }

    function _updateLoginEnabled(event) {
        const loginEnabled = _loginEnabled()
        _loginButton.attr('disabled', !loginEnabled);

        if (loginEnabled) {
            if (event.keyCode === ModernSnakeKeyCodes.keyEnter) {
                _loginButtonClicked();
            }
        }
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
        showError: showError,
        loginLogoutSucceeds: loginLogoutSucceeds,
    };

})();

