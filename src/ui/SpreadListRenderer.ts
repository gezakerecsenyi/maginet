import Maginet from '../Maginet';

export default class SpreadListRenderer {
    private container: HTMLElement;
    private maginet: Maginet;

    constructor(container: HTMLElement, magazine: Maginet) {
        this.container = container;
        this.maginet = magazine;
    }

    updatePreviews() {
        const scaleFactor = 0.8;
        const totalWidth = this.container.getBoundingClientRect().width;
        const transformFactor = `scale(${totalWidth * scaleFactor / (420 * this.maginet.deviceScale)})`;

        this.container.replaceChildren(
            ...this
                .maginet
                .magazine
                .spreads
                .map((e, i) => {
                    const element = document.createElement('div');
                    element.className = 'spread-item';

                    const preview = document.createElement('div');
                    preview.className = 'spread-preview';
                    preview.style.left = `${totalWidth * (1 - scaleFactor) / 2}px`;
                    preview.style.top = `${totalWidth * (297 / 420) * (1 - scaleFactor) / 2}px`;
                    const previewContents = e.render(this.maginet.magazine);
                    previewContents.style.transform = transformFactor;
                    preview.replaceChildren(previewContents);

                    const label = document.createElement('p');
                    label.innerText = `Spread ${i + 1}`;

                    element.replaceChildren(preview, label);

                    element.onclick = () => {
                        this.maginet.currentSpreadId = e.id;
                    }

                    return element;
                }),
        );
    }
}