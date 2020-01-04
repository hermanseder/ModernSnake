let PageLevels = (function () {
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
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
