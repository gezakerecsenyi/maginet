import { v4 } from 'uuid';
import areBBsIntersecting, { BasicDOMRect } from '../lib/utils/areBBsIntersecting';
import Size from '../lib/utils/Size';
import Maginet from '../Maginet';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import Renderer from '../render/Renderer';
import { DefaultParameterId, SizeUnit, SpecialClasses, ToolType } from '../types';
import ToolbarRenderer from './ToolbarRenderer';

export enum EditMode {
    Reference = 'reference',
    Value = 'value',
    Lock = 'lock',
}

interface MouseData {
    x: number;
    y: number;
}

export default class SpreadRenderer {
    private parent: HTMLElement;
    private readonly maginet: Maginet;
    private container: HTMLElement | null = null;
    private isPanning: boolean = false;
    private ctrlPressed: boolean = false;
    private selectedElementIndicator: HTMLDivElement | null = null;
    private currentSpreadRender: HTMLElement | null = null;
    private toolbarRenderer: ToolbarRenderer;
    private selectionStart: MouseData | null = null;
    private dragSelectionBox: HTMLDivElement | null = null;
    private topLevelInstances: [string, ComponentInstanceFactory][] = [];
    private newElement: ComponentInstanceFactory<any> | null = null;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
        this.toolbarRenderer = new ToolbarRenderer(parent, maginet);

        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        this.parent.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.parent.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.parent.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        this.parent.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.parent.addEventListener('wheel', this.handleScrollWheel.bind(this));

