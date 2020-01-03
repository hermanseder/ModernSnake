let CryptoHelper = (function () {
    function generateSaltAsync() {
        return dcodeIO.bcrypt.genSalt(ModernSnakeConfig.saltRounds);
    }

    function generateHashAsync(password, salt) {
        return dcodeIO.bcrypt.hash(password, salt);
    }

    function generatePasswordHash(data, salt) {
        return sha256(data + ':' + salt);
    }

    return {
        generateSaltAsync: generateSaltAsync,
        generateHashAsync: generateHashAsync,
        generatePasswordHash: generatePasswordHash,
    };
})();

// async function generateSaltAsync() {
//     const genSaltPromise = util.promisify(bcrypt.genSalt);
//     return genSaltPromise.call(bcrypt, config.saltRounds);
// }
//
// async function generateHashAsync(password, salt) {
//     const hashPromise = util.promisify(bcrypt.hash);
//     return hashPromise.call(bcrypt, password, salt);
// }
//
// async function generatePasswordHashAsync(data, salt) {
//     return sha256(`${data}:${salt}`);
// }
//
// // Exports
// module.exports = {
//     generateSaltAsync: generateSaltAsync,
//     generateHashAsync: generateHashAsync,
//     generatePasswordHash: generatePasswordHashAsync,
// };
