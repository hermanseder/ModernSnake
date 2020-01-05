/*
_directionUpdateCallback: function(direction): void;
 */

let GamePlaygroundHandler = (function () {
    /* Constants */
    const _backgroundColor = '#c5c1bb';
    const _snakeColor1 = '#ee6e73';
    const _snakeColor2 = '#eacb48';
    const _snakeColor3 = '#26a69a';
    const _snakeColor4 = '#4caf50';
    const _appleColor = '#f44336';
    const _wallColor = '#5e4c46';

    /* Variables */
    let _ioCommunication;
    let _drawContext;
    let _gameFieldCanvas;
    let _gameFieldId;
    let _gameRunning;
    let _currentMode;
    let _currentEndCallback;

    /* External functions */

    function construct(socket) {
        _gameFieldId = 'game-field';
        _ioCommunication = socket;
        _gameRunning = false;
    }

    function startGame(modeId, endCallback) {
        console.log('start with mode: ' + modeId);
        _currentMode = modeId;
        _currentEndCallback = endCallback;
        _gameFieldCanvas = document.getElementById(_gameFieldId);
        _drawContext = _gameFieldCanvas.getContext("2d");
        _addListener();
        _resizeCanvas();
    }

    function stopGame() {
        _ioCommunication.emit(socketCommands.leaveRoom, LoginHandler.getAuth());
        _removeListener();
        _drawGame(undefined);
    }

    /* Internal functions */

    function _addListener() {
        $(window).on('resize', _resizeCanvas);
        $(window).on('keyup', _keyboardEvent);
        // $(window).on('swipeleft', _swipeLeft);

        $('body').bind('touchmove', function(e){e.preventDefault()})
        $(_gameFieldCanvas).swipe({
            swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
                _swipeEvent(direction);
            }
        });

        _ioCommunication.on(socketCommands.gameUpdate, _gameUpdate);
    }

    function _removeListener() {
        $(window).off('resize', _resizeCanvas);
        $(window).off('keyup', _keyboardEvent);
        _ioCommunication.removeAllListeners(socketCommands.gameUpdate);
    }

    function _gameUpdate(gameData) {
        if (gameData === undefined) return;

        _checkAfter(gameData.after);
        // console.log(gameData);
        _drawGame(gameData);
    }

    function _checkAfter(afterData) {
        if (afterData === undefined) return;

        const remainingTime = afterData.countdown;
        if (remainingTime === undefined || remainingTime <= 0) {
            stopGame();
            _currentEndCallback();
        }
    }

    function _directionUpdate(direction) {
        _ioCommunication.emit(socketCommands.gameMovement, LoginHandler.getAuth(), direction);
    }

    function _resizeCanvas() {
        const size = $('#' + _gameFieldId).width();
        $('#' + _gameFieldId).height(size);
        _gameFieldCanvas.height = size;
        _gameFieldCanvas.width = size;
    }

    function _keyboardEvent(event) {
        let direction = undefined;
        switch (event.keyCode) {
            case ModernSnakeKeyCodes.arrowUp:
            case ModernSnakeKeyCodes.keyUp1:
                direction = ModernSnakeGameDirections.directionUp;
                break;
            case ModernSnakeKeyCodes.arrowRight:
            case ModernSnakeKeyCodes.keyRight1:
                direction = ModernSnakeGameDirections.directionRight;
                break;
            case ModernSnakeKeyCodes.arrowDown:
            case ModernSnakeKeyCodes.keyDown1:
                direction = ModernSnakeGameDirections.directionDown;
                break;
            case ModernSnakeKeyCodes.arrowLeft:
            case ModernSnakeKeyCodes.keyLeft1:
                direction = ModernSnakeGameDirections.directionLeft;
                break;
        }
        if (direction !== undefined) {
            _directionUpdate(direction);
        }
    }

    function _swipeEvent(event) {
        let direction = undefined;
        switch (event) {
            case ModernSnakeKeyCodes.swipeUp:
                direction = ModernSnakeGameDirections.directionUp;
                break;
            case ModernSnakeKeyCodes.swipeRight:
                direction = ModernSnakeGameDirections.directionRight;
                break;
            case ModernSnakeKeyCodes.swipeDown:
                direction = ModernSnakeGameDirections.directionDown;
                break;
            case ModernSnakeKeyCodes.swipeLeft:
                direction = ModernSnakeGameDirections.directionLeft;
                break;
        }
        if (direction !== undefined) {
            _directionUpdate(direction);
        }
    }

    function _drawGame(gameData) {
        console.log('draw');
        if (!_drawContext) return;

        _drawBackground();
        if (gameData === undefined) return;

        const currentSize = _gameFieldCanvas.width;
        const segmentSize = currentSize / gameData.dimension;

        _drawGameBorder(currentSize, gameData.dimension, segmentSize);
        _drawGameWalls(segmentSize, gameData.game.walls);
        for (let i = 0; i < gameData.game.snakes.length; i++) {
            _drawGameSnake(segmentSize, gameData.game.snakes[i], _getSnakeColor(i));
        }
        _drawGameApple(segmentSize, gameData.game.apple);

        if (!gameData.running) {

        }
    }

    function _drawBackground() {
        _drawContext.fillStyle = _backgroundColor;
        _drawContext.fillRect(0, 0, _gameFieldCanvas.width, _gameFieldCanvas.height);
    }

    function _drawGameBorder(fieldSize, dimension, segmentSize) {
    }

    function _drawGameWalls(segmentSize, wallData) {
        _drawContext.fillStyle = _wallColor;
        for (let i = 0; i < wallData.length; i++) {
            _drawContext.fillRect(wallData[i].x * segmentSize, wallData[i].y * segmentSize, segmentSize, segmentSize);
        }
    }

    function _drawGameApple(segmentSize, appleData) {
        if (appleData === undefined) return;

        const offset = segmentSize / 2;
        const positionX = offset + (segmentSize * (appleData.x));
        const positionY = offset + (segmentSize * (appleData.y));

        _drawContext.fillStyle = _appleColor;
        _drawContext.beginPath();
        _drawContext.arc(positionX, positionY, (segmentSize / 2), 0, 2 * Math.PI);
        _drawContext.fill();
    }

    function _drawGameSnake(segmentSize, snakeData, color) {
        _drawContext.fillStyle = color;
        const offset = segmentSize / 2;
        for (let i = 0; i < snakeData.snake.length; i++) {
            const segment = snakeData.snake[i];
            const positionX = offset + (segmentSize * (segment.x));
            const positionY = offset + (segmentSize * (segment.y));
            _drawContext.beginPath();
            _drawContext.arc(positionX, positionY, (segmentSize / 2), 0, 2 * Math.PI);
            _drawContext.fill();
        }
    }

    function _getSnakeColor(index) {
        switch (index) {
            case 0:
                return _snakeColor1;
            case 1:
                return _snakeColor2;
            case 2:
                return _snakeColor3;
            case 3:
                return _snakeColor4;
            default:
                return '#ffffff';
        }
    }

    return {
        construct: construct,
        startGame: startGame,
        stopGame: stopGame
    };
})();
