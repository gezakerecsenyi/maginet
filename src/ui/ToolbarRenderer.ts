import Maginet from '../Maginet';

export enum OptionType {
    Cursor,
    Text,
    Image,
    Shape,
    Nodes,
    Component,

    Circle,
    Rectangle,
    Triangle,

    TextFragment,
    RichText,
}

export interface ToolbarOption {
    tooltip: string;
    optionType: OptionType;
    subOptions?: ToolbarOption[];
}

export default class ToolbarRenderer {
    private suboptionsMenu: HTMLDivElement | null = null;

    private _selectedToolOption: OptionType = OptionType.Cursor;

    static options: ToolbarOption[] = [
        {
            tooltip: 'Cursor',
            optionType: OptionType.Cursor,
        },
        {
            tooltip: 'Text',
            optionType: OptionType.Text,
            subOptions: [
                {
                    tooltip: 'Rich text',
                    optionType: OptionType.RichText,
                },
                {
                    tooltip: 'Text frame',
                    optionType: OptionType.TextFragment,
                },
            ],
        },
        {
            tooltip: 'Image',
            optionType: OptionType.Image,
        },
        {
            tooltip: 'Shape',
            optionType: OptionType.Shape,
            subOptions: [
                {
                    tooltip: 'Circle',
                    optionType: OptionType.Circle,
                },
                {
                    tooltip: 'Rectangle',
                    optionType: OptionType.Rectangle,
                },
                {
                    tooltip: 'Triangle',
                    optionType: OptionType.Triangle,
                },
            ],
        },
        {
            tooltip: 'Node pen',
            optionType: OptionType.Nodes,
        },
        {
            tooltip: 'Insert component...',
            optionType: OptionType.Component,
        },
    ];
    private parent: HTMLElement;
    private container: HTMLDivElement | null = null;
    private maginet: Maginet;

    get selectedToolOption(): OptionType {
        return this._selectedToolOption;
    }

    set selectedToolOption(value: OptionType) {
        document.getElementById(`tool-${this.selectedToolOption}`)?.classList.remove('active');
        document.getElementById(`tool-${value}`)?.classList.add('active');

        this._selectedToolOption = value;
    }

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
        this.ensureIsRendered();
    }

    ensureIsRendered() {
        if (!this.container || !this.container.parentNode || !document.getElementById('toolbar')) {
            const container = document.createElement('div');
            container.setAttribute('id', 'toolbar');
            this.container = container;

            const suboptionsMenu = document.createElement('div');
            suboptionsMenu.setAttribute('id', 'suboptions');
            this.suboptionsMenu = suboptionsMenu;
            this.suboptionsMenu.style.display = 'none';

            this.parent.appendChild(this.suboptionsMenu);
            this.parent.appendChild(this.container);

            ToolbarRenderer.options.forEach(option => {
                const button = document.createElement('button');
                button.innerText = option.tooltip;
                button.setAttribute('id', `tool-${option.optionType}`);
                button.onclick = () => {
                    if (!option.subOptions) {
                        this.maginet.spreadRenderer.selectedTool = option.optionType;
                        this.selectedToolOption = option.optionType;

                        if (this.suboptionsMenu) {
                            this.suboptionsMenu.style.display = 'none';
                        }
                    } else if (this.suboptionsMenu && this.container) {
                        this.suboptionsMenu.style.top = `${button.getBoundingClientRect().bottom}px`;
                        this.suboptionsMenu.style.left =
                            `${button.getBoundingClientRect().left - this.container.getBoundingClientRect().left}px`;
                        this.suboptionsMenu.style.display = 'block';
                        this.suboptionsMenu.replaceChildren();

                        for (const suboption of option.subOptions) {
                            const button = document.createElement('button');
                            button.className = 'suboption-button';
                            button.innerText = suboption.tooltip;
                            button.onclick = () => {
                                this.selectedToolOption = option.optionType;
                                this.maginet.spreadRenderer.selectedTool = suboption.optionType;

                                if (this.suboptionsMenu) {
                                    this.suboptionsMenu.style.display = 'none';
                                }
                            };

                            this.suboptionsMenu.appendChild(button);
                        }
                    }
                };

                this.container!.appendChild(button);
            });
        }
    }
}