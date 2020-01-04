let PageHome = (function () {
    function initialize() {
        console.log('init page home');
    }

    function destroy() {
        console.log('destroy page home');
    }

    function isAllowed() {
        return true;
    }

    return {
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
