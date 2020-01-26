let PageLevels = (function () {
    let _ioCommunication;
    let _levelBoxContainer;
    let _levelBoxItems;
    const gameState = [];

    function construct(socket) {
        _ioCommunication = socket;
    }

    function initialize() {
        console.log('init page levels');
        _levelBoxContainer = $('#overlay');
        _levelBoxItems = _levelBoxContainer.find('.plot');
        _createLevelGrid();
    }

    /* Internal functions */

    function _createLevelGrid() {
        let wallCount = 0; 
        //create boxes
        for (let i = 0; i < ModernSnakeConfig.gameDimensions; i++){
            if(!gameState[i]) {
                gameState[i] = [];
            }
            for(let j = 0; j  < ModernSnakeConfig.gameDimensions; j++) {
                gameState[i][j] = false;
                const span = document.createElement('span');
                const isDisabled = _isDisabledCell(i) || _isDisabledCell(j);
                span.classList = isDisabled ? 'plot plot-disabled' : 'plot';
                span.addEventListener('click', () => {
                    if(!isDisabled) {
                        // NOTE: [...span.classList] simmilar to Array.from(span.classList)
                        if([...span.classList].indexOf('plot-active') === -1) {
                            if (wallCount < ModernSnakeConfig.maxWalls) {
                                span.classList = 'plot plot-active';
                                gameState[i][j] = true;
                                wallCount++; 
                            } else {
                                window.alert("to many walls set, deselect some"); 
                            }
                        } else {
                            span.classList = 'plot';
                            gameState[i][j] = false;
                            wallCount--; 
                        }
                        console.log(wallCount); 
                    }     

                }, false); 
                document.getElementById('overlay').appendChild(span);
            }
        }
    }

    function _getGameState() {
        console.warn(gameState);
        return gameState;
    }

    function _isDisabledCell(cell) {
        return cell === Math.floor(ModernSnakeConfig.gameDimensions / 2);
    }

    function destroy() {
        console.log('destroy page levels');
    }

    function isAllowed() {
        return LoginHandler.isLoggedIn();
    }

    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed,
        getGameState: _getGameState
    };
})();
