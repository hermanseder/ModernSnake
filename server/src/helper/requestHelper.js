// Dependencies
const serverCryptoHelper = require(require.resolve('./serverCryptoHelper'));

// External functions
function checkRequestValid(data) {
    let isValid = true;

    isValid = isValid && data !== undefined;
    isValid = isValid && data.username !== undefined;
    isValid = isValid && data.token !== undefined;

    if (isValid) {
        isValid = isValid && serverCryptoHelper.isRequestTokenValidAsync(data.token, data.username);
    }

    if (!isValid) {
        console.log('not valid');
    }
    return isValid;
}


// Exports
module.exports = {
    checkRequestValid: checkRequestValid
};
