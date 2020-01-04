const PageHandler = (function () {
    let _currentClass;
    let _mainContent;
    let _mainTitle;

    function initialize(socket, mainContent, mainTitle) {
        _currentClass = undefined;
        _mainContent = mainContent;
        _mainTitle = mainTitle;

        _constructPages(socket);
    }

    function updatePath(id) {
        switch (id) {
            case 'home':
                return _loadPath(id, 'home', PageHome);
                break;
            case 'game':
                return _loadPath(id, 'game', PageGame);
                break;
            case 'score':
                return _loadPath(id, 'score', PageScore);
                break;
            case 'levels':
                return _loadPath(id, 'levels', PageLevels);
                break;
            default:
                console.error('Invalid path given: "' + id + '"');
                return false;
        }
    }

    function _constructPages(socket) {
        PageHome.construct(socket);
        PageGame.construct(socket);
        PageScore.construct(socket);
        PageLevels.construct(socket);
    }

    function _loadPath (title, dest, newClass) {
        if (!newClass.isAllowed()) {
            ContentHandler.openUsermenu();
            return false;
        }

        if (_currentClass !== undefined) {
            _currentClass.destroy();
        }

        _mainContent.empty();
        _mainContent.load('pages/' + dest + '.html', undefined, function () {
            _mainTitle.text(title);
            _currentClass = newClass;
            _currentClass.initialize();
        });

        return true;
    }

    return {
        initialize: initialize,
        updatePath: updatePath
    };
})();
