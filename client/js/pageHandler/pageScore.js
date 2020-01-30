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
        _ioCommunication.emit(socketCommands.loadScore, LoginHandler.getAuth(), _loadScoreBoard);

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
    function _loadScoreBoard(data) {
        if(!data.success) {
            ErrorHandler.showErrorMessage(data.failure);
            return;
        }
        _updateScoreBoard(data.data);
    }

    function _updateScoreBoard(scoreData) {
        _parentScoreBox.empty();
        for (let i = 0; i < scoreData.length; i++) {
            _parentScoreBox.append(_createScoreBoardChild(scoreData[i]));
        } 
        if (scoreData.length == 0) {
            _parentScoreBox.append(_createEmptyScoreBoardChild()); 
        }
    }

    function _createEmptyScoreBoardChild() {
        let htmlCode = '';
        htmlCode = '<h3>No Statistics available</h3>' 
        return htmlCode; 
    }

    function _createScoreBoardChild(data) {
        let htmlCode = '';
        htmlCode += _createTableBegin();
        htmlCode += _createScoreChildHeader(data.name);
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
        htmlCode += '<th>Score</th>'; 
        htmlCode += '</tr>'; 
        return htmlCode;
    }

    function _createScoreChildBody(data) {
        let lastScore = 0; 
        let htmlCode = '';

        for (let i = 0; i < data.length; i++) {
            htmlCode += '<tr>';

            //same scores result to same rankings 
            if (lastScore == data[i].score) {
                htmlCode += '<td>  </td>';
            }
            else {
                htmlCode += '<td>' + (i + 1) + '.</td>';
            }             

            htmlCode += '<td>' + data[i].username + '</td>';
            htmlCode += '<td>' + data[i].score + '</td>';
            htmlCode += '</tr>';

            lastScore = data[i].score; 
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
