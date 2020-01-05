const GenericUiHandler = (function () {
    /* DECLARATIONS */


    /* External functions */
    function getAttribute(source, name) {
        if (!source) return undefined;
        if (!source.attr(name)) return undefined;
        return source.attr(name);
    }

    function getHrefDestination(source) {
        const href = getAttribute(source, 'href');
        if (!href) return undefined;

        const destination = href.replace('#', '');
        return destination;
    }

    /* Exports */
    return {
        getAttribute: getAttribute,
        getHrefDestination: getHrefDestination,
    };
})();
