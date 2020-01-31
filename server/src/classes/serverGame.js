/*

_gameData: {
    dimension: integer,
    snakeSpeed: number,
    running: boolean,
    game?: {
        snakes: [
            {
                username: string,
                direction: string, // 'up' | 'down' | 'left' | 'right',
                directionRequest: string, // 'up' | 'down' | 'left' | 'right',
                score: integer,
                alive: boolean
                snake: [
                    {
                        x: integer,
                        y: integer
                    }
                ]
            }
        ],
        apple: {
            x: integer,
            y: integer,
        },
        walls: [
            {
                x: integer,
                y: integer
            }
        ]
    },
    before?: {
        countdown: number
    }
    after?: {
        remainingTime: number,
        result: [{
            rank: number,
            username: string
        }]
    }
}

_ioCommunication: socketio;

_id: string;

_level: string;

_players: Map<string, { socket: socketio, username: string }>

_gameEndCallback: function(id: string): boolean;

_interval: number;

_speedDegree: integer;

_snakeMoveTime: number;
_appleAliveTime: number;

_gameLoopRunning: boolean;

 */

const config = require(require.resolve('../../serverConfig.js'));
const socketCommands = require(require.resolve('../../socketCommands'));
const requestHelper = require(require.resolve('../helper/requestHelper'));
const databaseHelper = require(require.resolve('../helper/databaseHelper'));

class ServerGame {

    constructor(socket, id, level, players, speedDegree, difficulty, gameEndCallback) {
        this._ioCommunication = socket;
        this._id = id;
        this._level = level;
        this._players = players;
        this._speedDegree = speedDegree;
        this._difficulty = difficulty;
        this._gameEndCallback = gameEndCallback;
        this._gameLoopRunning = false;
        this._gameSize = players.size;

        this._startTimeStamp = Date.now();
    }

    async startGameAsync() {
        this._phase = 0;
        this._interval = config.gameInterval;
        this._snakeMoveTime = 0;
        this._appleAliveTime = 0;

        await this._buildInitialGameDataAsync(config.gameDimensions, config.gameStartSize,
            config.gameBeforeTime, config.gameAfterTime);

        this._addPlayerListener();
        this._ioCommunication.to(this._id).emit(socketCommands.gameStart);
        this._startGameLoop();
    }

    playerLeave(socketId) {
        for (const [name, player] of this._players) {
            if (name === socketId) {
                player.socket.removeAllListeners(socketCommands.gameMovement);
                this._updateResult([player.username]);
                this._disableInvalidUsers([player.username]);
            }
        }
    }

    stopGame() {
        this._gameLoopRunning = false;
        this._gameData = undefined;
        for (const player of this._players.values()) {
            player.socket.removeAllListeners(socketCommands.gameMovement);
        }
    }

    _addPlayerListener() {
        for (const player of this._players.values()) {
            player.socket.on(socketCommands.gameMovement, (auth, direction) => {
                requestHelper.checkRequestValidAsync(auth, this._startTimeStamp).then(
                    (valid) => {
                        if (valid) {
                            this._movePlayer(player.username, direction);
                        }
                    })
                    .catch(() => {
                    });
            });
        }
    }

    _movePlayer(username, direction) {
        if (!this._gameData.running) return;
        if (this._hasDirectionRequest(username)) return;

        const currentDirection = this._getCurrentDirection(username);
        if (currentDirection === undefined) return;

        switch (direction) {
            case  config.directionUp: {
                if (currentDirection === config.directionDown) return;
                break;
            }
            case  config.directionDown: {
                if (currentDirection === config.directionUp) return;
                break;
            }
            case  config.directionRight: {
                if (currentDirection === config.directionLeft) return;
                break;
            }
            case  config.directionLeft: {
                if (currentDirection === config.directionRight) return;
                break;
            }
        }
        this._updateSnakeDirection(username, direction);
    }

    _updateSnakeDirection(username, direction) {
        for (const snake of this._gameData.game.snakes) {
            if (snake.username === username) {
                snake.directionRequest = direction;
                break;
            }
        }
    }

    _getCurrentDirection(username) {
        for (const snake of this._gameData.game.snakes) {
            if (snake.username === username) {
                return snake.direction;
            }
        }
        return undefined;
    }

    _hasDirectionRequest(username) {
        for (const snake of this._gameData.game.snakes) {
            if (snake.username === username) {
                return snake.directionRequest !== undefined;
            }
        }
        return false;
    }

    _startGameLoop() {
        this._gameLoopRunning = true;
        this._previousTick = Date.now();
        this._gameLoop();
    }

    _gameLoop() {
        if (!this._gameLoopRunning) return;
        const now = Date.now();

        if (this._previousTick + this._interval <= now) {
            const delta = (now - this._previousTick);
            this._previousTick = now;
            this._updateGame(delta);
        }

        if (Date.now() - this._previousTick < this._interval - 16) {
            setTimeout(this._gameLoop.bind(this), this._interval);
        } else {
            setImmediate(this._gameLoop.bind(this));
        }
    }

