const ErrorHandler = (function () {
    /* Declarations */

    function initialize() {
    }
    
    function showErrorMessage(errorMessage) {
        console.error(errorMessage);
    }

    /* Exports */
    return {
        initialize: initialize,
        showErrorMessage: showErrorMessage,
    };
})();
