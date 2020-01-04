let PageScore = (function () {
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
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
