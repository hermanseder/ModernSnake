/*
_currentMode: integer;

_ioCommunication: socketio;
 */

let GameModeSelectorHandler = (function () {
    /* Constants */
    const _playgroundPath = 'pages/game/gamePlayground.html';
    const _selectedOption = 'option:selected';
    const _roomSelectedClass = 'room-selection-active';
    const _dataRoomIdAttribute = 'data-room-id';
    const _roomSelectionRowClass = 'room-selection-row';
    const _roomSelectionRowFullClass = 'room-selection-full';

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

    let _currentSelectedRoom;
    let _roomNames;
    let _currentRoomData;

    /* External functions */
    function construct(socket) {
        _ioCommunication = socket;
        _currentModeMultiPlayer = false;
    }

    function initialize(modeId) {
        _removeSocketListener();

        _initializeDomElements();
        _loadRoomNames();
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
        _ioCommunication.on(socketCommands.updateRoomNames, _updateRoomNames);
    }

    function _removeSocketListener() {
        _ioCommunication.removeAllListeners(socketCommands.updateLevels);
        _ioCommunication.removeAllListeners(socketCommands.updateRooms2);
        _ioCommunication.removeAllListeners(socketCommands.updateRooms3);
        _ioCommunication.removeAllListeners(socketCommands.updateRooms4);
        _ioCommunication.removeAllListeners(socketCommands.updateRoomNames);
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

        _currentRoomData = [...data];
        const elements = _roomSelectionContent.find('.' + _roomSelectionRowClass);
        for (let i = 0; i < elements.length; i++) {
            const currentElement = $(elements.get(i));
            const roomId = GenericUiHandler.getAttribute(currentElement, _dataRoomIdAttribute);

            const roomIndex = _getIndexOfRoom(data, roomId);
            if (roomIndex < 0) {
                currentElement.remove();
            } else {
                const roomData = data[roomIndex];
                currentElement.find('.room-level').text(roomData.level);
                currentElement.find('.room-difficulty').text(_getDifficultyFormatted(roomData.difficulty));
                currentElement.find('.room-size').text(_getRoomSizeFormatted(roomData.size, roomData.remainingPlaces));
                if (roomData.remainingPlaces <= 0) {
                    currentElement.addClass(_roomSelectionRowFullClass);
                } else {
                    currentElement.removeClass(_roomSelectionRowFullClass);
                }
                data.splice(roomIndex, 1);
            }
        }
        for (let i = 0; i < data.length; i++) {
            _roomSelectionContent.append(_createRoomRow(data[i]));
        }

        _updateRoomListener();
    }

    function _getIndexOfRoom(rooms, roomName) {
        if (!roomName) return -1;
        for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].name === roomName) return i;
        }
        return -1;
    }

    function _loadRoomNames() {
        _ioCommunication.emit(socketCommands.getRoomNames, LoginHandler.getAuth(), function (data) {
            if (data.success) {
                _updateRoomNames(data.data);
            }
        });
    }

    function _updateRoomNames(data) {
        _roomNames = data || [];
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
            _selectGameDifficulty.append('<option value="' + difficulty[i] + '">' + _getDifficultyFormatted(difficulty[i]) + '</option>');
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
        _roomNameInput.on('keyup', _createRoomKeyEvent);

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
        _currentRoomData = rooms;
        _roomSelectionContent.empty();

        for (let i = 0; i < rooms.length; i++) {
            _roomSelectionContent.append(_createRoomRow(rooms[i]));
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
        _currentRooms = _roomSelectionContainer.find('.' + _roomSelectionRowClass);
        _currentRooms.off('click');

        const activeRooms = _currentRooms.not('.' + _roomSelectedClass);
        activeRooms.on('click', _joinRoom);
    }

    function _joinRoom(source) {
        ContentHandler.closeSidebar();
        const roomId = GenericUiHandler.getAttribute($(source.delegateTarget), _dataRoomIdAttribute);
        if (roomId === undefined) {
            ErrorHandler.showErrorMessage('ROOM_ID_MISSING');
            return;
        }
        if (roomId === _currentSelectedRoom) return;
        for (let i = 0; i < _currentRoomData.length; i++) {
            if (_currentRoomData[i].name !== roomId) continue;
            if (_currentRoomData[i].remainingPlaces > 0) continue;
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
        const roomFullClass = (roomData.remainingPlaces <= 0) ? _roomSelectionRowFullClass : '';
        let element = '<div class="' + _roomSelectionRowClass + ' row ' + roomFullClass + '" ' + _dataRoomIdAttribute + '="' + roomData.name + '">';
        element += '<div class="room-name col s12 m4">' + roomData.name + '</div>';
        element += '<div class="room-level col s12 m3">' + roomData.level + '</div>';
        element += '<div class="room-difficulty col s8 m3">' + _getDifficultyFormatted(roomData.difficulty) + '</div>';
        element += '<div class="room-size col s4 m1">' + _getRoomSizeFormatted(roomData.size, roomData.remainingPlaces) + '</div>';
        element += '</div>';
        return element;
    }

    function _getRoomSizeFormatted(size, remainingPlaces) {
        return (remainingPlaces > 0) ? (size - remainingPlaces) + ' | ' + size : 'run';
    }

    function _getDifficultyFormatted(difficulty) {
        switch (difficulty) {
            case 0:
                return ModernSnakeGameDifficulty.Difficulty0;
            case 1:
                return ModernSnakeGameDifficulty.Difficulty1;
            case 2:
                return ModernSnakeGameDifficulty.Difficulty2;
            default:
                return 'Difficulty 42';
        }
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

    function _getRoomName() {
        if (!_roomNameInput) return undefined;
        if (!_roomNameInput.val()) return undefined;
        if (_roomNameInput.val().length <= 0) return undefined;
        return _roomNameInput.val();
    }

    function _isInputValid() {
        let valid = true;

        valid = valid && _getLevel() !== undefined;
        valid = valid && _getDifficulty() !== undefined;

        if (_currentModeMultiPlayer) {
            const roomName = _getRoomName();
            valid = valid && roomName !== undefined;
            valid = valid && roomName.length >= ModernSnakeConfig.minimumRoomLength;
            valid = valid && _roomNames.indexOf(roomName) < 0;
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

    function _createRoomKeyEvent(event) {
        if (event.keyCode === ModernSnakeKeyCodes.keyEnter) {
            _createRoom();
        } else {
            _checkStartOrCreateValid();
        }
    }

    function _createRoom() {
        if (!_isInputValid()) return;

        let command = undefined;
        switch (_currentMode) {
            case ModernSnakeGameModes.twoPlayer:
                command = socketCommands.createRoom2;
                break;
            case ModernSnakeGameModes.threePlayer:
                command = socketCommands.createRoom3;
                break;
            case ModernSnakeGameModes.fourPlayer:
                command = socketCommands.createRoom4;
                break;
        }
        if (command !== undefined) {
            const roomName = _getRoomName();
            const level = _getLevel();
            const difficulty = _getDifficulty();

            _ioCommunication.emit(command, LoginHandler.getAuth(), roomName, level, difficulty, _roomCreated);
        }
    }

    function _roomCreated(data) {
        if (!data) return;
        if (data.success) {
            GenericUiHandler.resetMaterialInput(_roomNameInput);
            GenericUiHandler.resetMaterialSelect(_selectGameLevel);
            GenericUiHandler.resetMaterialSelect(_selectGameDifficulty);
        } else {
            ErrorHandler.showErrorMessage(data.failure);
        }
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
        _currentSelectedRoom = undefined;
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
