/* DECLARATIONS */
var sidebar;
var sidebarElements;
var sidebarToggle;

var usermenu;
var usermenuToggle;

var mainTitle;
var mainContent;

var pageHandler;

$(document).ready(function () {
    initialize();
});

function initialize() {
    mainTitle = $('#main-title');
    mainContent = $('#main-content');

    sidebar = $('#sidebar-menu');
    sidebarElements = $('#sidebar-menu li.sidebar-element');
    sidebarToggle = $('#sidebar-toggle');

    usermenu = $('#usermenu');
    usermenuToggle = $('#usermenu-toggle')

    pageHandler = new PageHandler(mainContent, mainTitle);

    initializeSidebar();
    initializeUserMenu();
}

/* SIDEBAR */

function initializeSidebar() {
    sidebarToggle.click(sidebarToggleClick);
    sidebarElements.click(menuElementClick);
    setMenuItem(sidebarElements[0]);
}

function sidebarToggleClick() {
    if (sidebar.width() <= 60) {
        sidebar.addClass('sidebar-open');
    } else {
        sidebar.removeClass('sidebar-open');
    }
}

function closeSidebar() {
    if (sidebar.width() > 60) {
        sidebar.removeClass('sidebar-open');
    }
}

function openSidebar() {
    if (sidebar.width() >= 60) {
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
    const destination = getMenuEntryDestination(element);

    pageHandler.updatePath(destination);
    updateSelectedMenu(source);
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

function getMenuEntryDestination(source) {
    if (!source) return '';
    if (!source.attr('href')) return '';

    const href = source.attr('href');
    if (!href) return '';

    const destination = href.replace('#', '');
    return destination;
}

/* USERMENU */

function initializeUserMenu() {
    usermenuToggle.click(usermenuToggleClick);
}

function usermenuToggleClick() {
    if (usermenu.width() <= 10) {
        closeSidebar();
        usermenu.addClass('usermenu-open');
    } else {
        usermenu.removeClass('usermenu-open');
        openSidebar();
    }
}
