let PageGame = (function () {
    function initialize() {
        console.log('init page game');
    }

    function destroy() {
        console.log('destroy page game');
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