    _stopGameLoop() {
        this._gameLoopRunning = false;
    }

    _updateGame(delta) {
        let isDirty = false;
        switch (this._phase) {
            case 0: {
                isDirty = this._updatePhasePreparation(delta);
                break;
            }
            case 1: {
                isDirty = this._updatePhaseGame(delta);
                break;
            }
            case 2: {
                isDirty = this._updatePhaseEnd(delta);
                break;
            }
        }
        if (isDirty) {
            this._sendUpdateToUsers();
        }
    }

    _updatePhasePreparation(delta) {
        this._gameData.before.countdown -= delta;
        if (this._gameData.before.countdown <= 0) {
            this._gameData.running = true;
            this._gameData.before = 0;
            this._phase = 1;
        }
        return true;
    }

    _updatePhaseEnd(delta) {
        this._gameData.after.countdown -= delta;
        if (this._gameData.after.countdown <= 0) {
            this._gameData.after.countdown = 0;
            this._sendUpdateToUsers();
            this._gameEndCallback(this._id, this._level, this._gameSize, this._difficulty, this._getGameStoreData());
            this._stopGameLoop();
        }
        return true;
    }

    _getGameStoreData() {
        const result = [];
        for (const entry of this._gameData.after.result) {
            const resultData = {
                username: entry.username,
                rank: entry.rank,
                score: 0
            };
            for (const snakeEntry of this._gameData.game.snakes) {
                if (snakeEntry.username === entry.username) {
                    resultData.score = snakeEntry.score;
                    break;
                }
            }
            result.push(resultData);
        }
        return result;
    }

    _updatePhaseGame(delta) {
        let isDirty = false;

        this._snakeMoveTime += delta;
        if (this._snakeMoveTime >= this._gameData.snakeSpeed) {
            this._setNewDirections();
            this._moveSnake();
            this._snakeMoveTime = 0;
            isDirty = true;
        }

        this._appleAliveTime -= delta;
        if (this._appleAliveTime <= 0) {
            this._updateApple();
            isDirty = true;
        }

        return isDirty;
    }

    _setNewDirections() {
        for (const snake of this._gameData.game.snakes) {
            if (snake.directionRequest === undefined) continue;
            snake.direction = snake.directionRequest;
            snake.directionRequest = undefined;
        }
    }

    _moveSnake() {
        const newPositions = this._getNewSnakePositions();
        if (newPositions.size <= 0) {
            this._phase = 2;
            this._gameData.running = false;
            return;
        }

        const invalidUsers = this._validateSnakePositions(newPositions, this._getInvalidPositions());
        this._updateResult(invalidUsers);
        this._disableInvalidUsers(invalidUsers);
        this._updateApplesAndSnakeLength(newPositions);
        this._mergeNewPositions(newPositions);
    }

    _updateResult(invalidUsers) {
        const invalidLength = invalidUsers.length;
        if (invalidLength <= 0) return;

        const currentRank = this._gameSize - this._gameData.after.result.length - invalidLength + 1;
        for (const user of invalidUsers) {
            this._gameData.after.result.push({
                rank: currentRank,
                username: user,
            });
        }
    }

    _updateApple() {
        this._gameData.game.apple = undefined;
        while (this._gameData.game.apple === undefined) {
            const x = Math.round(Math.random() * this._gameData.dimension);
            const y = Math.round(Math.random() * this._gameData.dimension);
            const invalidPositions = this._getInvalidPositions();
            let valid = true;
            for (const position of invalidPositions) {
                if (position.x !== x) continue;
                if (position.y !== y) continue;
                valid = false;
                break;
            }
            if (valid) {
                this._gameData.game.apple = {x: x, y: y};
            }
        }

        this._appleAliveTime = (config.gameAppleBaseDuration * (this._speedDegree / 100) * (1 + Math.random()));
    }

    _updateApplesAndSnakeLength(newPositions) {
        const apple = this._gameData.game.apple;
        for (const entry of this._gameData.game.snakes) {
            if (!entry.alive) continue;
            if (!newPositions.has(entry.username)) continue;

            const position = newPositions.get(entry.username);
            if (apple !== undefined && apple.x === position.x && apple.y === position.y) {
                entry.score++;
                this._gameData.game.apple = undefined;
                this._appleAliveTime = 0;
            } else {
                entry.snake.pop();
            }
        }
    }

    _getInvalidPositions() {
        let invalidPositions = this._gameData.game.walls;
        for (const entry of this._gameData.game.snakes) {
            invalidPositions = [...invalidPositions, ...entry.snake];
        }
        return invalidPositions;
    }

