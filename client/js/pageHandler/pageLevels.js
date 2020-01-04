let PageLevels = (function () {
    let _ioCommunication;

    function construct(socket) {
        _ioCommunication = socket;
    }

    function initialize() {
        console.log('init page levels');
    }

    function destroy() {
        console.log('destroy page levels');
    }

    function isAllowed() {
        return LoginHandler.isLoggedIn();
    }

    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
