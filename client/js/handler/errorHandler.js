const ErrorHandler = (function () {
    /* Declarations */

    function initialize() {
    }

    function showErrorMessage(errorMessage) {
        _checkSpecialMessages(errorMessage);
        _showMessage(errorMessage);
    }

    function _checkSpecialMessages(errorMessage) {
        if (errorMessage === ModernSnakeMessages.tokenInvalid) {
            LoginHandler.autoLogout();
        }
    }

    function _showMessage(message) {
        switch (message) {
            case ModernSnakeMessages.tokenInvalid:
                MessageUiHandler.showError('Login expired! Please login once again.');
                break;
            default:
                MessageUiHandler.showError(message);
        }
    }

    /* Exports */
    return {
        initialize: initialize,
        showErrorMessage: showErrorMessage,
    };
})();
