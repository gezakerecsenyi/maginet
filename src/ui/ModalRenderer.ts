export default class ModalRenderer {
    container: HTMLElement | null = null;

    constructor(contents: HTMLElement, footerOptions: [string, () => boolean][] = []) {
        const container = document.createElement('div');
        container.className = 'modal-container';

        const body = document.createElement('div');
        body.className = 'modal-body';

        const contentsContainer = document.createElement('div');
        contentsContainer.className = 'modal-contents';
        contentsContainer.replaceChildren(contents);

        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.replaceChildren(
            ...footerOptions.map(option => {
                const button = document.createElement('button');
                button.innerText = option[0];
                button.addEventListener('click', () => {
                    const res = option[1]();
                    if (res) {
                        this.close();
                    }
                });

                return button;
            }),
        );

        body.replaceChildren(contentsContainer, footer);
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