    _validateSnakePositions(snakePositions, invalidPositions) {
        const invalidUsers = [];
        for (const [username, position] of snakePositions) {
            for (const invalidPosition of invalidPositions) {
                if (position.x !== invalidPosition.x) continue;
                if (position.y !== invalidPosition.y) continue;
                invalidUsers.push(username);
                continue;
            }
        }
        for (const user1 of snakePositions.keys()) {
            for (const user2 of snakePositions.keys()) {
                if (user1 === user2) continue;
                if (snakePositions.get(user1).x !== snakePositions.get(user2).x) continue;
                if (snakePositions.get(user1).y !== snakePositions.get(user2).y) continue;
                if (invalidUsers.indexOf(user1) < 0) {
                    invalidUsers.push(user1);
                    continue;
                }
            }
        }
        return invalidUsers;
    }

    _disableInvalidUsers(invalidUsers) {
        if (invalidUsers.length <= 0) return;
        for (const snake of this._gameData.game.snakes) {
            if (invalidUsers.indexOf(snake.username) >= 0) {
                snake.alive = false;
            }
        }
    }

    _mergeNewPositions(newPositions) {
        for (const entry of this._gameData.game.snakes) {
            if (!entry.alive) continue;
            entry.snake.unshift(newPositions.get(entry.username));
        }
    }

    _getNewSnakePositions() {
        const newSnakePositions = new Map();
        for (const entry of this._gameData.game.snakes) {
            if (!entry.alive) continue;
            switch (entry.direction) {
                case  config.directionUp: {
                    const newPosition = entry.snake[0].y - 1;
                    newSnakePositions.set(entry.username, {
                        x: entry.snake[0].x,
                        y: newPosition < 0 ? (this._gameData.dimension - 1) : newPosition
                    });
                    break;
                }
                case  config.directionDown: {
                    const newPosition = entry.snake[0].y + 1;
                    newSnakePositions.set(entry.username, {
                        x: entry.snake[0].x,
                        y: newPosition > (this._gameData.dimension - 1) ? 0 : newPosition
                    });
                    break;
                }
                case  config.directionRight: {
                    const newPosition = entry.snake[0].x + 1;
                    newSnakePositions.set(entry.username, {
                        x: newPosition > (this._gameData.dimension - 1) ? 0 : newPosition,
                        y: entry.snake[0].y
                    });
                    break;
                }
                case config.directionLeft: {
                    const newPosition = entry.snake[0].x - 1;
                    newSnakePositions.set(entry.username, {
                        x: newPosition < 0 ? (this._gameData.dimension - 1) : newPosition,
                        y: entry.snake[0].y
                    });
                    break;
                }
            }
        }
        return newSnakePositions;
    }

    _sendUpdateToUsers() {
        this._ioCommunication.to(this._id).emit(socketCommands.gameUpdate, this._gameData);
    }

    async _buildInitialGameDataAsync(dimensions, startSize, beforeTime, afterTime) {
        this._gameData = {
            dimension: dimensions,
            snakeSpeed: this._speedDegree,
            running: false,
            game: {
                snakes: this._buildInitialSnakes(dimensions, startSize),
                apple: undefined,
                walls: await this._getLevelWallsAsync()
            },
            before: {
                countdown: beforeTime
            },
            after: {
                countdown: afterTime,
                result: []
            },
        }
    }

    _buildInitialSnakes(dimensions, startSize) {
        const result = [];
        const userNames = Array.from(this._players.values()).map((value => value.username));

        for (let i = 0; i < userNames.length; i++) {
            result.push({
                username: userNames[i],
                score: 0,
                alive: true,
                direction: this._getSnakeDirectionBeginning(i),
                directionRequest: undefined,
                snake: this._getSnakeBeginning(dimensions, i, startSize)
            });
        }
        return result;
    }

    _getSnakeBeginning(dimensions, playerNumber, startSize) {
        const halfDimension = Math.floor(dimensions / 2);
        const isVertical = (playerNumber === 0 || playerNumber === 1);
        const start = (playerNumber === 0 || playerNumber === 2) ? 0 : dimensions - startSize;

        const result = [];
        for (let i = 0; i < startSize; i++) {
            const xOrY = (start === 0 ? startSize - i - 1 : dimensions - startSize + i);
            result.push({
                x: (isVertical ? halfDimension : xOrY),
                y: (isVertical ? xOrY : halfDimension),
            })
        }

        return result;
    }

    _getSnakeDirectionBeginning(playerNumber) {
        switch (playerNumber) {
            case 0:
                return config.directionDown;
            case 1:
                return config.directionUp;
            case 2:
                return config.directionRight;
            case 3:
                return config.directionLeft;
        }
    }

    async _getLevelWallsAsync() {
        const result = await databaseHelper.getLevelWallsAsync(this._level);
        return result;
    }
}

module.exports = ServerGame;
