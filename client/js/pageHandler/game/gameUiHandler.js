/*
_directionUpdateCallback: function(direction): void;
 */

let GameUiHandler = (function () {
    /* Constants */
    const _backgroundColor = '#c5c1bb';
    const _snakeColor1 = '#ee6e73';
    const _snakeColor2 = '#eacb48';
    const _snakeColor3 = '#26a69a';
    const _snakeColor4 = '#4caf50';
    const _appleColor = '#f44336';
    const _wallColor = '#5e4c46';

    /* Variables */
    let _drawContext;
    let _gameFieldCanvas;
    let _gameFieldId;
    let _directionUpdateCallback;

    /* External functions */

    function construct(directionUpdateCallback) {
        _gameFieldId = 'game-field';
        _directionUpdateCallback = directionUpdateCallback;
    }

    function start() {
        _gameFieldCanvas = document.getElementById(_gameFieldId);
        _drawContext = _gameFieldCanvas.getContext("2d");
        _addListener();
        _resizeCanvas();
    }

    function _addListener() {
        $(window).on('resize', _resizeCanvas);
        $(window).on('keyup', _keyboardEvent);
    }

    function stop() {
        $(window).off('resize');
        $(window).off('keyup');
    }

    function update(gameData) {
        console.log(gameData);
        _drawGame(gameData);
    }

    /* Internal functions */

    function _resizeCanvas() {
        const size = $('#' + _gameFieldId).outerWidth(true);
        $('#' + _gameFieldId).outerHeight(size);
        _gameFieldCanvas.height = size;
        _gameFieldCanvas.width = size;
    }

    function _keyboardEvent(event) {
        console.log(event.keyCode);
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
            _directionUpdateCallback(direction);
        }
    }

    function _drawGame(gameData) {
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

    function _drawGameBorder(fieldSize, dimension, segmentSize) {
        _drawContext.fillStyle = _backgroundColor;
        _drawContext.fillRect(0, 0, fieldSize, fieldSize);
    }

    function _drawGameWalls(segmentSize, wallData) {
        _drawContext.fillStyle = _wallColor;
        for (const wall of wallData) {
            _drawContext.fillRect(wall.x * segmentSize, wall.y * segmentSize, segmentSize, segmentSize);
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
        for (const segment of snakeData.snake) {
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
        start: start,
        stop: stop,
        update: update,
    };
})();
