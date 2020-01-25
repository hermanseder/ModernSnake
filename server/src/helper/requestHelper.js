// Dependencies
const serverCryptoHelper = require(require.resolve('./serverCryptoHelper'));

// External functions
async function checkRequestValidAsync(data, timeStamp) {
    let isValid = true;

    isValid = isValid && data !== undefined;
    isValid = isValid && data.username !== undefined;
    isValid = isValid && data.token !== undefined;

    if (isValid) {
        isValid = isValid && await serverCryptoHelper.isRequestTokenValidAsync(data.token, data.username, timeStamp);
    }

    return isValid;
}


// Exports
module.exports = {
    checkRequestValidAsync: checkRequestValidAsync
};
