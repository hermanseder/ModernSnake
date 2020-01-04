/* Declarations */
const socket = io();

$(document).on('ready', function () {
    SocketHandler.initialize(socket);
    LoginHandler.initialize(socket);

    LoginUiHandler.initialize();
    ContentHandler.initialize(socket);

    // TODO REMOVE
    LoginHandler.login('rudi', 'pw');

    socket.emit('test', 'client');
});
