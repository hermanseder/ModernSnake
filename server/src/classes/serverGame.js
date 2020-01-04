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
        countdown: number,
        result: [string]
    }
    after?: {
        remainingTime: number
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

        this._buildInitialGameData(config.gameDimensions, config.gameStartSize,
            config.gameBeforeTime, config.gameAfterTime);

        this._addPlayerListener();
        this._startGameLoop();
    }

    _addPlayerListener() {
        for (const player of this._players.values()) {
            if (!player.socket.username) continue;
            player.socket.on(socketCommands.gameMovement, (auth, direction) => {
                if (requestHelper.checkRequestValid(auth)) {
                    this._movePlayer(player.username, direction);
                }
            });
        }
    }

    _movePlayer(username, direction) {
        if (!this._gameData.running) return;

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
                snake.direction = direction;
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

    _startGameLoop() {
        console.log('start game loop');
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
            this._gameEndCallback(this._id);
            this._stopGameLoop();
        }
    }

    _updatePhaseGame(delta) {
        this._snakeMoveTime += delta;
        if (this._snakeMoveTime >= this._gameData.snakeSpeed) {
            this._moveSnake();
            this._snakeMoveTime = 0;
        }
    }

    _moveSnake() {
        let appleUsedBy = undefined;
        for (const entry of this._gameData.game.snakes) {
            if (!entry.alive) continue;

            this._updateSnakePosition(entry);
            if (this._checkApple(entry.snake[0].x, entry.snake[0].y)) {
                appleUsedBy = entry.username;
                entry.score++;
            } else {
                entry.snake.pop();
            }
        }
        const looser = this._validateSnakes(appleUsedBy);
        this._fixScore(looser, appleUsedBy);

        const anyPlayerAlive = this._removeLooser(looser);
        if (!anyPlayerAlive) {
            this._phase = 2;
        }
    }

    _validateSnakes() {
        const looser = [];
        for (const snake1 of this._gameData.game.snakes) {
            if (!snake1.alive) continue;

            for (const snake2 of this._gameData.game.snakes) {
                if (snake1.username === snake2.username) continue;

                for (let i = 0; i < snake2.snake.length; i++) {
                    if (snake1.snake[0].x !== snake2.snake[i].x) continue;
                    if (snake1.snake[0].y !== snake2.snake[i].y) continue;

                    looser.push(snake1.username);
                    if (i <= 0) {
                        looser.push(snake2.username);
                    }
                }
            }
        }
        return looser;
    }

    _fixScore(looser, appleUsedBy) {
        if (appleUsedBy !== undefined && looser.indexOf(appleUsedBy) >= -1) {
            for (const entry of this._gameData.game.snakes) {
                if (entry.username === appleUsedBy) {
                    entry.score--;
                    break;
                }
            }
        }
    }

    _removeLooser(looser) {
        let anyPlayerAlive = false;
        for (const entry of this._gameData.game.snakes) {
            if (looser.indexOf(entry.username) >= 0) {
                entry.alive = false;
                this._gameData.after.result.unshift(entry.username);
            }
            anyPlayerAlive = anyPlayerAlive || entry.alive;
        }
        return anyPlayerAlive;
    }

    _updateSnakePosition(entry) {
        switch (entry.direction) {
            case  config.directionUp: {
                const newPosition = entry.snake[0].y - 1;
                entry.snake.unshift({
                    x: entry.snake[0].x,
                    y: newPosition < 0 ? (this._gameData.dimension - 1) : newPosition
                });
                break;
            }
            case  config.directionDown: {
                const newPosition = entry.snake[0].y + 1;
                entry.snake.unshift({
                    x: entry.snake[0].x,
                    y: newPosition > (this._gameData.dimension - 1) ? 0 : newPosition
                });
                break;
            }
            case  config.directionRight: {
                const newPosition = entry.snake[0].x + 1;
                entry.snake.unshift({
                    x: newPosition > (this._gameData.dimension - 1) ? 0 : newPosition,
                    y: entry.snake[0].y
                });
                break;
            }
            case config.directionLeft: {
                const newPosition = entry.snake[0].x - 1;
                entry.snake.unshift({
                    x: newPosition < 0 ? (this._gameData.dimension - 1) : newPosition,
                    y: entry.snake[0].y
                });
                break;
            }
        }
    }

    _checkApple(positionX, positionY) {
        const apple = this._gameData.game.apple;

        if (apple === undefined) return false;
        if (apple.x !== positionX) return false;
        if (apple.y !== positionY) return false;

        this._gameData.game.apple = undefined;

        return true;
    }

    _sendUpdateToUsers() {
        this._ioCommunication.to(this._id).emit(socketCommands.gameUpdate, this._gameData);
    }

    _buildInitialGameData(dimensions, startSize, beforeTime, afterTime) {
        this._gameData = {
            dimension: dimensions,
            snakeSpeed: this._getSnakeSpeed(),
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

    _getSnakeSpeed() {
        switch (this._speedDegree) {
            case 0:
                return config.gameSnakeSpeed0;
            case 1:
                return config.gameSnakeSpeed1;
            case 2:
                return config.gameSnakeSpeed2;
            default:
                return 1000;
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
