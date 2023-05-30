import getInstanceId from '../lib/utils/getInstanceId';
import Size from '../lib/utils/Size';
import updateFromLocation from '../lib/utils/updateFromLocation';
import Maginet from '../Maginet';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import Renderer from '../render/Renderer';
import { DefaultParameterId, SizeUnit } from '../types';
import ToolbarRenderer, { OptionType } from './ToolbarRenderer';

export enum EditMode {
    Reference = 'reference',
    Value = 'value',
    Lock = 'lock',
}

interface MouseData {
    clientX: number;
    clientY: number;
}

export default class SpreadRenderer {
    private parent: HTMLElement;
    private readonly maginet: Maginet;
    private container: HTMLElement | null = null;
    private isPanning: boolean = false;
    private ctrlPressed: boolean = false;
    private selectionBox: HTMLDivElement | null = null;
    private currentSpreadRender: HTMLElement | null = null;
    private toolbarRenderer: ToolbarRenderer;
    private selectionStart: MouseData | null = null;
    private dragSelectionBox: HTMLDivElement | null = null;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
        this.toolbarRenderer = new ToolbarRenderer(parent, maginet);

        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        this.parent.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.parent.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.parent.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.parent.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.parent.addEventListener('wheel', this.handleScrollWheel.bind(this));
    }

    private _isDraggingWorkspace: boolean = false;

    get isDraggingWorkspace(): boolean {
        return this._isDraggingWorkspace;
    }

    set isDraggingWorkspace(value: boolean) {
        this._isDraggingWorkspace = value;

        if (value) {
            this.dragSelectionBox?.classList.remove('hidden');
        } else {
            this.dragSelectionBox?.classList.add('hidden');
            this.dragSelectionBox?.setAttribute('style', '');
        }
    }

    private _selectedTool!: OptionType;

    get selectedTool(): OptionType {
        return this._selectedTool;
    }

    set selectedTool(value: OptionType) {
        document.getElementById(`tool-${this.selectedTool}`)?.classList.remove('active');
        document.getElementById(`tool-${value}`)?.classList.add('active');

        this._selectedTool = value;
    }

    private _isDraggingSelected: boolean = false;

    get isDraggingSelected(): boolean {
        return this._isDraggingSelected;
    }

    set isDraggingSelected(value: boolean) {
        if ((this.isDraggingSelected && !value) || (!this.isDraggingSelected && value)) {
            this.maginet.captureHistorySnapshot();
        }
        this._isDraggingSelected = value;
    }

    private _editMode = EditMode.Value;

    get editMode() {
        return this._editMode;
    }

    set editMode(value: EditMode) {
        this.parent?.classList.remove(`editing-by-${this.editMode}`);
        this._editMode = value;
        this.parent?.classList.add(`editing-by-${value}`);
    }

    get selectedElement() {
        if (this.selectedInstance) {
            return document.getElementById(getInstanceId(this.selectedInstance));
        } else {
            return null;
        }
    }

    private _selectedInstance: ComponentInstanceFactory | null = null;

    get selectedInstance() {
        return this._selectedInstance;
    }

    set selectedInstance(value: ComponentInstanceFactory | null) {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }

        this._selectedInstance = value;

        if (this.selectedElement) {
            this.selectedElement.classList.add('selected');
        }

        this.updateView();
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

    handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'z' && event.ctrlKey) {
            event.preventDefault();
            this.maginet.undo();
            return;
        }

        if (event.key === 'y' && event.ctrlKey) {
            event.preventDefault();
            this.maginet.redo();
            return;
        }

        if (event.key === 'Control') {
            event.preventDefault();
            this.ctrlPressed = true;
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            this.editMode = [
                EditMode.Reference,
                EditMode.Lock,
                EditMode.Value,
            ][
                [
                    EditMode.Value,
                    EditMode.Reference,
                    EditMode.Lock,
                ].indexOf(this.editMode)
                ];
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

    toScaledDistance(data: MouseData) {
        return {
            clientX: (data.clientX - this.container!.getBoundingClientRect().left) / this.zoom,
            clientY: (data.clientY - this.container!.getBoundingClientRect().top) / this.zoom,
        };
    }

    handleMouseDown(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = true;
        }

        if (event.button === 0) {
            if (event.target && (event.target as HTMLElement).classList.contains('selection-box-component')) {
                this.isDraggingSelected = true;
            } else if (this.container) {
                this.selectedInstance = null;
                this.isDraggingWorkspace = true;
                this.selectionStart = this.toScaledDistance(event);

                // this.updateSelectionMarker(this.selectionStart);
            }
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = false;
        }

        this.isDraggingWorkspace = false;
        this.isDraggingSelected = false;
    }

    handleMouseLeave(event: MouseEvent) {
        this.isPanning = false;
        this.isDraggingSelected = false;
    }

    updateSelectionMarker(data: MouseData) {
        if (this.isDraggingWorkspace && this.dragSelectionBox && this.selectionStart) {
            const mappedCoords = this.toScaledDistance(data);

            this.dragSelectionBox.style.left = `${Math.min(this.selectionStart.clientX, mappedCoords.clientX)}px`;
            this.dragSelectionBox.style.width = `${Math.abs(mappedCoords.clientX - this.selectionStart.clientX)}px`;
            this.dragSelectionBox.style.top = `${Math.min(this.selectionStart.clientY, mappedCoords.clientY)}px`;
            this.dragSelectionBox.style.height = `${Math.abs(mappedCoords.clientY - this.selectionStart.clientY)}px`;
        }
    }

    handleMouseMove(event: MouseEvent) {
        if (this.isPanning) {
            this.x += event.movementX;
            this.y += event.movementY;
        }

        this.updateSelectionMarker(event);

        if (this.isDraggingSelected && this.selectedInstance) {
            event.preventDefault();

            const parameterDescriptors = [
                {
                    id: DefaultParameterId.X,
                    offset: event.movementX,
                },
                {
                    id: DefaultParameterId.Y,
                    offset: event.movementY,
                },
            ];
            for (const parameterDescriptor of parameterDescriptors) {
                const parameterHere = this
                    .selectedInstance
                    .parameterMapping
                    .find(e => e.id === parameterDescriptor.id);
                const addend = new Size(parameterDescriptor.offset / this.zoom, SizeUnit.PX);

                if (!parameterHere?.isReference) {
                    this
                        .selectedInstance
                        .parameterMapping
                        .updateById(
                            parameterDescriptor.id,
                            {
                                value: (parameterHere!.value as Size).add(addend),
                            },
                        );
                } else if (parameterHere) {
                    let [resolvedValue, resolvedValueLocation] = ComponentInstanceFactory.resolveParameterValue(
                        parameterHere.tiedTo!,
                        this.maginet.magazine.spreads,
                        this.maginet.magazine.components,
                        true,
                        null,
                    );

                    if (this.editMode === EditMode.Value) {
                        if (resolvedValue !== null) {
                            this
                                .selectedInstance
                                .parameterMapping
                                .updateById(
                                    parameterDescriptor.id,
                                    {
                                        value: (resolvedValue as Size).add(addend),
                                        isReference: false,
                                    },
                                );
                        }
                    } else if (this.editMode === EditMode.Reference) {
                        if (resolvedValueLocation.length) {
                            updateFromLocation(
                                this.maginet.magazine,
                                (resolvedValue as Size).add(addend),
                                resolvedValueLocation,
                            );
                        }
                    }
                }
            }

            this.maginet.update([this.selectedInstance]);
        }
    }

    updateView() {
        if (this.container && this.selectionBox) {
            this.container.style.scale = this.zoom.toString();
            this.container.style.top = `${this.y}px`;
            this.container.style.left = `${this.x}px`;

            if (this.selectedElement) {
                const elementRect = this.selectedElement.getBoundingClientRect();
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

    renderCurrentSpread(only?: ComponentInstanceFactory[]) {
        if (!this.container) {
            const container = document.createElement('div');
            container.className = 'preview-motion-container';

            this.container = container;
            this.parent.replaceChildren(this.container);
        }

        const spread = this
            .maginet
            .magazine
            .spreads
            .find(e => e.id === this.maginet.currentSpreadId)!
            .render(new Renderer(this.maginet));

        if (this.currentSpreadRender) {
            this.currentSpreadRender.replaceWith(spread);
        } else {
            this.container.appendChild(spread);
        }
        this.currentSpreadRender = spread;

        if (!this.selectionBox) {
            const selectionBox = document.createElement('div');
            selectionBox.className = 'selection-box';

            [
                'l',
                'r',
                't',
                'b',
            ].forEach(side => {
                const sideComponent = document.createElement('div');
                sideComponent.className = `selection-box-component selection-side-${side}`;
                selectionBox.appendChild(sideComponent);
            });

            this.selectionBox = selectionBox;
            this.container.appendChild(this.selectionBox);
        }

        if (!this.dragSelectionBox) {
            const dragSelectionBox = document.createElement('div');
            dragSelectionBox.className = 'drag-selection hidden';

            this.container.appendChild(dragSelectionBox);
            this.dragSelectionBox = dragSelectionBox;
        }

        this.toolbarRenderer.ensureIsRendered();
        this.updateView();
    }

    select(element: HTMLElement, instance: ComponentInstanceFactory) {
        this.selectedInstance = instance;
    }

    deselect() {
        this.selectedInstance = null;
    }
}