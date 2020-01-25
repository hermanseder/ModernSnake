const ErrorHandler = (function () {
    /* Declarations */

    function initialize() {
    }
    
    function showErrorMessage(errorMessage) {
        if (!_checkSpecialMessages(errorMessage)) {
            _showMessage(errorMessage);
        }
    }

    function _checkSpecialMessages(errorMessage) {
        if (errorMessage === ModernSnakeMessages.tokenInvalid) {
            LoginHandler.autoLogout();
            return true;
        }
        return false;
    }

    function _showMessage(message) {
        console.error(message);
    }

    /* Exports */
    return {
        initialize: initialize,
        showErrorMessage: showErrorMessage,
    };
})();
