import cloneDeep from 'lodash/cloneDeep';
import { Spread } from './lib/Spread';
import { TextSpan } from './lib/TextSpan';
import Size from './lib/utils/Size';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import { ParameterCalculator } from './render/ParameterCalculator';
import {
    ComponentCompositionType,
    HistoryState,
    Magazine,
    ParameterType,
    ParameterValueType,
    RerenderOption,
    SizeUnit,
    SpecialClasses,
    SpecialParameterId,
    ToolType,
} from './types';
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

        this.magazine = {
            spreads: [
                new ComponentInstance(
                    '0',
                    Spread,
                    [
                        {
                            id: 'moving-x',
                            value: new Size(40, SizeUnit.MM),
                        },
                        {
                            id: SpecialParameterId.Children,
                            value: [
                                new ComponentInstanceFactory(
                                    'text0',
                                    TextSpan,
                                    [
                                        new ParameterCalculator(
                                            'text',
                                            {
                                                isReference: false,
                                                value: 'Testing 123',
                                            },
                                        ),
                                        new ParameterCalculator(
                                            SpecialParameterId.X,
                                            {
                                                tiedTo: {
                                                    locationId: '0',
                                                    id: 'moving-x',
                                                },
                                                isReference: true,
                                            },
                                        ),
                                        new ParameterCalculator(
                                            SpecialParameterId.Y,
                                            {
                                                isReference: false,
                                                value: new Size(80, SizeUnit.MM),
                                            },
                                        ),
                                    ],
                                ),
                                new ComponentInstanceFactory(
                                    'text1',
                                    TextSpan,
                                    [
                                        new ParameterCalculator(
                                            'text',
                                            {
                                                value: 'Test-2',
                                                isReference: false,
                                            },
                                        ),
                                        new ParameterCalculator(
                                            SpecialParameterId.X,
                                            {
                                                tiedTo: {
                                                    locationId: '0',
                                                    id: 'moving-x',
                                                },
                                                isReference: true,
                                            },
                                        ),
                                        new ParameterCalculator(
                                            SpecialParameterId.Y,
                                            {
                                                isReference: false,
                                                value: new Size(100, SizeUnit.MM),
                                            },
                                        ),
                                    ],
                                ),
                                new ComponentInstanceFactory(
                                    'text2',
                                    TextSpan,
                                    [
                                        new ParameterCalculator(
                                            'text',
                                            {
                                                value: 'Test-3',
                                                isReference: false,
                                            },
                                        ),
                                        new ParameterCalculator(
                                            SpecialParameterId.X,
                                            {
                                                tiedTo: {
                                                    locationId: '0',
                                                    id: 'moving-x',
                                                },
                                                isReference: true,
                                            },
                                        ),
                                        new ParameterCalculator(
                                            SpecialParameterId.Y,
                                            {
                                                isReference: false,
                                                value: new Size(120, SizeUnit.MM),
                                            },
                                        ),
                                    ],
                                ),
                            ],
                        },
                    ],
                ),
            ],
            customComponents: [],
        };

        this.pxInMM = mmRuler.getBoundingClientRect().height / 100;
        this.pxInPT = ptRuler.getBoundingClientRect().height / 100;

        (window as PopulatedWindow).pxInMM = this.pxInMM;
        (window as PopulatedWindow).pxInPT = this.pxInPT;

        this.currentSpreadId = '0';
        this.dataRenderer = new DataRenderer(dataContainer, this);

        this.resetView();

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
        this.resetView();
    }

    resetView() {
        if (this.dataRenderer) {
            this.rerender();

            this.spreadRenderer.zoomToFit();
            this.dataRenderer.renderList();
        }
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

    traverseMagazine(callback: (instanceOrFactory: ComponentInstanceFactory | ComponentInstance) => boolean | void) {
        const traverse = (instanceOrFactory: ComponentInstance | ComponentInstanceFactory) => {
            const res = callback(instanceOrFactory);

            if (res !== true) {
                const childParameters = (
                    instanceOrFactory.compositionType === ComponentCompositionType.Factory ?
                        instanceOrFactory.parameterMapping :
                        instanceOrFactory.parameterValues
                )
                    .asSecondaryKey(instanceOrFactory.component.parameters)
                    .sFilter(e => e.type === ParameterType.Children);

                for (const parameter of childParameters) {
                    let isFound = false;

                    for (const child of (parameter.value as ComponentInstanceFactory[])) {
                        const res = traverse(child);

                        if (res) {
                            isFound = true;
                            break;
                        }
                    }

                    if (isFound) {
                        break;
                    }
                }
            } else {
                return true;
            }
        };

        for (const spread of this.magazine.spreads) {
            const res = callback(spread);

            if (res === true) {
                break;
            } else {
                traverse(spread);
            }
        }
    }

    getLinked(of: (ComponentInstance | ComponentInstanceFactory)[]) {
        const linked: ComponentInstanceFactory[] = [];

        this.traverseMagazine(
            (instanceOrFactory) => {
                if (instanceOrFactory.compositionType === ComponentCompositionType.Factory) {
                    if (
                        !of.some(t => t.id === instanceOrFactory.id) &&
                        instanceOrFactory
                            .parameterMapping
                            .some(param =>
                                param.isReference &&
                                of.some(t =>
                                    t.id === param.tiedTo!.locationId ||
                                    (
                                        t.compositionType === ComponentCompositionType.Factory &&
                                        t.parameterMapping.some(compParam =>
                                            compParam.isReference &&
                                            compParam.tiedTo!.locationId === param.tiedTo!.locationId &&
                                            compParam.tiedTo!.id === param.tiedTo!.id,
                                        )
                                    ),
                                ),
                            )
                    ) {
                        linked.push(instanceOrFactory);
                    }
                }
            },
        );

        return linked;
    }

    rerender(only?: ComponentInstanceFactory[], andLinked = true) {
        const linked: ComponentInstanceFactory[] = (only && andLinked) ? this.getLinked(only) : [];
        const updateList = only ? only.concat(...linked) : undefined;

        this.spreadRenderer.renderCurrentSpread(updateList);
        this.spreadListRenderer.updatePreviews();
        this.dataRenderer.renderList(updateList);
    }

    select(instance: ComponentInstanceFactory[]) {
        if (this.spreadRenderer.selectedTool === ToolType.Cursor) {
            this.spreadRenderer.selectOrReplace(instance);
            this.dataRenderer.ensureFocus(instance.slice(-1)[0]);
        }
    }

    deselectAll() {
        this.spreadRenderer.locallyDeselectAll();
        this.dataRenderer.ensureFocus(null);
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

    updateInstanceParameter(location: string[], value: ParameterValueType, rerender = RerenderOption.All) {
        const attemptToTraverse = (
            instanceOrFactory: ComponentInstance | ComponentInstanceFactory,
            location: string[],
        ) => {
            if (instanceOrFactory.compositionType === ComponentCompositionType.Factory) {
                if (location.length === 1) {
                    instanceOrFactory.respectfullyUpdateParameter(this, location[0], () => value);

                    if (rerender === RerenderOption.All) {
                        this.rerender([instanceOrFactory]);
                    } else if (rerender === RerenderOption.Previews || rerender === RerenderOption.PreviewsAndLinked) {
                        this.spreadRenderer.renderCurrentSpread([instanceOrFactory]);
                        this.spreadListRenderer.updatePreviews();

                        if (rerender === RerenderOption.PreviewsAndLinked) {
                            this.dataRenderer.renderList(this.getLinked([instanceOrFactory]));
                        }
                    }

                    return;
                }

                const children = instanceOrFactory
                    .parameterMapping
                    .getById(location[0])
                    ?.value as ComponentInstanceFactory[];
                attemptToTraverse(
                    children.find(e => e.id === location[1])!,
                    location.slice(2),
                );
            } else {
                if (location.length === 1) {
                    instanceOrFactory.parameterValues.updateById(location[0], { value });

                    if (rerender === RerenderOption.All) {
                        this.rerender();
                    } else if (rerender === RerenderOption.Previews || rerender === RerenderOption.PreviewsAndLinked) {
                        this.spreadRenderer.renderCurrentSpread();
                        this.spreadListRenderer.updatePreviews();

                        if (rerender === RerenderOption.PreviewsAndLinked) {
                            this.dataRenderer.renderList(this.getLinked([instanceOrFactory]));
                        }
                    }

                    return;
                }

                const children = instanceOrFactory
                    .parameterValues
                    .getById(location[0])
                    ?.value as ComponentInstanceFactory[];
                attemptToTraverse(
                    children.find(e => e.id === location[1])!,
                    location.slice(2),
                );
            }
        };

        attemptToTraverse(
            this.magazine.spreads.find(e => e.id === location[0])!,
            location.slice(1),
        );
    }
}