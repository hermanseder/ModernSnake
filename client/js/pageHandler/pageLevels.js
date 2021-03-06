let PageLevels = (function () {
    let _ioCommunication;
    let _levelBoxContainer;
    let _levelBoxItems;
    let _levelName;
    let _levelSave;

    let _levelNames;

    const gameState = [];

    function construct(socket) {
        _ioCommunication = socket;
    }

    function initialize() {
        _levelBoxContainer = $('#overlay');
        _levelBoxItems = _levelBoxContainer.find('.plot');

        _levelName = $('#level-name');
        _levelSave = $('#level-save');

        _levelNames = [];

        _ioCommunication.emit(socketCommands.getLevels, LoginHandler.getAuth(), _setLevelsCallback);
        _ioCommunication.on(socketCommands.updateLevels, _setLevels);
        _initializeListener();
        _checkSaveValid();
        _createLevelGrid();
    }

    function destroy() {
        _removeSocketListener();
        _removeListener();
    }

    function isAllowed() {
        return LoginHandler.isLoggedIn();
    }

    /* Internal functions */
    function _removeSocketListener() {
        _ioCommunication.removeAllListeners(socketCommands.updateLevels);
    }

    function _setLevelsCallback(result) {
        if (!result.success) {
            ErrorHandler.showErrorMessage(result.failure);
            return;
        }
        _setLevels(result.data);
    }

    function _setLevels(data) {
        _levelNames = [];
        for (let i = 0; i < data.length; i++) {
            const levelName = data[i].name;
            _levelNames.push(levelName);
        }
    }

    function _initializeListener() {
        _levelName.on('keyup', _createRoomKeyEvent);
        _levelSave.on('click', _saveLevel);
    }

    function _removeListener() {
        _levelName.off('keyup');
    }

    function _createRoomKeyEvent(event) {
        if (event.keyCode === ModernSnakeKeyCodes.keyEnter) {
            _saveLevel();
        } else {
            _checkSaveValid();
        }
    }

    function _checkSaveValid() {
        _levelSave.attr('disabled', !_isInputValid());
    }

    function _isInputValid() {
        let valid = true;

        const levelName = _getLevelName();
        valid = valid && levelName !== undefined;
        valid = valid && levelName.length >= ModernSnakeConfig.minimumLevelLength;
        valid = valid && _levelNames.indexOf(levelName) < 0;
        
        return valid;
    }

    function _saveLevel() {
        if (!_isInputValid()) return;

        const levelName = _getLevelName();

        const levelData = [];
        for (let i = 0; i < gameState.length; i++) {
            for (let j = 0; j < gameState[i].length; j++) {
                if (gameState[i][j]) {
                    levelData.push({x: i, y: j});
                }
            }
        }

        _ioCommunication.emit(socketCommands.createLevel, LoginHandler.getAuth(), levelName, levelData, _saveLevelDone);
    }

    function _saveLevelDone(result) {
        if (result.success) {
            document.getElementById('overlay').remove();
            const overlay = document.createElement('div');
            overlay.id = 'overlay';
            document.getElementById('board').appendChild(overlay);
            _createLevelGrid();
            GenericUiHandler.resetMaterialInput(_levelName);
        } else {
            ErrorHandler.showErrorMessage(result.failure);
        }
    }

    function _getLevelName() {
        if (!_levelName) return undefined;
        if (!_levelName.val()) return undefined;
        if (_levelName.val().length <= 0) return undefined;
        return _levelName.val();
    }

    function _createLevelGrid() {
        let wallCount = 0;
        //create boxes
        for (let i = 0; i < ModernSnakeConfig.gameDimensions; i++) {
            if (!gameState[i]) {
                gameState[i] = [];
            }
            for (let j = 0; j < ModernSnakeConfig.gameDimensions; j++) {
                gameState[i][j] = false;
                const span = document.createElement('span');
                const isDisabled = _isDisabledCell(i) || _isDisabledCell(j);
                span.classList = isDisabled ? 'plot plot-disabled' : 'plot';
                span.addEventListener('click', function() {
                    if (!isDisabled) {
                        // NOTE: [...span.classList] simmilar to Array.from(span.classList)
                        if (Array.from(span.classList).indexOf('plot-active') === -1) {
                            if (wallCount < ModernSnakeConfig.maxWalls) {
                                span.classList = 'plot plot-active';
                                gameState[i][j] = true;
                                wallCount++;
                            } else {
                                window.alert("to many walls set, deselect some");
                            }
                        } else {
                            span.classList = 'plot';
                            gameState[i][j] = false;
                            wallCount--;
                        }
                    }
                }, false);
                document.getElementById('overlay').appendChild(span);
            }
        }
    }

    function _getGameState() {
        return gameState;
    }

    function _isDisabledCell(cell) {
        return cell === Math.floor(ModernSnakeConfig.gameDimensions / 2);
    }


    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed,
        getGameState: _getGameState
    };
})();
