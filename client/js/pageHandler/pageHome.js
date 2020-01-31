let PageHome = (function () {
    let _ioCommunication;

    function construct(socket) {
        _ioCommunication = socket;
    }

    function initialize() {
    }

    function destroy() {
    }

    function isAllowed() {
        return true;
    }

    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
