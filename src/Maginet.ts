import { Spread } from './lib/Spread';
import { TextSpan } from './lib/TextSpan';
import Size from './lib/utils/Size';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import { DefaultParameterId, Magazine, SizeUnit } from './types';
import DataRenderer from './ui/DataRenderer';
import SpreadListRenderer from './ui/SpreadListRenderer';
import SpreadRenderer from './ui/SpreadRenderer';
import { PopulatedWindow } from './window';

export default class Maginet {
    public magazine: Magazine;
    public pxInMM: number;
    public spreadRenderer: SpreadRenderer;
    public spreadListRenderer: SpreadListRenderer;
    public dataRenderer: DataRenderer;
    public pxInPT: number;

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
                            id: DefaultParameterId.Children,
                            value: [
                                new ComponentInstanceFactory(
                                    TextSpan,
                                    [
                                        {
                                            parameterId: 'text',
                                            tiedTo: null,
                                            value: 'Testing 123!'
                                        },
                                        {
                                            parameterId: DefaultParameterId.X,
                                            tiedTo: null,
                                            value: new Size(120, SizeUnit.MM),
                                        },
                                        {
                                            parameterId: DefaultParameterId.Y,
                                            tiedTo: null,
                                            value: new Size(80, SizeUnit.MM),
                                        }
                                    ],
                                    'text0'
                                )
                            ]
                        }
                    ],
                    '0',
                ),
            ],
            components: [],
        };

        this.pxInMM = mmRuler.getBoundingClientRect().height / 100;
        this.pxInPT = ptRuler.getBoundingClientRect().height / 100;

        (window as PopulatedWindow).pxInMM = this.pxInMM;
        (window as PopulatedWindow).pxInPT = this.pxInPT;

        this.currentSpreadId = '0';
    }

    private _currentSpreadId!: string;

    get currentSpreadId() {
        return this._currentSpreadId;
    }

    set currentSpreadId(id: string) {
        this._currentSpreadId = id;
        this.update();

        this.spreadRenderer.zoomToFit();
        this.dataRenderer.renderList();
    }

    update() {
        this.spreadRenderer.renderCurrentSpread();
        this.spreadListRenderer.updatePreviews();
    }

    select(element: HTMLElement, instance: ComponentInstanceFactory) {
        this.spreadRenderer.select(element, instance);
    }

    deselect() {
        this.spreadRenderer.deselect();
    }

    makeSelectable(element: HTMLElement, instance: ComponentInstanceFactory | null) {
        element.onclick = (e) => {
            e.stopPropagation();
            if (instance?.component.isSelectable) {
                this.select(element, instance);
            } else {
                this.deselect();
            }
        };
        return element;
    }
}