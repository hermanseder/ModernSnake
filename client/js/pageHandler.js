class PageHandler {

    constructor(mainContent, mainTitle) {
        this.currentClass = undefined;
        this.mainContent = mainContent;
        this.mainTitle = mainTitle;
    }

    updatePath(id) {
        switch (id) {
            case 'home':
                this.loadPath(id, 'home', new PageHome()).then();
                break;
            case 'game':
                this.loadPath(id, 'game', new PageGame()).then();
                break;
            case 'score':
                this.loadPath(id, 'score', new PageScore()).then();
                break;
            case 'levels':
                this.loadPath(id, 'levels', new PageLevels()).then();
                break;
            default:
                console.error(`Invalid path given: '${id}'`);
        }
    }

    async loadPath(title, dest, newClass) {
        if (this.currentClass !== undefined) {
            this.currentClass.destroy();
        }

        await this.mainContent.empty();
        await this.mainContent.load(`pages/${dest}.html`);

        this.mainTitle.text(title);
        this.currentClass = newClass;
        this.currentClass.initialize();
    }

}
