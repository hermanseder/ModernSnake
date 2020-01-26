/* Declarations */
const socket = io();

$(document).on('ready', function () {
    StorageHandler.initialize();
    LoginHandler.initialize(socket);

    MessageUiHandler.initialize();
    LoginUiHandler.initialize();
    ContentHandler.initialize(socket);

    LoginHandler.checkAutoLogin();
});
