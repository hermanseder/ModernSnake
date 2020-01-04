let PageHome = (function () {
    let _ioCommunication;

    function construct(socket) {
        _ioCommunication = socket;
    }

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
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
