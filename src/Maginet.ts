import cloneDeep from 'lodash/cloneDeep';
import { Spread } from './lib/Spread';
import { TextSpan } from './lib/TextSpan';
import Size from './lib/utils/Size';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import { DefaultParameterId, HistoryState, Magazine, SizeUnit, SpecialClasses, ToolType } from './types';
import DataRenderer from './ui/DataRenderer';
import SpreadListRenderer from './ui/SpreadListRenderer';
import SpreadRenderer from './ui/SpreadRenderer';
import { PopulatedWindow } from './window';

export default class Maginet {
    public magazine: Magazine;
    public spreadRenderer: SpreadRenderer;
    public spreadListRenderer: SpreadListRenderer;
    public dataRenderer: DataRenderer;
    public pxInMM: number;
    public pxInPT: number;
    private history: HistoryState[] = [];

    constructor(
        spreadListContainer: HTMLElement,
        previewContainer: HTMLElement,
        dataContainer: HTMLElement,
        mmRuler: HTMLElement,
        ptRuler: HTMLElement,
    ) {
        this.spreadRenderer = new SpreadRenderer(previewContainer, this);
        this.spreadListRenderer = new SpreadListRenderer(spreadListContainer, this);
        this.dataRenderer = new DataRenderer(dataContainer, this);

        this.magazine = {
            spreads: [
                new ComponentInstance(
                    Spread,
                    [
                        {
                            id: DefaultParameterId.LayerDepth,
                            value: new Size(40, SizeUnit.MM),
                        },
                        {
                            id: DefaultParameterId.Children,
                            value: [
                                new ComponentInstanceFactory(
                                    TextSpan,
                                    [
                                        {
                                            id: 'text',
                                            value: 'Testing 123!',
                                            isReference: false,
                                        },
                                        {
                                            id: DefaultParameterId.X,
                                            tiedTo: {
                                                locationId: '0',
                                                id: DefaultParameterId.LayerDepth,
                                            },
                                            isReference: true,
                                        },
                                        {
                                            id: DefaultParameterId.Y,
                                            isReference: false,
                                            value: new Size(80, SizeUnit.MM),
                                        },
                                    ],
                                    'text0',
                                ),
                                new ComponentInstanceFactory(
                                    TextSpan,
                                    [
                                        {
                                            id: 'text',
                                            value: 'Test-2',
                                            isReference: false,
                                        },
                                        {
                                            id: DefaultParameterId.X,
                                            tiedTo: {
                                                locationId: '0',
                                                id: DefaultParameterId.LayerDepth,
                                            },
                                            isReference: true,
                                        },
                                        {
                                            id: DefaultParameterId.Y,
                                            isReference: false,
                                            value: new Size(100, SizeUnit.MM),
                                        },
                                    ],
                                    'text1',
                                ),
                                new ComponentInstanceFactory(
                                    TextSpan,
                                    [
                                        {
                                            id: 'text',
                                            value: 'Test-3',
                                            isReference: false,
                                        },
                                        {
                                            id: DefaultParameterId.X,
                                            tiedTo: {
                                                locationId: '0',
                                                id: DefaultParameterId.LayerDepth,
                                            },
                                            isReference: true,
                                        },
                                        {
                                            id: DefaultParameterId.Y,
                                            isReference: false,
                                            value: new Size(120, SizeUnit.MM),
                                        },
                                    ],
                                    'text2',
                                ),
                            ],
                        },
                    ],
                    '0',
                ),
            ],
            customComponents: [],
        };

        this.pxInMM = mmRuler.getBoundingClientRect().height / 100;
        this.pxInPT = ptRuler.getBoundingClientRect().height / 100;

        (window as PopulatedWindow).pxInMM = this.pxInMM;
        (window as PopulatedWindow).pxInPT = this.pxInPT;

        this.currentSpreadId = '0';

        this.captureHistorySnapshot();
    }

    private _historyPointer = -1;

    get historyPointer(): number {
        return this._historyPointer;
    }

    set historyPointer(value: number) {
        if (value >= 0 && value < this.history.length) {
            this._historyPointer = value;

            this.magazine = this.history[value];
            this.rerender();
        }
    }

    private _currentSpreadId!: string;

    get currentSpreadId() {
        return this._currentSpreadId;
    }

    set currentSpreadId(id: string) {
        this._currentSpreadId = id;
        this.rerender();

        this.spreadRenderer.zoomToFit();
        this.dataRenderer.renderList();
    }

    undo() {
        this.historyPointer--;
    }

    redo() {
        this.historyPointer++;
    }

    captureHistorySnapshot() {
        this.history = this.history.slice(0, this.historyPointer + 1).concat(cloneDeep(this.magazine));
        this._historyPointer++;

        if (this.history.length > 10) {
            this._historyPointer -= this.history.length - 10;
            this.history = this.history.slice(-10);
        }
    }

    rerender(only?: ComponentInstanceFactory[]) {
        this.spreadRenderer.renderCurrentSpread(only);
        this.spreadListRenderer.updatePreviews();
        this.dataRenderer.renderList();
    }

    select(instance: ComponentInstanceFactory[]) {
        if (this.spreadRenderer.selectedTool === ToolType.Cursor) {
            this.spreadRenderer.selectOrReplace(instance);
        }
    }

    deselectAll() {
        this.spreadRenderer.deselectAll();
    }

    makeSelectable(element: HTMLElement, instance: ComponentInstanceFactory | null) {
        if (!element.classList.contains(SpecialClasses.NoSelect)) {
            if (instance?.component.isSelectable) {
                element.onclick = () => {
                    this.select([instance]);
                };
            } else {
                element.style.pointerEvents = 'none';
            }
        }

        return element;
    }
}