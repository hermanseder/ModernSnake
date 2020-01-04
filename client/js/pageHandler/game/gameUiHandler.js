/*
_directionUpdateCallback: function(direction): void;
 */

let GameUiHandler = (function () {
    /* Constants */
    const _backgroundColor = '#4d4d4d';
    const _snakeColor = '#6c8e9d';

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
        _drawGameWalls();
        for (const entry of gameData.game.snakes) {
            _drawGameSnake(gameData.dimension, segmentSize, entry);
        }
        _drawGameApple();

        if (!gameData.running) {

        }
    }

    function _drawGameBorder(fieldSize, dimension, segmentSize) {
        _drawContext.fillStyle = _backgroundColor;
        _drawContext.fillRect(0, 0, fieldSize, fieldSize);
    }

    function _drawGameWalls(wallData) {

    }

    function _drawGameSnake(dimension, segmentSize, snakeData) {
        const offset = segmentSize / 2;
        for (const segment of snakeData.snake) {
            const positionX = offset + (segmentSize * (segment.x));
            const positionY = offset + (segmentSize * (segment.y));
            _drawContext.fillStyle = _snakeColor;
            _drawContext.beginPath();
            _drawContext.arc(positionX, positionY, (segmentSize / 2), 0, 2 * Math.PI);
            _drawContext.fill();
        }
    }

    function _drawGameApple(appleData) {

    }

    return {
        construct: construct,
        start: start,
        stop: stop,
        update: update,
    };
})();
