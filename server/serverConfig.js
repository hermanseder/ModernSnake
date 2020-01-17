module.exports = {
    databaseFile: 'server/data/database.db',

    saltRounds: 10,
    userSalt: 'ModernSnake',
    userNotExistsSalt: '$2b$10$xLdkcF1jr14G0SfcoS/Vcu',

    jsonWebTokenSecret: 'E3A672C54BA85A4CDE0CC3526AFCC77FA7A7DDF7CBCD18362263F6D83EC58EAD',
    jsonWebTokenExpirationInSeconds: 10800, // 2 hours

    gameInterval: 1000 / 10,
    gameAppleBaseDuration: 5000,
    gameDimensions: 39,
    gameBeforeTime: 3000,
    gameAfterTime: 5000,
    gameStartSize: 10,
    gameDifficulty: [0, 1, 2],
    gameSnakeSpeed0: 1000 / 4,
    gameSnakeSpeed1: 1000 / 8,
    gameSnakeSpeed2: 1000 / 10,

    directionUp: 'up',
    directionDown: 'down',
    directionLeft: 'left',
    directionRight: 'right',

    maxScoreResult: 10
}
