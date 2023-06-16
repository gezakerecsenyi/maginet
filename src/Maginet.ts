import cloneDeep from 'lodash/cloneDeep';
import { Spread } from './lib/components/Spread';
import { TextSpan } from './lib/components/TextSpan';
import { ParameterCalculator } from './lib/utils/ParameterCalculator';
import Size from './lib/utils/Size';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import {
    ComponentCompositionType,
    HistoryState,
    Magazine,
    ParameterAssociationDescriptor,
    ParameterTyping,
    ParameterValueDatum,
    RerenderOption,
    SizeUnit,
    SpecialClasses,
    SpecialParameterId,
    ToolType,
} from './types';
import { ContextMenuRenderer } from './ui/ContextMenuRenderer';
import DataRenderer from './ui/DataRenderer';
import SpreadListRenderer from './ui/SpreadListRenderer';
import SpreadRenderer from './ui/SpreadRenderer';
import { PopulatedWindow } from './window';

export default class Maginet {
    public magazine: Magazine;
    public spreadRenderer: SpreadRenderer;
    public spreadListRenderer: SpreadListRenderer;
    public contextMenuRenderer: ContextMenuRenderer;
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
        this.contextMenuRenderer = new ContextMenuRenderer(this);
        this.spreadRenderer = new SpreadRenderer(previewContainer, this);
        this.spreadListRenderer = new SpreadListRenderer(spreadListContainer, this);

        const instance = new ComponentInstance(
            '0',
            Spread,
            [
                new ParameterCalculator(
                    'moving-x',
                    {
                        isReference: false,
                        value: new Size(40, SizeUnit.MM),
                    },
                ),
            ],
            null,
        );
        instance
            .addChild(
                {
                    id: 'text0',
                    component: TextSpan,
                    parameterMapping: [],
                },
            )
            .setParameter(
                'text',
                {
                    isReference: false,
                    value: 'Testing 1',
                },
            )
            .setParameter(
                SpecialParameterId.X,
                {
                    tiedTo: new ParameterAssociationDescriptor(
                        instance,
                        'moving-x',
                    ),
                    value: new Size(100, SizeUnit.MM),
                    isReference: true,
                },
            )
            .setParameter(
                SpecialParameterId.Y,
                {
                    isReference: false,
                    value: new Size(80, SizeUnit.MM),
                },
            );

        instance
            .addChild(
                {
                    id: 'text1',
                    component: TextSpan,
                    parameterMapping: [],
                },
            )
            .setParameter(
                'text',
                {
                    isReference: false,
                    value: 'Testing 2',
                },
            )
            .setParameter(
                SpecialParameterId.X,
                {
                    tiedTo: new ParameterAssociationDescriptor(
                        instance,
                        'moving-x',
                    ),
                    value: new Size(100, SizeUnit.MM),
                    isReference: true,
                },
            )
            .setParameter(
                SpecialParameterId.Y,
                {
                    isReference: false,
                    value: new Size(110, SizeUnit.MM),
                },
            );

        instance
            .addChild(
                {
                    id: 'text2',
                    component: TextSpan,
                    parameterMapping: [],
                },
            )
            .setParameter(
                'text',
                {
                    isReference: false,
                    value: 'Testing 3',
                },
            )
            .setParameter(
                SpecialParameterId.X,
                {
                    tiedTo: new ParameterAssociationDescriptor(
                        instance,
                        'moving-x',
                    ),
                    value: new Size(100, SizeUnit.MM),
                    isReference: true,
                },
            )
            .setParameter(
                SpecialParameterId.Y,
                {
                    isReference: false,
                    value: new Size(140, SizeUnit.MM),
                },
            );

        this.magazine = {
            spreads: [instance],
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
                    .sFilter(e => instanceOrFactory.component.parameters.getById(e.id)?.type === ParameterTyping.Children);

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
                                    t.id === param.tiedTo!.inComponent.id ||
                                    (
                                        t.compositionType === ComponentCompositionType.Factory &&
                                        t.parameterMapping.some(compParam =>
                                            compParam.isReference &&
                                            compParam.tiedTo!.inComponent.id === param.tiedTo!.inComponent.id &&
                                            compParam.tiedTo!.parameterId === param.tiedTo!.parameterId,
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

    updateInstanceParameter(
        parameter: ParameterCalculator<any>,
        value: ParameterValueDatum,
        rerender = RerenderOption.All,
    ) {
        if (parameter.belongsTo) {
            if (parameter.belongsTo.compositionType === ComponentCompositionType.Instance) {
                parameter.belongsTo.updateParameter(parameter.id, value);

                if (rerender === RerenderOption.All) {
                    this.rerender();
                } else if (rerender === RerenderOption.Previews || rerender === RerenderOption.PreviewsAndLinked) {
                    this.spreadRenderer.renderCurrentSpread();
                    this.spreadListRenderer.updatePreviews();

                    if (rerender === RerenderOption.PreviewsAndLinked) {
                        this.dataRenderer.renderList();
                    }
                }
            } else {
                parameter.belongsTo.respectfullyUpdateParameter(this, parameter.id, () => value);

                if (rerender === RerenderOption.All) {
                    this.rerender([parameter.belongsTo]);
                } else if (rerender === RerenderOption.Previews || rerender === RerenderOption.PreviewsAndLinked) {
                    this.spreadRenderer.renderCurrentSpread([parameter.belongsTo]);
                    this.spreadListRenderer.updatePreviews();

                    if (rerender === RerenderOption.PreviewsAndLinked) {
                        this.dataRenderer.renderList(this.getLinked([parameter.belongsTo]));
                    }
                }
            }
        }
    }
}