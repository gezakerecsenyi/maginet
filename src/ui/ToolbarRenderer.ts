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
            this.parent.appendChild(this.container);

            ToolbarRenderer.options.forEach(option => {
                const button = document.createElement('button');
                button.innerText = option.tooltip;
                button.setAttribute('id', `tool-${option.optionType}`);
                button.onclick = () => {
                    if (!option.subOptions) {
                        this.maginet.spreadRenderer.selectedTool = option.optionType;
                    }
                };

                this.container!.appendChild(button);
            });
        }
    }
}