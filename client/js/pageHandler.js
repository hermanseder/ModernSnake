const PageHandler = (function () {
    let _currentClass;
    let _mainContent;
    let _mainTitle;

    function initialize(mainContent, mainTitle) {
        _currentClass = undefined;
        _mainContent = mainContent;
        _mainTitle = mainTitle;
    }

    function updatePath(id) {
        switch (id) {
            case 'home':
                _loadPath(id, 'home', PageHome);
                break;
            case 'game':
                _loadPath(id, 'game', PageHome);
                break;
            case 'score':
                _loadPath(id, 'score', PageScore);
                break;
            case 'levels':
                _loadPath(id, 'levels', PageLevels);
                break;
            default:
                console.error('Invalid path given: "' + id + '"');
        }
    }

    function _loadPath (title, dest, newClass) {
        if (_currentClass !== undefined) {
            _currentClass.destroy();
        }

        _mainContent.empty();
        _mainContent.load('pages/' + dest + '.html', undefined, function () {
            _mainTitle.text(title);
            _currentClass = newClass;
            _currentClass.initialize();
        });
    }

    return {
        initialize: initialize,
        updatePath: updatePath
    };
})();
