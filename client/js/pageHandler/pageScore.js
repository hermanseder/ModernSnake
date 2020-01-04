let PageScore = (function () {
    let _ioCommunication;

    function construct(socket) {
        _ioCommunication = socket;
    }

    function initialize() {
        console.log('init page score');
    }

    function destroy() {
        console.log('destroy page score');
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
