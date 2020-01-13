/*
_directionUpdateCallback: function(direction): void;

_spriteMap:[Image];
 */

let GamePlaygroundHandler = (function () {
    /* Constants */
    const _backgroundColor = '#c5c1bb';
    const _textColor = '#eff0eb';
    const _textBackgroundColor = '#9C9892';
    const _snakeColor1 = '#ee6e73';
    const _snakeColor2 = '#eacb48';
    const _snakeColor3 = '#2490a8';
    const _snakeColor4 = '#4caf50';
    const _appleColor = '#f44336';
    const _wallColor = '#5e4c46';

    const _classScoreItem = '.game-score-item';
    const _classScoreUser = '.game-score-user';
    const _classScoreValue = '.game-score-value';
    const _spriteMapSnakeUrl = '../../img/game/game_snake_graphics_';
    const _spriteMapGameUrl = '../../img/game/game_graphics';
    const _spriteMapFileType = 'png';

    /* Variables */
    let _ioCommunication;
    let _drawContext;
    let _spriteMapsSnake;
    let _spriteMapGame;
    let _gameFieldCanvas;
    let _gameFieldId;
    let _gameRunning;
    let _currentMode;
    let _currentEndCallback;
    let _gameScoreContainer;
    let _currentGameData;

    /* External functions */

    function construct(socket) {
        _gameFieldId = 'game-field';
        _ioCommunication = socket;
        _gameRunning = false;

        _spriteMapsSnake = _loadSpriteMapsSnake();
        _spriteMapGame = _loadSpriteMapGame();
    }

    function startGame(modeId, endCallback) {
        _currentMode = modeId;
        _currentEndCallback = endCallback;

        _gameFieldCanvas = document.getElementById(_gameFieldId);
        _gameScoreContainer = $('#game-score-container');


        _drawContext = _gameFieldCanvas.getContext("2d");

        _initializeScoreItems();
        _addListener();
        _resizeCanvas();
    }

    function stopGame() {
        _ioCommunication.emit(socketCommands.leaveRoom, LoginHandler.getAuth());
        _removeListener();
        _currentGameData = undefined;
        _drawGame(_currentGameData);
        if (_gameScoreContainer) _gameScoreContainer.empty();
    }

    /* Internal functions */

    function _loadSpriteMapsSnake() {
        const spriteMaps = [];
        for (let i = 0; i < ModernSnakeConfig.maxPlayerCount; i++) {
            const spriteMap = new Image();
            spriteMap.src = (_spriteMapSnakeUrl + (i + 1) + '.' + _spriteMapFileType);
            spriteMap.onload = function () {
                // TODO define some logic
            };
            spriteMaps.push(spriteMap);
        }
        return spriteMaps;
    }

    function _loadSpriteMapGame() {
        const spriteMap = new Image();
        spriteMap.src = (_spriteMapGameUrl + '.' + _spriteMapFileType);
        spriteMap.onload = function () {
            // TODO define some logic
        };
        return spriteMap;
    }

    function _initializeScoreItems() {
        _gameScoreContainer.empty();
        if (_currentMode === ModernSnakeGameModes.onePlayer) {
            _gameScoreContainer.append(' <div class="game-score-item"><div class="game-score-value">0</div></div>');
        } else {
            let count = 0;
            switch (_currentMode) {
                case ModernSnakeGameModes.twoPlayer:
                    count = 2;
                    break;
                case ModernSnakeGameModes.threePlayer:
                    count = 3;
                    break;
                case ModernSnakeGameModes.fourPlayer:
                    count = 4;
                    break;
            }
            for (let i = 0; i < count; i++) {
                _gameScoreContainer.append(' <div class="game-score-item"><div class="game-score-user"></div> <div class="game-score-value">0</div></div>');
            }
        }
    }

    function _addListener() {
        $(window).on('resize', _resizeCanvas);
        $(window).on('keyup', _keyboardEvent);
        // $(window).on('swipeleft', _swipeLeft);

        $('body').bind('touchmove', function (e) {
            e.preventDefault()
        })
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
        _currentGameData = gameData;
        if (gameData === undefined) return;

        _drawGame(gameData);
        _checkAfter(gameData.after);
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
        _drawGame(_currentGameData);
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
        if (!_drawContext) return;

        _drawBackground();
        if (gameData === undefined) return;

        const currentSize = _gameFieldCanvas.width;
        const segmentSize = currentSize / gameData.dimension;

        _drawGameWalls(segmentSize, gameData.game.walls);
        for (let i = 0; i < gameData.game.snakes.length; i++) {
            _drawGameSnake(i, segmentSize, gameData.game.snakes[i]);
        }
        _drawGameApple(segmentSize, gameData.game.apple);
        _drawGameTextOverlay(gameData, currentSize);
        _drawScore(gameData.game.snakes);
    }

    function _drawGameTextOverlay(gameData, width) {
        if (gameData.running) return;

        let text = '';
        let time = '';
        if (gameData.before.countdown > 0) {
            text = 'Game starts in';
            time = Math.round(gameData.before.countdown / 1000);
        } else {
            text = 'Leave game in';
            time = Math.round(gameData.after.countdown / 1000);
        }

        _drawContext.textBaseline = 'middle';
        const halfWidth = Math.round((width / 2));
        const textWith = _drawContext.measureText(text).width;
        const timeWidth = _drawContext.measureText(time).width;

        _drawContext.fillStyle = _textBackgroundColor;
        _drawContext.fillRect(halfWidth - (textWith * 1.75 / 2), halfWidth - 40, textWith * 1.75, 80);

        _drawContext.font = ModernSnakeConfig.gameTextStyle;
        _drawContext.fillStyle = _textColor;

        _drawContext.fillText(text, halfWidth - (textWith / 2), halfWidth - 15);
        _drawContext.fillText(time, halfWidth - (timeWidth / 2), halfWidth + 20);
    }

    function _drawBackground() {
        _drawContext.fillStyle = _backgroundColor;
        _drawContext.fillRect(0, 0, _gameFieldCanvas.width, _gameFieldCanvas.height);
    }

    function _drawGameWalls(segmentSize, wallData) {
        _drawContext.fillStyle = _wallColor;
        for (let i = 0; i < wallData.length; i++) {
            const positionX = wallData[i].x * segmentSize;
            const positionY = wallData[i].y * segmentSize;

            _drawSpriteMap(_spriteMapGame, 1, 0, positionX, positionY, segmentSize);
        }
    }

    function _drawGameApple(segmentSize, appleData) {
        if (appleData === undefined) return;

        const positionX = segmentSize * appleData.x;
        const positionY = segmentSize * appleData.y;

        _drawSpriteMap(_spriteMapGame, 0, 0, positionX, positionY, segmentSize);
    }

    function _drawGameSnake(playerId, segmentSize, snakeData) {
        const spriteMap = _spriteMapsSnake[playerId];
        const snakeLength = snakeData.snake.length;

        for (let i = 0; i < snakeLength; i++) {
            const segment = snakeData.snake[i];
            const positionX = segmentSize * (segment.x);
            const positionY = segmentSize * (segment.y);

            if (i === 0) {
                _drawSnakeHead(spriteMap, snakeData, positionX, positionY, segmentSize, i);
            } else if (i === snakeLength - 1) {
                _drawSnakeTail(spriteMap, snakeData, positionX, positionY, segmentSize, i);
            } else {
                _drawSnakeBody(spriteMap, snakeData, positionX, positionY, segmentSize, i);
            }
        }
    }

    function _drawSnakeHead(spriteMap, snakeData, positionX, positionY, segmentSize, snakePosition) {
        const previousSegment = snakeData.snake[snakePosition + 1];
        const currentSegment = snakeData.snake[snakePosition];
        let tileX = 0;
        let tileY = 0;

        if (currentSegment.y === (previousSegment.y - 1) || previousSegment.y < (currentSegment.y - 1)) {
            // Up
            tileX = 3;
            tileY = 0;
        } else if (previousSegment.x === (currentSegment.x - 1) || currentSegment.x < (previousSegment.x - 1)) {
            // Right
            tileX = 4;
            tileY = 0;
        } else if (previousSegment.y === (currentSegment.y - 1) || currentSegment.y < (previousSegment.y - 1)) {
            // Down
            tileX = 4;
            tileY = 1;
        } else if (currentSegment.x === (previousSegment.x - 1) || (previousSegment.x < (currentSegment.x - 1))) {
            // Left
            tileX = 3;
            tileY = 1;
        }
        _drawSpriteMap(spriteMap, tileX, tileY, positionX, positionY, segmentSize);
    }

    function _drawSnakeBody(spriteMap, snakeData, positionX, positionY, segmentSize, snakePosition) {
        const previousSegment = snakeData.snake[snakePosition + 1];
        const currentSegment = snakeData.snake[snakePosition];
        const nextSegment = snakeData.snake[snakePosition - 1];
        let tileX = 0;
        let tileY = 0;

        if ((previousSegment.x < currentSegment.x && nextSegment.x > currentSegment.x) ||
            (previousSegment.x > currentSegment.x && nextSegment.x < currentSegment.x) ||
            (previousSegment.x < currentSegment.x && nextSegment.x < currentSegment.x) ||
            (previousSegment.x > currentSegment.x && nextSegment.x > currentSegment.x)) {
            // o
            // o
            tileX = 1;
            tileY = 0;
        } else if (((previousSegment.x - 1) === currentSegment.x && (nextSegment.y - 1) === currentSegment.y) || // Left/Down
            ((nextSegment.x - 1) === currentSegment.x && (previousSegment.y - 1 === currentSegment.y)) || // Up/Right
            (nextSegment.x < (currentSegment.x - 1) && currentSegment.y === (previousSegment.y - 1)) || // HBorder/Up/Right
            (previousSegment.x < (currentSegment.x - 1) && currentSegment.y === (nextSegment.y - 1)) || // HBorder/Left/Down
            (currentSegment.x === (nextSegment.x - 1) && previousSegment.y < (currentSegment.y - 1)) || // VBorder/Up/Right
            (currentSegment.x === (previousSegment.x - 1) && nextSegment.y < (currentSegment.y - 1)) // VBorder/Left/Down
        ) {
            // o o
            // o
            tileX = 0;
            tileY = 0;
        } else if ((previousSegment.y < currentSegment.y && nextSegment.y > currentSegment.y) ||
            (previousSegment.y > currentSegment.y && nextSegment.y < currentSegment.y) ||
            (previousSegment.y < currentSegment.y && nextSegment.y < currentSegment.y) ||
            (previousSegment.y > currentSegment.y && nextSegment.y > currentSegment.y)) {
            // o o
            tileX = 2;
            tileY = 1;
        } else if ((nextSegment.x === (currentSegment.x - 1) && previousSegment.y === (currentSegment.y - 1)) || // Down/Left
            (previousSegment.x === (currentSegment.x - 1) && nextSegment.y === (currentSegment.y - 1)) || // Up/Right
            (currentSegment.x < (previousSegment.x - 1) && (nextSegment.y === (currentSegment.y - 1))) || // HBorder/Right/Up
            (currentSegment.x < (nextSegment.x - 1) && previousSegment.y === (currentSegment.y - 1)) || // HBorder/Down/Left
            (nextSegment.x === (currentSegment.x - 1) && currentSegment.y < (previousSegment.y - 1)) || // VBorder/Down/Left
            (previousSegment.x === (currentSegment.x - 1) && currentSegment.y < (nextSegment.y - 1)) // VBorder/Right/Up
        ) {
            //   o
            // o o
            tileX = 2;
            tileY = 2;
        } else if ((previousSegment.x === (currentSegment.x - 1) && currentSegment.y === (nextSegment.y - 1)) || // Right/Down
            (nextSegment.x === (currentSegment.x - 1) && currentSegment.y === (previousSegment.y - 1)) || // Up/Left
            (currentSegment.x < (nextSegment.x - 1) && currentSegment.y === (previousSegment.y - 1)) || // HBorder/Up/Left
            (currentSegment.x < (previousSegment.x - 1) && currentSegment.y === (nextSegment.y - 1)) || // HBorder/Right/Down
            (nextSegment.x === (currentSegment.x - 1) && previousSegment.y < (currentSegment.y - 1)) || // VBorder/Up/Left
            (previousSegment.x === (currentSegment.x - 1) && nextSegment.y < (currentSegment.y - 1)) // VBorder/Right/Down
        ) {
            // o o
            //   o
            tileX = 2;
            tileY = 0;
        } else if ((currentSegment.x === (nextSegment.x - 1) && previousSegment.y === (currentSegment.y - 1)) || // Down/Right
            (currentSegment.x === (previousSegment.x - 1) && nextSegment.y === (currentSegment.y - 1)) || // Left/Up
            (nextSegment.x < (currentSegment.x - 1) && previousSegment.y === (currentSegment.y - 1)) || // HBorder/Down/Right
            (previousSegment.x < (currentSegment.x - 1) && nextSegment.y === (currentSegment.y - 1)) || // HBorder/Left/Up
            (currentSegment.x === (previousSegment.x - 1) && currentSegment.y < (nextSegment.y - 1)) || // VBorder/Left/Up
            (currentSegment.x === (nextSegment.x - 1) && currentSegment.y < (previousSegment.y - 1)) // VBorder/Down/Right
        ) {
            // o
            // o o
            tileX = 0;
            tileY = 1;
        } else {
            console.error('invalid');
            return;
        }
        _drawSpriteMap(spriteMap, tileX, tileY, positionX, positionY, segmentSize);
    }

    function _drawSnakeTail(spriteMap, snakeData, positionX, positionY, segmentSize, snakePosition) {
        const nextSegment = snakeData.snake[snakePosition - 1];
        const currentSegment = snakeData.snake[snakePosition];
        let tileX = 0;
        let tileY = 0;

        if (nextSegment.y === (currentSegment.y - 1) || currentSegment.y < (nextSegment.y - 1)) {
            // Up
            tileX = 3;
            tileY = 2;
        } else if (currentSegment.x === (nextSegment.x - 1) || nextSegment.x < (currentSegment.x - 1)) {
            // Right
            tileX = 4;
            tileY = 2;
        } else if (currentSegment.y === (nextSegment.y - 1) || nextSegment.y < (currentSegment.y - 1)) {
            // Down
            tileX = 1;
            tileY = 2;
        } else if (nextSegment.x === (currentSegment.x - 1) || (currentSegment.x < (nextSegment.x - 1))) {
            // Left
            tileX = 0;
            tileY = 2;
        }
        _drawSpriteMap(spriteMap, tileX, tileY, positionX, positionY, segmentSize);
    }

    function _drawSpriteMap(spriteMap, tileX, tileY, positionX, positionY, segmentSize) {
        _drawContext.drawImage(spriteMap,
            tileX * ModernSnakeConfig.spriteMapSize, tileY * ModernSnakeConfig.spriteMapSize,
            ModernSnakeConfig.spriteMapSize, ModernSnakeConfig.spriteMapSize,
            positionX, positionY,
            segmentSize, segmentSize);
    }

    function _drawScore(userData) {
        const controls = _gameScoreContainer.find(_classScoreItem);
        if (controls.length != userData.length) {
            console.error('INVALID_DATA_LENGTH');
            return;
        }

        for (let i = 0; i < userData.length; i++) {
            const item = userData[i];
            const control = $(controls.get(i));

            const valueControl = control.find(_classScoreValue);
            valueControl.text(item.score);

            const user = control.find(_classScoreUser);
            if (user) user.text(item.username);
        }
    }

    return {
        construct: construct,
        startGame: startGame,
        stopGame: stopGame
    };
})();
