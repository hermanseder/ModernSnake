let PageGame = (function () {
    let _ioCommunication;

    /* Interface */

    function construct(socket) {
        _ioCommunication = socket;
        GameUiHandler.construct(_directionUpdate);
    }

    function initialize() {
        console.log('init page game');
        console.log('send request');
        GameUiHandler.start();
        _ioCommunication.emit(socketCommands.getRooms2, LoginHandler.getAuth(), function (data) {
            console.log('callback called');
            console.log(data);
        });
        _ioCommunication.emit(socketCommands.joinRoom, LoginHandler.getAuth(), 'room 2', function (result) {
            console.log('joinRoom result: ' + result);
            if (result) {
                _addListener();
            }
        });

    }

    function destroy() {
        console.log('destroy page game');
        _removeListener();
        GameUiHandler.stop();
    }

    function isAllowed() {
        return LoginHandler.isLoggedIn();
    }

    /* External functions */

    /* Internal functions */

    function _addListener() {
        console.log('add game list');
        _ioCommunication.on(socketCommands.gameUpdate, _gameUpdate);
    }

    function _removeListener() {
        _ioCommunication.off(socketCommands.gameUpdate);
    }

    function _gameUpdate(data) {
        console.log(data);
        GameUiHandler.update(data);
    }

    function _directionUpdate(direction) {
        _ioCommunication.emit(socketCommands.gameMovement, LoginHandler.getAuth(), direction);
    }

    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
