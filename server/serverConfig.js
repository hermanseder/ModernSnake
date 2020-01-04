module.exports = {
    databaseFile: 'server/data/database.db',

    saltRounds: 10,
    userSalt: 'ModernSnake',
    userNotExistsSalt: '$2b$10$xLdkcF1jr14G0SfcoS/Vcu',

    jsonWebTokenSecret: 'E3A672C54BA85A4CDE0CC3526AFCC77FA7A7DDF7CBCD18362263F6D83EC58EAD',
    jsonWebTokenExpirationInSeconds: 10800, // 2 hours
}
