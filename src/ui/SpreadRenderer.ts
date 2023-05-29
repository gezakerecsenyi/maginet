import Maginet from '../Maginet';

export default class SpreadRenderer {
    private parent: HTMLElement;
    private maginet: Maginet;
    private container: HTMLElement;
    private isPanning: boolean;
    private ctrlPressed: boolean;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;

        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        this.parent.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.parent.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.parent.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.parent.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.parent.addEventListener('wheel', this.handleScrollWheel.bind(this));
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Control') {
            event.preventDefault();
            this.ctrlPressed = true;
        }
    }

    handleKeyUp(event: KeyboardEvent) {
        if (event.key === 'Control') {
            this.ctrlPressed = false;
        }
    }

    handleScrollWheel(event: WheelEvent) {
        if ((this.isPanning || this.ctrlPressed) && event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
            event.preventDefault();
            this.zoom -= event.deltaY / 100 / 50;
        }
    }

    handleMouseDown(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = true;
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = false;
        }
    }

    handleMouseLeave(event: MouseEvent) {
        this.isPanning = false;
    }

    handleMouseMove(event: MouseEvent) {
        if (this.isPanning) {
            this.x += event.movementX;
            this.y += event.movementY;
        }
    }

    private _zoom: number = 1;

    get zoom(): number {
        return this._zoom;
    }

    set zoom(value: number) {
        this._zoom = Math.max(0.1, value);
        this.updateView();
    }

    private _x: number = 0;

    get x(): number {
        return this._x * this.zoom;
    }

    set x(value: number) {
        this._x = value / this.zoom;
        this.updateView();
    }

    private _y: number = 0;

    get y(): number {
        return this._y * this.zoom;
    }

    set y(value: number) {
        this._y = value / this.zoom;
        this.updateView();
    }

    updateView() {
        if (this.container) {
            this.container.style.scale = this.zoom.toString();
            this.container.style.top = `${this.y}px`;
            this.container.style.left = `${this.x}px`;
        } else {
            this.renderCurrentSpread();
            this.updateView();
        }
    }

    zoomToFit() {
        if (this.container) {
            this.zoom = 1;

            const paddingRatio = 0.95;
            const currentSize = this.container.getBoundingClientRect();
            const availableSize = this.parent.getBoundingClientRect();
            const widthRatio = (availableSize.width * paddingRatio) / currentSize.width;
            const heightRatio = (availableSize.height * paddingRatio) / currentSize.height;

            const newZoom = Math.min(widthRatio, heightRatio);

            const newHeight = currentSize.height * newZoom;
            const newWidth = currentSize.width * newZoom;

            this.y = (availableSize.height - newHeight) / (2 * newZoom);
            this.x = (availableSize.width - newWidth) / (2 * newZoom);
            this.zoom = newZoom;
        } else {
            this.renderCurrentSpread();
            this.zoomToFit();
        }
    }

    renderCurrentSpread() {
        const container = document.createElement('div');
        container.className = 'preview-motion-container';

        container.replaceChildren(
            this
                .maginet
                .magazine
                .spreads
                .find(e => e.id === this.maginet.currentSpreadId)!
                .render(this.maginet.magazine),
        );

        this.parent.replaceChildren(container);
        this.container = container;
    }
}