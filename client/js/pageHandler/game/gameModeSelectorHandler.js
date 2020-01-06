/*
_currentMode: integer;

_ioCommunication: socketio;
 */

let GameModeSelectorHandler = (function () {
    /* Constants */
    const _classContainerHidden = 'container-hidden';
    const _playgroundPath = 'pages/game/gamePlayground.html';
    const _selectedOption = 'option:selected';
    const _roomSelectedClass = 'room-selection-active';
    const _dataRoomIdAttribute = 'data-room-id';

    /* Variables */
    let _ioCommunication;
    let _currentMode;
    let _currentModeMultiPlayer;
    let _roomSelectionContainer;
    let _roomSelectionContent;
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

    let _currentRooms;
    let _currentRoomsArray;

    let _currentSelectedRoom;

    /* External functions */
    function construct(socket) {
        _ioCommunication = socket;
        _currentModeMultiPlayer = false;
        _currentRoomsArray = [];
    }

    function initialize(modeId) {
        _removeSocketListener();

        _initializeDomElements();
        _fillOptions();
        _initializeSocketListener();

        _roomSelectionContainer.hide();
        _levelSelectionContainer.hide();
        _playgroundContainer.hide();

        _updateMode(modeId);
    }

    function destroy() {
        _currentMode = -1;
        _removeModeListener();
        _removeSocketListener();
        _removeGameStartListener();
        GamePlaygroundHandler.stopGame();
    }

    /* Internal functions */
    function _initializeSocketListener() {
        _ioCommunication.on(socketCommands.updateLevels, _fillLevels);
    }

    function _removeSocketListener() {
        _ioCommunication.removeAllListeners(socketCommands.updateLevels);
        _ioCommunication.removeAllListeners(socketCommands.updateRooms2);
        _ioCommunication.removeAllListeners(socketCommands.updateRooms3);
        _ioCommunication.removeAllListeners(socketCommands.updateRooms4);
    }

    function _removeGameStartListener() {
        _ioCommunication.removeAllListeners(socketCommands.gameStart);
    }

    function _initializeDomElements() {
        _roomSelectionContainer = $('#room-selection-container');
        _roomSelectionContent = $('#room-selection-content');
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

    function _updateMode(modeId) {
        GamePlaygroundHandler.stopGame();
        _currentMode = Number(modeId);
        _currentSelectedRoom = undefined;
        switch (_currentMode) {
            case ModernSnakeGameModes.onePlayer:
                _initializeSinglePlayer();
                break;
            case ModernSnakeGameModes.twoPlayer:
                _ioCommunication.on(socketCommands.updateRooms2, _roomsUpdated);
                _initializeMultiPlayer();
                break;
            case ModernSnakeGameModes.threePlayer:
                _ioCommunication.on(socketCommands.updateRooms3, _roomsUpdated);
                _initializeMultiPlayer();
                break;
            case ModernSnakeGameModes.fourPlayer:
                _ioCommunication.on(socketCommands.updateRooms4, _roomsUpdated);
                _initializeMultiPlayer();
                break;
            default:
                console.error('Invalid mode given');
        }
    }

    function _roomsUpdated(data) {
        if (!data) {
            _roomSelectionContent.empty();
            return;
        }

        for (let i = 0; i < data.length; i++) {
            const roomName = data[i].name;
            if (_currentRoomsArray.indexOf(roomName) >= 0) {
                _updateRoomRow(data[i]);
            } else {
                _roomSelectionContent.append(_createRoomRow(data[i]));
                _currentRoomsArray.push(roomName);
            }
        }
        _updateRoomListener();
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

        _loadAvailableRooms();

        _removeModeListener();
        _initializeModeListener();
        _roomCreateButton.on('click', _createRoom);

        _gameStartContainer.hide();
        _levelSelectionContainer.show();
        _roomSelectionContainer.show();
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

    function _loadAvailableRooms() {
        let command = undefined;
        switch (_currentMode) {
            case ModernSnakeGameModes.twoPlayer:
                command = socketCommands.getRooms2;
                break;
            case ModernSnakeGameModes.threePlayer:
                command = socketCommands.getRooms3;
                break;
            case ModernSnakeGameModes.fourPlayer:
                command = socketCommands.getRooms4;
                break;
        }
        if (command !== undefined) {
            _ioCommunication.emit(command, LoginHandler.getAuth(), _fillRooms);
        }
    }

    function _fillRooms(rooms) {
        _roomSelectionContent.empty();
        _currentRoomsArray = [];

        for (let i = 0; i < rooms.length; i++) {
            _roomSelectionContent.append(_createRoomRow(rooms[i]));
            _currentRoomsArray.push(rooms[i].name);
        }
        _updateRoomListener();
        _loadCurrentRoom();
    }

    function _loadCurrentRoom() {
        let command = undefined;
        switch (_currentMode) {
            case ModernSnakeGameModes.twoPlayer:
                command = socketCommands.getCurrentRoom2;
                break;
            case ModernSnakeGameModes.threePlayer:
                command = socketCommands.getCurrentRoom3;
                break;
            case ModernSnakeGameModes.fourPlayer:
                command = socketCommands.getCurrentRoom4;
                break;
        }
        if (command !== undefined) {
            _ioCommunication.emit(command, LoginHandler.getAuth(), _updateCurrentRoom);
        }
    }

    function _updateCurrentRoom(data) {
        if (!data) return;
        if (!data.success) return;
        if (!data.data) return;

        _currentSelectedRoom = data.data;
        let element = undefined;
        _currentRooms.each(function () {
            const roomId = GenericUiHandler.getAttribute($(this), _dataRoomIdAttribute);
            if (roomId === _currentSelectedRoom) {
                element = $(this);
                return;
            }
        });
        if (element !== undefined) {
            _updateSelectedRoom(element.get(0));
        }
    }

    function _updateRoomListener() {
        _currentRooms = _roomSelectionContainer.find('.room-selection-row');
        _currentRooms.off('click');

        const activeRooms = _currentRooms.not('.' + _roomSelectedClass);
        activeRooms.on('click', _joinRoom);
    }

    function _joinRoom(source) {
        const roomId = GenericUiHandler.getAttribute($(source.delegateTarget), _dataRoomIdAttribute);
        if (roomId === _currentSelectedRoom) return;

        if (roomId === undefined) {
            ErrorHandler.showErrorMessage('ROOM_ID_MISSING');
            return;
        }

        _removeGameStartListener();
        _registerGameStartListener();
        _ioCommunication.emit(socketCommands.joinRoom, LoginHandler.getAuth(), roomId,
            function (result) {
                _joinRoomCallback(result, source.delegateTarget, roomId);
            }
        );
        _updateSelectedRoom(source.delegateTarget);
    }

    function _joinRoomCallback(data, source, roomId) {
        if (!data) return;
        if (data.success) {
            _currentSelectedRoom = roomId;
            _updateSelectedRoom(source);
        } else {
            ErrorHandler.showErrorMessage(data.failure);
        }
    }

    function _registerGameStartListener() {
        console.log('register game start listener');
        _ioCommunication.on(socketCommands.gameStart, _multiPlayerStarted);
    }

    function _updateSelectedRoom(source) {
        _currentRooms.each(function () {
                if ($(this).length > 0 && source === $(this)[0]) {
                    $(this).addClass(_roomSelectedClass);
                } else {
                    $(this).removeClass(_roomSelectedClass);
                }
            }
        );
        _updateRoomListener();
    }

    function _createRoomRow(roomData) {
        let element = '<div class="room-selection-row row" ' + _dataRoomIdAttribute + '="' + roomData.name + '">';
        element += '<div class="room-name col s12 m4">' + roomData.name + '</div>';
        element += '<div class="room-level col s12 m3">' + roomData.level + '</div>';
        element += '<div class="room-difficulty col s8 m3">' + _getDifficultyFormatted(roomData.difficulty) + '</div>';
        element += '<div class="room-size col s4 m1">' + _getRoomSizeFormatted(roomData.size, roomData.remainingPlaces) + '</div>';
        element += '</div>';
        return element;
    }

    function _updateRoomRow(roomData) {
        let element = undefined;
        _currentRooms.each(function () {
            const roomId = GenericUiHandler.getAttribute($(this), _dataRoomIdAttribute);
            if (roomId === roomData.name) {
                element = $(this);
                return;
            }
        });
        if (element !== undefined) {
            element.find('.room-level').text(roomData.level);
            element.find('.room-difficulty').text(_getDifficultyFormatted(roomData.difficulty));
            element.find('.room-size').text(_getRoomSizeFormatted(roomData.size, roomData.remainingPlaces));
        }
    }

    function _getRoomSizeFormatted(size, remainingPlaces) {
        return (size - remainingPlaces) + ' | ' + size
    }

    function _getDifficultyFormatted(difficulty) {
        return 'Difficulty ' + difficulty;
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
            difficulty, level, _singlePlayerStarted);
    }

    function _singlePlayerStarted(result) {
        // TODO show message
        if (!result) console.error('Unable to start single player');
        _loadPlayground();
    }

    function _multiPlayerStarted() {
        console.log('multi player started event');
        _loadPlayground();
    }

    function _createRoom() {
        if (!_isInputValid()) return;
        console.log('create room');
    }

    function _loadPlayground() {
        _levelSelectionContainer.hide();
        _roomSelectionContainer.hide();
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
        if (_currentModeMultiPlayer) {
            _roomSelectionContainer.show();
        }
    }

    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
    };
})();
