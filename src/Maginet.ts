import { Spread } from './lib/Spread';
import { TextSpan } from './lib/TextSpan';
import Size from './lib/utils/Size';
import ComponentInstance from './render/ComponentInstance';
import ComponentInstanceFactory from './render/ComponentInstanceFactory';
import { DefaultParameterId, Magazine, SizeUnit } from './types';
import DataRenderer from './ui/DataRenderer';
import SpreadListRenderer from './ui/SpreadListRenderer';
import SpreadRenderer from './ui/SpreadRenderer';

export default class Maginet {
    public magazine: Magazine;
    public deviceScale: number;
    private spreadRenderer: SpreadRenderer;
    private spreadListRenderer: SpreadListRenderer;
    private dataRenderer: DataRenderer;

    constructor(
        spreadListContainer: HTMLElement,
        previewContainer: HTMLElement,
        dataContainer: HTMLElement,
        ruler: HTMLElement,
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

        this.deviceScale = ruler.getBoundingClientRect().height / 100;

        this.currentSpreadId = '0';
    }

    private _currentSpreadId: string;

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
}