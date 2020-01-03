let PageScore = (function () {
    function initialize() {
        console.log('init page score');
    }

    function destroy() {
        console.log('destroy page score');
    }

    return {
        initialize: initialize,
        destroy: destroy
    };
})();
