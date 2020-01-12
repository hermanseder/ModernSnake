let PageScore = (function () {
    
    /* Variables */
    let _ioCommunication;
    let _parentScoreBox;


    /* External functions */
    function construct(socket) {
        _ioCommunication = socket;
    }

    function initialize() {
        console.log('init page score');
        _parentScoreBox = $('#parent-score-box');

        // Initial load
        _ioCommunication.emit(socketCommands.loadScore, LoginHandler.getAuth(), _updateScoreBoard);

        // Data update
        _ioCommunication.on(socketCommands.updateScore, _updateScoreBoard);
    }

    function destroy() {
        console.log('destroy page score');
        _ioCommunication.removeAllListeners(socketCommands.updateScore);
    }

    function isAllowed() {
        return LoginHandler.isLoggedIn();
    }
    
    /* Internal functions */
    function _updateScoreBoard(data) {
        if(!data.success) {
            ErrorHandler.showErrorMessage(data.failure);
            return;
        }

        const scoreData = data.result;
        _parentScoreBox.empty();
        console.log(scoreData);
        for (let i = 0; i < scoreData.length; i++) {
            _parentScoreBox.append(_createScoreBoardChild(scoreData[i]));
        }
    }

    function _createScoreBoardChild(data) {
        let htmlCode = '';
        htmlCode += _createTableBegin();
        htmlCode += _createScoreChildHeader(data.levelName);
        htmlCode += _createScoreChildBody(data.scoreData);
        htmlCode += _createTableEnd();
        return htmlCode;
    }

    function _createTableBegin() {
        let htmlCode = '<div class="child-score-box">';
        htmlCode += '<table>';
        return htmlCode;
    }

    function _createTableEnd() {
        let htmlCode = '</table>';
        htmlCode += '</div>';
        return htmlCode;

    }

    function _createScoreChildHeader(levelName) {
        let htmlCode = '';
        htmlCode += '<div class="child-score-box-level">' + levelName + '</div>'
        htmlCode += '<tr>'; 
        htmlCode += '<th>No.</th>'; 
        htmlCode += '<th>Name</th>'; 
        htmlCode += '<th>Name</th>'; 
        htmlCode += '<th>Score</th>'; 
        htmlCode += '</tr>'; 
        return htmlCode;
    }

    function _createScoreChildBody(data) {
        console.log(data);
        
        let htmlCode = '';
        for (let i = 0; i < data.length; i++) {
            htmlCode += (data[i].username);
            // ...append
        }
        return htmlCode;
    }

    /* Exports */
    return {
        construct: construct,
        initialize: initialize,
        destroy: destroy,
        isAllowed: isAllowed
    };
})();
