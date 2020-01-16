const ContentHandler = (function () {
    /* DECLARATIONS */
    let sidebar;
    let sidebarElements;
    let sidebarToggle;

    let usermenu;
    let usermenuToggle;

    let mainTitle;
    let mainContent;

    /* Init */
    function initialize(socket) {
        mainTitle = $('#main-title');
        mainContent = $('#main-content');

        sidebar = $('#sidebar-menu');
        sidebarElements = $('#sidebar-menu li.sidebar-element');
        sidebarToggle = $('#sidebar-toggle');

        usermenu = $('#usermenu');
        usermenuToggle = $('#usermenu-toggle')

        PageHandler.initialize(socket, mainContent, mainTitle);

        initializeSidebar();
        initializeUserMenu();
    }

    /* SIDEBAR */

    function initializeSidebar() {
        sidebarToggle.click(sidebarToggleClick);
        sidebarElements.click(menuElementClick);
        setDefaultLocation();
    }

    function setDefaultLocation() {
        setMenuItem(sidebarElements[0]);
    }

    function sidebarToggleClick() {
        if (_isSidebarOpen()) {
            sidebar.removeClass('sidebar-open');
        } else {
            sidebar.addClass('sidebar-open');
        }
    }

    function closeSidebar() {
        if (_isSidebarOpen()) {
            sidebar.removeClass('sidebar-open');
        }
    }

    function openSidebar() {
        if (!_isSidebarOpen()) {
            sidebar.addClass('sidebar-open');
        }
    }

    function menuElementClick(source) {
        setMenuItem(source.delegateTarget);
    }

    function setMenuItem(source) {
        const link = $(source).find('a');
        if (link.length <= 0) return;

        const element = $(link);
        const destination = GenericUiHandler.getHrefDestination(element);

        if (PageHandler.updatePath(destination)) {
            updateSelectedMenu(source);
        }
    }

    function updateSelectedMenu(source) {
        sidebarElements.each(function () {
                if ($(this).length > 0 && source === $(this)[0]) {
                    $(this).addClass('sidebar-active');
                } else {
                    $(this).removeClass('sidebar-active');
                }
            }
        );
    }

    function _isSidebarOpen() {
        return sidebar.hasClass('sidebar-open');
    }

    /* USERMENU */

    function initializeUserMenu() {
        usermenuToggle.click(usermenuToggleClick);
    }

    function usermenuToggleClick() {
        if (_isUsermenuOpen()) {
            closeUsermenu();
        } else {
            openUsermenu();
        }
    }

    function openUsermenu() {
        if (!_isUsermenuOpen()) {
            closeSidebar();
            usermenu.addClass('usermenu-open');
        }
    }

    function closeUsermenu() {
        if (_isUsermenuOpen()) {
            usermenu.removeClass('usermenu-open');
            openSidebar();
        }
    }

    function _isUsermenuOpen() {
        return usermenu.hasClass('usermenu-open');
    }

    /* Exports */
    return {
        initialize: initialize,
        closeUsermenu: closeUsermenu,
        openUsermenu: openUsermenu,
        setDefaultLocation: setDefaultLocation,
        closeSidebar: closeSidebar,
    };
})();
