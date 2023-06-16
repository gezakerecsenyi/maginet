import RenderContext from '../lib/utils/RenderContext';
import Maginet from '../Maginet';

export default class SpreadListRenderer {
    private container: HTMLElement;
    private readonly maginet: Maginet;

    constructor(container: HTMLElement, magazine: Maginet) {
        this.container = container;
        this.maginet = magazine;
    }

    updatePreviews() {
        const scaleFactor = 0.8;
        const totalWidth = this.container.getBoundingClientRect().width;
        const transformFactor = `scale(${totalWidth * scaleFactor / (420 * this.maginet.pxInMM)})`;

        this.container.replaceChildren(
            ...this
                .maginet
                .magazine
                .spreads
                .map((spread, i) => {
                    const element = document.createElement('div');
                    element.className = 'spread-item';

                    const preview = document.createElement('div');
                    preview.className = 'spread-preview';
                    preview.style.left = `${totalWidth * (1 - scaleFactor) / 2}px`;
                    preview.style.top = `${totalWidth * (297 / 420) * (1 - scaleFactor) / 2}px`;
                    const previewContents = spread.render(new RenderContext(this.maginet, false));
                    previewContents.style.transform = transformFactor;
                    preview.replaceChildren(previewContents);

                    const label = document.createElement('p');
                    label.innerText = `Spread ${i + 1}`;

                    element.replaceChildren(preview, label);

                    element.onclick = () => {
                        this.maginet.currentSpreadId = spread.id;
                    }

                    return element;
                }),
        );
    }
}