import Maginet from '../Maginet';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { DefaultParameterId } from '../types';

export default class SpreadRenderer {
    private parent: HTMLElement;
    private readonly maginet: Maginet;
    private container: HTMLElement | null = null;
    private isPanning: boolean = false;
    private ctrlPressed: boolean = false;
    private selectionBox: HTMLDivElement | null = null;
    private isDraggingSelected: boolean = false;

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

    private _selectedElement: HTMLElement | null = null;

    get selectedElement() {
        return this._selectedElement;
    }
    private _selectedInstance: ComponentInstanceFactory | null = null;

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

    set selectedElement(element: HTMLElement | null) {
        if (this._selectedElement) {
            this._selectedElement.classList.remove('selected');
        }

        if (this.container && this.selectionBox) {
            if (element) {
                this._selectedElement = element;
                this._selectedElement.classList.add('selected');

                const elementRect = element.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();

                this.selectionBox.style.top = `${(elementRect.top - containerRect.top) / this.zoom}px`;
                this.selectionBox.style.left = `${(elementRect.left - containerRect.left) / this.zoom}px`;
                this.selectionBox.style.width = `${elementRect.width / this.zoom}px`;
                this.selectionBox.style.height = `${elementRect.height / this.zoom}px`;
                this.selectionBox.style.display = 'block';
            } else {
                this.selectionBox.style.display = 'none';
            }
        } else {
            this.renderCurrentSpread();
            this.updateView();
            this.selectedElement = element;
        }

        this.updateView();
    }

    get selectedInstance() {
        return this._selectedInstance;
    }

    set selectedInstance(value: ComponentInstanceFactory | null) {
        this._selectedInstance = value;
        this.updateView();
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

        if (event.button === 0) {
            if (event.target === this.selectedElement || event.target === this.selectionBox) {
                this.isDraggingSelected = true;
            }
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = false;
        }

        if (event.button === 0) {
            if (event.target === this.selectedElement || event.target === this.selectionBox) {
                this.isDraggingSelected = false;
            }
        }
    }

    handleMouseLeave(event: MouseEvent) {
        this.isPanning = false;
        this.isDraggingSelected = false;
    }

    handleMouseMove(event: MouseEvent) {
        if (this.isPanning) {
            this.x += event.movementX;
            this.y += event.movementY;
        }

        if (this.isDraggingSelected && this.selectedInstance) {
            console.log('dragging!');
            event.preventDefault();
            const xParameter = this
                .selectedInstance
                .parameterMapping
                .find(e => e.parameterId === DefaultParameterId.X);

            if (xParameter?.tiedTo === null) {
                this.selectedInstance.parameterMapping = this
                    .selectedInstance
                    .parameterMapping
                    .map(e => e.parameterId === DefaultParameterId.X ?
                        {
                            ...e,
                            value: e.value as number + event.movementX,
                        } :
                        e,
                    );
            }

            const yParameter = this
                .selectedInstance
                .parameterMapping
                .find(e => e.parameterId === DefaultParameterId.Y);

            if (yParameter?.tiedTo === null) {
                this.selectedInstance.parameterMapping = this
                    .selectedInstance
                    .parameterMapping
                    .map(e => e.parameterId === DefaultParameterId.Y ?
                        {
                            ...e,
                            value: e.value as number + event.movementY,
                        } :
                        e,
                    );
            }
        }
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

        const spread = this
            .maginet
            .magazine
            .spreads
            .find(e => e.id === this.maginet.currentSpreadId)!
            .render(this.maginet);

        const selectionBox = document.createElement('div');
        selectionBox.className = 'selection-box hidden';
        this.selectionBox = selectionBox;

        container.replaceChildren(spread, selectionBox);

        this.parent.replaceChildren(container);
        this.container = container;

        this.updateView();
    }

    select(element: HTMLElement, instance: ComponentInstanceFactory) {
        this.selectedElement = element;
        this.selectedInstance = instance;
    }

    deselect() {
        this.selectedElement = null;
        this.selectedInstance = null;
    }
}