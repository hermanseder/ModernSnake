let PageGame = (function () {
    let _ioCommunication;

    /* Interface */

    function construct(socket) {
        _ioCommunication = socket;
        GamePlaygroundHandler.construct(socket);
        GameModeSelectorHandler.construct(socket);
    }

    function initialize() {
        console.log('init page game');
        console.log('send request');

        TabHandler.initialize('game-mode-tabs', 'pages/game/gameModeSelector.html',
            _modeChangeCallback);

        // GamePlaygroundHandler.start();
        // _ioCommunication.emit(socketCommands.getRooms2, LoginHandler.getAuth(), function (data) {
        //     console.log('callback called');
        //     console.log(data);
        // });
        // _ioCommunication.emit(socketCommands.joinRoom, LoginHandler.getAuth(), 'room 2', function (result) {
        //     console.log('joinRoom result: ' + result);
        //     if (result) {
        //         _addListener();
        //     }
        // });

    }

    function destroy() {
        console.log('destroy page game');
        GamePlaygroundHandler.stop();
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
