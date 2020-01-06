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
        result: [string]
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

const config = require('../../serverConfig.js');
const socketCommands = require('../../socketCommands');
const requestHelper = require('../helper/requestHelper');
const {interval} = require('rxjs');
const {take} = require('rxjs/operators');

class ServerGame {

    constructor(socket, id, level, players, speedDegree, gameEndCallback) {
        this._ioCommunication = socket;
        this._id = id;
        this._level = level;
        this._players = players;
        this._speedDegree = speedDegree;
        this._gameEndCallback = gameEndCallback;
        this._gameLoopRunning = false;
    }

    startGame() {
        // TODO load from database
        this._phase = 0;
        this._interval = config.gameInterval;
        this._snakeMoveTime = 0;
        this._appleAliveTime = 0;

        this._buildInitialGameData(config.gameDimensions, config.gameStartSize,
            config.gameBeforeTime, config.gameAfterTime);

        this._addPlayerListener();
        console.log('emit gamestart event to ' + this._id);
        this._ioCommunication.to(this._id).emit(socketCommands.gameStart);
        this._startGameLoop();
    }

    playerLeave(socketId) {
        for (const [name, player] of this._players) {
            if (name === socketId) {
                player.socket.removeAllListeners(socketCommands.gameMovement);
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
                if (requestHelper.checkRequestValid(auth)) {
                    this._movePlayer(player.username, direction);
                }
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
        // TODO USE BETTER ONE
        this._gameLoopRunning = true;
        const loopSubscription = interval(this._interval)
            .subscribe((round) => {
                if (this._gameLoopRunning) {
                    this._updateGame(this._interval);
                } else {
                    loopSubscription.unsubscribe();
                }
            });
    }

    _stopGameLoop() {
        this._gameLoopRunning = false;
    }

    _updateGame(delta) {
        switch (this._phase) {
            case 0: {
                this._updatePhasePreparation(delta);
                break;
            }
            case 1: {
                this._updatePhaseGame(delta);
                break;
            }
            case 2: {
                this._updatePhaseEnd(delta);
                break;
            }
        }
        this._sendUpdateToUsers();
    }

    _updatePhasePreparation(delta) {
        this._gameData.before.countdown -= delta;
        if (this._gameData.before.countdown <= 0) {
            this._gameData.running = true;
            this._gameData.before = 0;
            this._phase = 1;
        }
    }

    _updatePhaseEnd(delta) {
        this._gameData.after.countdown -= delta;
        if (this._gameData.after.countdown <= 0) {
            this._gameData.after.countdown = 0;
            this._sendUpdateToUsers();
            this._gameEndCallback(this._id);
            this._stopGameLoop();
        }
    }

    _updatePhaseGame(delta) {
        this._snakeMoveTime += delta;
        if (this._snakeMoveTime >= this._gameData.snakeSpeed) {
            this._setNewDirections();
            this._moveSnake();
            this._snakeMoveTime = 0;
        }

        this._appleAliveTime -= delta;
        if (this._appleAliveTime <= 0) {
            this._updateApple();
        }
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
            return;
        }

        const invalidUsers = this._validateSnakePositions(newPositions, this._getInvalidPositions());
        this._updateResult(invalidUsers);
        this._disableInvalidUsers(invalidUsers);
        this._updateApplesAndSnakeLength(newPositions);
        this._mergeNewPositions(newPositions);
    }

    _updateResult(invalidUsers) {
        for (const user of invalidUsers) {
            this._gameData.after.result.unshift(user);
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

        this._appleAliveTime = (config.gameAppleBaseDuration * (1 + Math.random()));
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
        // console.log('emit');
        this._ioCommunication.to(this._id).emit(socketCommands.gameUpdate, this._gameData);
    }

    _buildInitialGameData(dimensions, startSize, beforeTime, afterTime) {
        this._gameData = {
            dimension: dimensions,
            snakeSpeed: this._speedDegree,
            running: false,
            game: {
                snakes: this._buildInitialSnakes(dimensions, startSize),
                apple: undefined,
                walls: this._getLevelWalls()
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
        const halfDimension = dimensions / 2;
        const isVertical = dimensions % 2 === 0;
        const start = playerNumber === 0 || playerNumber === 2 ? 0 : dimensions - startSize;

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

    _getLevelWalls() {
        // TODO load from database
        return [
            {x: 2, y: 2},
            {x: 2, y: 3},
            {x: 2, y: 4},
            {x: 3, y: 4},
            {x: 4, y: 4},
            {x: 5, y: 4},
            {x: 6, y: 4},
            {x: 7, y: 4},
        ];
    }
}

module.exports = ServerGame;
