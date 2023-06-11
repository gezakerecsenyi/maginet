export default class ModalRenderer {
    container: HTMLElement | null = null;

    constructor(contents: HTMLElement) {
        const container = document.createElement('div');
        container.className = 'modal-container';

        const body = document.createElement('div');
        body.className = 'modal-body';

        body.replaceChildren(contents);
        container.replaceChildren(body);

        this.container = container;

        document.body.appendChild(this.container);
    }

    close() {
        if (this.container) {
            document.body.removeChild(this.container);
        }
    }
}