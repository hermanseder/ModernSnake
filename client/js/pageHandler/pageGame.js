let PageGame = (function () {
    let _ioCommunication;

    /* Interface */

    function construct(socket) {
        _ioCommunication = socket;
        GamePlaygroundHandler.construct(socket);
        GameModeSelectorHandler.construct(socket);
    }

    function initialize() {
        TabHandler.initialize('game-mode-tabs', 'pages/game/gameModeSelector.html',
            _modeChangeCallback);
    }

    function destroy() {
        GamePlaygroundHandler.stopGame();
        GameModeSelectorHandler.destroy();
    }

    function isAllowed() {
        return LoginHandler.isLoggedIn();
    }

    /* Internal functions */

    function _modeChangeCallback(data) {
        GameModeSelectorHandler.initialize(data);
    }


    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