        this.selectedTool = ToolType.Cursor;
        this.toolbarRenderer.selectedToolCategory = ToolType.Cursor;
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
            this.newElement = null;
            this.dragSelectionBox?.classList.add('hidden');
            this.dragSelectionBox?.setAttribute('style', '');
        }
    }

    private _selectedTool!: ToolType;

    get selectedTool(): ToolType {
        return this._selectedTool;
    }

    set selectedTool(value: ToolType) {
        if (value !== ToolType.Cursor) {
            this.selectedInstances = null;
        }

        this._selectedTool = value;
    }

    private _isDraggingSelectedItem: boolean = false;

    get isDraggingSelectedItem(): boolean {
        return this._isDraggingSelectedItem;
    }

    set isDraggingSelectedItem(value: boolean) {
        if ((this.isDraggingSelectedItem && !value) || (!this.isDraggingSelectedItem && value)) {
            this.maginet.captureHistorySnapshot();
        }
        this._isDraggingSelectedItem = value;
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

    get selectedElements() {
        if (this.selectedInstances) {
            return this.selectedInstances.map(e => document.getElementById(e.getInstanceId())!);
        } else {
            return null;
        }
    }

    private _selectedInstances: ComponentInstanceFactory[] | null = null;

    get selectedInstances() {
        return this._selectedInstances;
    }

    set selectedInstances(value: ComponentInstanceFactory[] | null) {
        if (this.selectedElements) {
            this.selectedElements.map(e => e.classList.remove('selected'));
        }

        this._selectedInstances = value?.length ? value.filter(
            (q, i) => value
                .findIndex(t => t.id === q.id) === i,
        ) : null;

        if (this.selectedElements) {
            this.selectedElements.map(e => e.classList.add('selected'));
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

    get currentSpread() {
        return this
            .maginet
            .magazine
            .spreads
            .find(e => e.id === this.maginet.currentSpreadId)!;
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

    toScaledDistance(data: { x: number, y: number }) {
        return {
            x: (data.x - this.container!.getBoundingClientRect().left) / this.zoom,
            y: (data.y - this.container!.getBoundingClientRect().top) / this.zoom,
        };
    }

    normalizeDOMRect(rect: BasicDOMRect): BasicDOMRect {
        const scaledTopLeft = this.toScaledDistance({
            x: rect.left,
            y: rect.top,
        });
        const scaledBottomRight = this.toScaledDistance({
            x: rect.right,
            y: rect.bottom,
        });

        return {
            left: scaledTopLeft.x,
            right: scaledBottomRight.x,
            top: scaledTopLeft.y,
            bottom: scaledBottomRight.y,
            height: scaledBottomRight.y - scaledTopLeft.y,
            width: scaledBottomRight.x - scaledTopLeft.x,
        };
    }

    handleMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (target?.classList.contains(SpecialClasses.NoSelect)) {
            return;
        }

        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = true;
        }

        if (event.button === 0) {
            if (target && target.classList.contains(SpecialClasses.SelectionBoxComponent) && this.selectedTool === ToolType.Cursor) {
                this.isDraggingSelectedItem = true;
            } else {
                const dragInsertData = this.selectedTool !== ToolType.Cursor && this
                    .toolbarRenderer
                    .currentToolData
                    .insertableByDrag;
                if (
                    this.container && (
                        (
                            this.selectedTool === ToolType.Cursor && (
                                target?.classList.contains(SpecialClasses.TopLevelSpread) ||
                                target?.getAttribute('id') === 'preview'
                            )
                        ) || dragInsertData
                    )
                ) {
                    this.selectionStart = this.toScaledDistance({
                        x: event.clientX,
                        y: event.clientY,
                    });

                    if (dragInsertData) {
                        this.newElement = this
                            .currentSpread
                            .addChild(
                                new ComponentInstanceFactory(
                                    dragInsertData.component,
                                    [
                                        {
                                            id: DefaultParameterId.X,
                                            isReference: false,
                                            value: this.selectionStart.x,
                                        },
                                        {
                                            id: DefaultParameterId.Y,
                                            isReference: false,
                                            value: this.selectionStart.y,
                                        },
                                        ...(
                                            (dragInsertData.bindHeightTo || [])
                                                .map(e => ({
                                                    id: e,
                                                    isReference: false,
                                                    value: new Size(0, SizeUnit.PX),
                                                }))
                                        ),
                                        ...(
                                            (dragInsertData.bindWidthTo || [])
                                                .map(e => ({
                                                    id: e,
                                                    isReference: false,
                                                    value: new Size(0, SizeUnit.PX),
                                                }))
                                        ),
                                    ],
                                    v4(),
                                ),
                            );

                        this.maginet.rerender();
                    }

                    if (!this.ctrlPressed) {
                        this.selectedInstances = null;
                    }

                    this.isDraggingWorkspace = true;
                }
            }
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 1) {
            event.preventDefault();
            this.isPanning = false;
        }

        this.isDraggingWorkspace = false;
        this.isDraggingSelectedItem = false;
        this.newElement = null;
    }

    handleMouseLeave(event: MouseEvent) {
        this.isPanning = false;
        this.isDraggingSelectedItem = false;
    }

    updateSelectionMarker(data: MouseData) {
        if (this.dragSelectionBox && this.selectionStart) {
            const mappedCoords = this.toScaledDistance(data);

            const selectionBoundingBox: BasicDOMRect = {
                left: Math.min(this.selectionStart.x, mappedCoords.x),
                top: Math.min(this.selectionStart.y, mappedCoords.y),
                width: Math.abs(mappedCoords.x - this.selectionStart.x),
                height: Math.abs(mappedCoords.y - this.selectionStart.y),
                right: 0,
                bottom: 0,
            };
            selectionBoundingBox.right = selectionBoundingBox.left + selectionBoundingBox.width;
            selectionBoundingBox.bottom = selectionBoundingBox.top + selectionBoundingBox.height;

            if (this.newElement) {
                for (const param of (this.toolbarRenderer.currentToolData.insertableByDrag!.bindWidthTo ?? [])) {
                    this.newElement.respectfullyUpdateParameter(
                        this.maginet,
                        param,
                        (currentValue) => new Size(
                            selectionBoundingBox.width,
                            SizeUnit.PX,
                        ).toType((currentValue as Size).unit),
                    );
                }

                for (const param of (this.toolbarRenderer.currentToolData.insertableByDrag!.bindHeightTo ?? [])) {
                    this.newElement.respectfullyUpdateParameter(
                        this.maginet,
                        param,
                        (currentValue) => new Size(
                            selectionBoundingBox.height,
                            SizeUnit.PX,
                        ).toType((currentValue as Size).unit),
                    );
                }

                this.maginet.rerender();
            } else if (this.isDraggingWorkspace) {
                this.dragSelectionBox.style.left = `${selectionBoundingBox.left}px`;
                this.dragSelectionBox.style.top = `${selectionBoundingBox.top}px`;
                this.dragSelectionBox.style.width = `${selectionBoundingBox.width}px`;
                this.dragSelectionBox.style.height = `${selectionBoundingBox.height}px`;

                for (const instance of this.topLevelInstances) {
                    const clientRect = document.getElementById(instance[0])?.getBoundingClientRect();

                    if (clientRect) {
                        if (areBBsIntersecting(this.normalizeDOMRect(clientRect), selectionBoundingBox)) {
                            this.selectedInstances = (this.selectedInstances || []).concat(instance[1]);
                        } else if (!this.ctrlPressed && this.selectedInstances) {
                            this.selectedInstances = this
                                .selectedInstances
                                .filter(e => e.id !== instance[1].id);
                        }
                    } else {
                        this.renderCurrentSpread();
                        break;
                    }
                }
            }
        }
    }

    handleMouseMove(event: MouseEvent) {
        if (this.isPanning) {
            this.x += event.movementX;
            this.y += event.movementY;
        }

        this.updateSelectionMarker(event);

        if (this.isDraggingSelectedItem && this.selectedInstances) {
            event.stopPropagation();
            event.preventDefault();

            const parameterDescriptors = [
                {
                    id: DefaultParameterId.X,
                    offset: event.movementX / this.zoom,
                },
                {
                    id: DefaultParameterId.Y,
                    offset: event.movementY / this.zoom,
                },
            ];
            const alreadyUpdated: string[][] = [];
            for (const instance of this.selectedInstances) {
                for (const parameterDescriptor of parameterDescriptors) {
                    const addend = new Size(parameterDescriptor.offset, SizeUnit.PX);

                    instance.respectfullyUpdateParameter(
                        this.maginet,
                        parameterDescriptor.id,
                        (currentValue, foundAt) => {
                            const newValue = (currentValue as Size).add(addend);
                            if (foundAt) {
                                if (
                                    !alreadyUpdated.some(
                                        a => a.every((e, i) => e === foundAt[i]),
                                    )
                                ) {
                                    alreadyUpdated.push(foundAt);
                                    return newValue;
                                }

                                return currentValue as Size;
                            }

                            return newValue;
                        },
                    );
                }
            }

            this.maginet.rerender(this.selectedInstances);
        }
    }

    updateView() {
        if (this.container && this.selectedElementIndicator) {
            this.container.style.scale = this.zoom.toString();
            this.container.style.top = `${this.y}px`;
            this.container.style.left = `${this.x}px`;

            if (this.selectedElements) {
                const boundingRects = this.selectedElements.map(e => e.getBoundingClientRect());

                const elementsRect = {
                    left: Math.min(...boundingRects.map(e => e.left)),
                    right: Math.max(...boundingRects.map(e => e.right)),
                    top: Math.min(...boundingRects.map(e => e.top)),
                    bottom: Math.max(...boundingRects.map(e => e.bottom)),
                };

                const containerRect = this.container.getBoundingClientRect();

                this.selectedElementIndicator.style.top = `${
                    (elementsRect.top - containerRect.top) / this.zoom
                }px`;
                this.selectedElementIndicator.style.left = `${
                    (elementsRect.left - containerRect.left) / this.zoom
                }px`;
                this.selectedElementIndicator.style.width = `${
                    (elementsRect.right - elementsRect.left) / this.zoom
                }px`;
                this.selectedElementIndicator.style.height = `${
                    (elementsRect.bottom - elementsRect.top) / this.zoom
                }px`;
                this.selectedElementIndicator.style.display = 'block';
            } else {
                this.selectedElementIndicator.style.display = 'none';
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

        const renderedSpread = this.currentSpread.render(new Renderer(this.maginet));
        renderedSpread.classList.add(SpecialClasses.TopLevelSpread);

        this.topLevelInstances = [];
        [
            DefaultParameterId.Children,
            DefaultParameterId.Contents,
        ].forEach(source => {
            this.topLevelInstances.push(
                ...((
                    this.currentSpread
                        .parameterValues
                        .find(e => e.id === source)
                        ?.value as ComponentInstanceFactory[] | undefined
                )?.map(e => [
                    e.getInstanceId(),
                    e,
                ] as [string, ComponentInstanceFactory]) || []),
            );
        });

        if (this.currentSpreadRender) {
            this.currentSpreadRender.replaceWith(renderedSpread);
        } else {
            this.container.appendChild(renderedSpread);
        }
        this.currentSpreadRender = renderedSpread;

        if (!this.selectedElementIndicator) {
            const selectionBox = document.createElement('div');
            selectionBox.className = 'selection-box';

            [
                'l',
                'r',
                't',
                'b',
            ].forEach(side => {
                const sideComponent = document.createElement('div');
                sideComponent.className = `${SpecialClasses.SelectionBoxComponent} selection-side-${side}`;
                selectionBox.appendChild(sideComponent);
            });

            this.selectedElementIndicator = selectionBox;
            this.container.appendChild(this.selectedElementIndicator);
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

    selectOrReplace(instances: ComponentInstanceFactory[]) {
        if (this.selectedTool === ToolType.Cursor) {
            if (this.selectedInstances && this.ctrlPressed) {
                this.selectedInstances = this.selectedInstances.concat(...instances);
                return true;
            } else {
                this.selectedInstances = instances;
                return false;
            }
        }
    }

    deselectAll() {
        this.selectedInstances = null;
    }
}