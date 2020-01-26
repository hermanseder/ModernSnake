let MessageUiHandler = (function () {
    /* Variables */
    let _messageContainer;
    let _hideTimer;

    /* External functions */
    function initialize() {
        _messageContainer = $('#global-message');
        _hideMessage();
    }

    function showError(errorMessage) {
        clearTimeout(_hideTimer);
        _messageContainer.text(errorMessage);
        _showMessage();
        _hideTimer = setTimeout(_hideMessage, ModernSnakeConfig.errorMessageDuration);
    }

    function _hideMessage() {
        _messageContainer.empty();
        _messageContainer.css('bottom', '-50px');
    }

    function _showMessage() {
        _messageContainer.css('bottom', '0');
    }

    /* Exports */
    return {
        initialize: initialize,
        showError: showError
    };

})();

