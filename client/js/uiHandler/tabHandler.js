const TabHandler = (function () {
    /* DECLARATIONS */


    /* External functions */
    function initialize(elementId, sourcePath, initCallback) {
        const tabContainer = $('#' + elementId);
        const tabHeading = $('.generic-tabs-heading', tabContainer);
        const tabHeadingElements = $('li.generic-tab', tabHeading);
        const tabContent = $('.generic-tabs-content', tabContainer);
        const parameter = {
            sourcePath: sourcePath,
            callback: initCallback
        };

        _initializeStartSelection(tabContent, tabHeadingElements, parameter);
        _addClickListener(tabContent, tabHeadingElements, parameter);
    }

    /* Internal functions */
    function _initializeStartSelection(tabContent, tabHeadings, parameter) {
        _tabClicked(tabContent, tabHeadings, tabHeadings.first()[0], parameter);
    }

    function _addClickListener(tabContent, tabHeadings, parameter) {
        tabHeadings.on('click', function (source) {
            _tabClicked(tabContent, tabHeadings, source.delegateTarget, parameter);
        });
    }

    function _tabClicked(tabContent, tabHeadings, source, parameter) {
        const sourceElement = $(source);
        if (sourceElement.hasClass('generic-tab-active')) return;
        tabHeadings.each(function () {
                if ($(this).length > 0 && source === $(this)[0]) {
                    $(this).addClass('generic-tab-active');
                } else {
                    $(this).removeClass('generic-tab-active');
                }
            }
        );

        const link = sourceElement.find('a');
        if (link.length <= 0) return;

        const element = $(link);
        if (parameter.callback) {
            parameter.dataCallback = _getDataCallback(element);
        }

        _updatePath(tabContent, GenericUiHandler.getHrefDestination(element), parameter);
    }

    function _getDataCallback(element) {
        return GenericUiHandler.getAttribute(element, 'data-callback');
    }

    function _updatePath(tabContent, destination, parameter) {
        const destinationEmpty = (destination === undefined || destination === '');
        const path = destinationEmpty ? parameter.sourcePath : (parameter.sourcePath + destination + '.html');

        tabContent.empty();
        tabContent.hide();
        tabContent.load(path, undefined, function () {
            if (parameter.callback) {
                parameter.callback(parameter.dataCallback);
            }
            tabContent.fadeIn('fast');
        });
    }

    /* Exports */
    return {
        initialize: initialize,
    };
})();
