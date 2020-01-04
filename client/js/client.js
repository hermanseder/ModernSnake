/* Declarations */
// let loginUiHandler;

const socket = io();

$(document).ready(function () {
    SocketHandler.initialize(socket);
    LoginHandler.initialize(socket);

    LoginUiHandler.initialize();
    ContentHandler.initialize(socket);

    // TODO REMOVE
    LoginHandler.login('rudi', 'pw');

    socket.emit('test', 'client');
});


socket.on('authenticated', function() {
    document.getElementById("loginState").innerHTML = true;
});
socket.on('unauthorized', function(err){
    console.log("There was an error with the authentication:", err.message);
});

function login() {
    console.log('login');
    socket.emit('authentication', {username: "Rudi", password: "test123"});
}

socket.on('update', function(data) {
    console.log(data);
    document.getElementById("result").innerHTML = data;
});

var movement = {
    up: false,
    down: false,
    left: false,
    right: false
}
document.addEventListener('keyup', function(event) {
    let mov;
    switch (event.keyCode) {
        case 65: // A
            mov = 'A';
            break;
        case 87: // W
            mov = 'W';
            break;
        case 68: // D
            mov = 'D';
            break;
        case 83: // S
            mov = 'S';
            break;
        case 37:  //ARROW LEFT
            mov = 'LEFT';
            break; 
        case 38: //ARROW UP
            mov = 'UP';
            break; 
        case 39: //ARROW RIGHT
            mov = 'RIGHT'; 
            break; 
        case 40: //ARROW DOWN
            mov = 'DOWN'; 
            break; 
    }
    socket.emit('movement', mov);
});
