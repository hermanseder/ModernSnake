/*
_currentMode: integer;

_ioCommunication: socketio;
 */

let GameModeSelectorHandler = (function () {
    /* Constants */
    const _classContainerHidden = 'container-hidden';
    const _playgroundPath = 'pages/game/gamePlayground.html';
    const _selectedOption = 'option:selected';

    /* Variables */
    let _ioCommunication;
    let _currentMode;
    let _currentModeMultiPlayer;
    let _roomSelectionContainer;
    let _playgroundContainer;
    let _levelSelectionContainer;

    let _selectGameLevel;
    let _selectGameDifficulty;
    let _gameStartContainer;
    let _gameStartButton;
    let _roomNameContainer;
    let _roomNameInput;
    let _roomCreateContainer;
    let _roomCreateButton;

    /* External functions */
    function construct(socket) {
        _ioCommunication = socket;
        _currentModeMultiPlayer = false;
    }

    function initialize(modeId) {
        _initializeDomElements();
        _fillOptions();
        _initializeSocketListener();

        _roomSelectionContainer.hide();
        _levelSelectionContainer.hide();
        _playgroundContainer.hide();
        _initializeSinglePlayer();

        _updateMode(modeId);
    }

    function destroy() {
        _currentMode = -1;
        _removeModeListener();
        _removeSocketListener();
        GamePlaygroundHandler.stopGame();
    }

    /* Internal functions */
    function _initializeSocketListener() {
        _ioCommunication.on(socketCommands.updateLevels, _fillLevels);
    }

    function _removeSocketListener() {
        _ioCommunication.removeAllListeners(socketCommands.updateLevels);
    }

    function _initializeDomElements() {
        _roomSelectionContainer = $('#room-selection-container');
        _levelSelectionContainer = $('#level-selection-handler');
        _playgroundContainer = $('#playground-container');

        _selectGameLevel = $('#select-game-level');
        _selectGameDifficulty = $('#select-game-difficulty');
        _gameStartContainer = $('#game-start-container');
        _gameStartButton = $('#game-start');
        _roomNameContainer = $('#room-name-container');
        _roomNameInput = $('#room-name');
        _roomCreateContainer = $('#room-create-container');
        _roomCreateButton = $('#room-create');
    }

    function _fillOptions() {
        _ioCommunication.emit(socketCommands.getLevels, LoginHandler.getAuth(), _fillLevels);
        _ioCommunication.emit(socketCommands.getDifficulty, LoginHandler.getAuth(), _fillDifficulty);
    }

    function _fillLevels(levels) {
        _selectGameLevel.empty();
        _selectGameLevel.append('<option value="" disabled selected>Choose level</option>');

        for (let i = 0; i < levels.length; i++) {
            _selectGameLevel.append('<option value="' + levels[i] + '">' + levels[i] + '</option>');
        }
        _selectGameLevel.formSelect();
    }

    function _fillDifficulty(difficulty) {
        _selectGameDifficulty.empty();
        _selectGameDifficulty.append('<option value="" disabled selected>Choose difficulty</option>');

        for (let i = 0; i < difficulty.length; i++) {
            _selectGameDifficulty.append('<option value="' + difficulty[i] + '">Difficulty ' + (difficulty[i] + 1) + '</option>');
        }
        _selectGameDifficulty.formSelect();
    }

    function _updateMode(modeId) {
        GamePlaygroundHandler.stopGame();
        _currentMode = Number(modeId);
        switch (_currentMode) {
            case ModernSnakeGameModes.onePlayer:
                _initializeSinglePlayer();
                break;
            case ModernSnakeGameModes.twoPlayer:
            case ModernSnakeGameModes.threePlayer:
            case ModernSnakeGameModes.fourPlayer:
                _initializeMultiPlayer();
                break;
            default:
                console.error('Invalid mode given');
        }
    }

    function _initializeSinglePlayer() {
        _currentModeMultiPlayer = false;

        _removeModeListener();
        _initializeModeListener();
        _gameStartButton.on('click', _startSinglePlayer);

        _levelSelectionContainer.show();
        _roomNameContainer.hide();
        _roomCreateContainer.hide();
        _gameStartContainer.show();

        _checkStartOrCreateValid();
    }

    function _initializeMultiPlayer() {
        _currentModeMultiPlayer = true;

        _removeModeListener();
        _initializeModeListener();
        _roomCreateButton.on('click', _createRoom);

        _roomSelectionContainer.show();
        _gameStartContainer.hide();
        _roomNameContainer.show();
        _roomCreateContainer.show();

        _checkStartOrCreateValid();
    }

    function _initializeModeListener() {
        _selectGameLevel.on('change', _checkStartOrCreateValid);
        _selectGameDifficulty.on('change', _checkStartOrCreateValid);
        if (_currentModeMultiPlayer) {
            _roomNameInput.on('keyup', _checkStartOrCreateValid);
        }
    }

    function _removeModeListener() {
        _gameStartButton.off('click');
        _roomCreateButton.off('click');
        _selectGameLevel.off('change');
        _selectGameDifficulty.off('change');
        _roomNameInput.off('keyup');
    }

    function _checkStartOrCreateValid() {
        let element = _currentModeMultiPlayer ? _roomCreateButton : _gameStartButton;
        element.attr('disabled', !_isInputValid());
    }

    function _getLevel() {
        const _selectedLevel = _selectGameLevel.find(_selectedOption);
        if (_selectedLevel.length <= 0) return undefined;
        if (_selectedLevel.first().val().length <= 0) return undefined;
        return _selectedLevel.first().val();
    }

    function _getDifficulty() {
        const _selectedDifficulty = _selectGameDifficulty.find(_selectedOption);
        if (_selectedDifficulty.length <= 0) return undefined;
        if (_selectedDifficulty.first().val().length <= 0) return undefined;
        return _selectedDifficulty.first().val();
    }

    function _isInputValid() {
        let valid = true;

        valid = valid && _getLevel() !== undefined;
        valid = valid && _getDifficulty() !== undefined;

        if (_currentModeMultiPlayer) {
            valid = valid && _roomNameInput.val().length >= ModernSnakeConfig.minimumRoomLength;
        }

        return valid;
    }

    function _startSinglePlayer() {
        if (!_isInputValid()) return;

        const level = _getLevel();
        const difficulty = _getDifficulty();
        _ioCommunication.emit(socketCommands.startSinglePlayer, LoginHandler.getAuth(),
            difficulty, level, _gameStarted);
    }

    function _gameStarted(result) {
        // TODO show message
        if (!result) console.error('Unable to start single player');

        _loadPlayground();
    }

    function _createRoom() {
        if (!_isInputValid()) return;
        console.log('create room');
    }

    function _loadPlayground() {
        _levelSelectionContainer.hide();
        _playgroundContainer.empty();
        // _roomSelectionContainer.hide();
        _playgroundContainer.load(_playgroundPath, undefined, function () {
            _playgroundContainer.show();
            GamePlaygroundHandler.startGame(_currentMode, _gameEndCallback);
            // tabContent.fadeIn('fast');
        });
    }

    function _gameEndCallback() {
        _playgroundContainer.hide();
        _playgroundContainer.empty();
        _levelSelectionContainer.show();
    }

    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
    };
})();
