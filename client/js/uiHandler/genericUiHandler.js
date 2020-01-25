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

    function resetMaterialSelect(element) {
        element.find('input').val('');
        element.prop('selectedIndex', 0);
        element.formSelect();
    }

    function resetMaterialInput(element, value = '') {
        element.val(value);
        element.removeClass('valid');
        element.next().removeClass('active');
    }

    /* Exports */
    return {
        getAttribute: getAttribute,
        getHrefDestination: getHrefDestination,
        resetMaterialSelect: resetMaterialSelect,
        resetMaterialInput: resetMaterialInput,
    };
})();
