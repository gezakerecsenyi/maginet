import ToolbarOption from '../lib/utils/ToolbarOption';
import { toolbarOptionList } from '../lib/utils/toolbarOptionList';
import Maginet from '../Maginet';
import { SpecialClasses, ToolType } from '../types';

export default class ToolbarRenderer {
    static options: ToolbarOption[] = toolbarOptionList;
    private suboptionsMenu: HTMLDivElement | null = null;
    private parent: HTMLElement;
    private container: HTMLDivElement | null = null;
    private maginet: Maginet;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;

        this.ensureIsRendered();
        this.selectedToolCategory = ToolType.Cursor;
    }

    get currentToolData() {
        return (this.selectedToolCategory === this.maginet.spreadRenderer.selectedTool) ?
            ToolbarRenderer
                .options
                .find(e => e.optionType === this.selectedToolCategory)! :
            ToolbarRenderer
                .options
                .find(e => e.optionType === this.selectedToolCategory)!
                .suboptions!
                .find(e => e.optionType === this.maginet.spreadRenderer.selectedTool)!;
    }

    private _selectedToolCategory!: ToolType;

    get selectedToolCategory(): ToolType {
        return this._selectedToolCategory;
    }

    set selectedToolCategory(value: ToolType) {
        document.getElementById(this.selectedToolCategory)?.classList.remove('active');
        document.getElementById(value)?.classList.add('active');

        this._selectedToolCategory = value;
    }

    ensureIsRendered() {
        if (!this.container || !this.container.parentNode || !document.getElementById('toolbar')) {
            const container = document.createElement('div');
            container.className = SpecialClasses.NoSelect;
            container.setAttribute('id', 'toolbar');
            this.container = container;

            const suboptionsMenu = document.createElement('div');
            suboptionsMenu.setAttribute('id', 'suboptions');
            suboptionsMenu.className = SpecialClasses.NoSelect;
            this.suboptionsMenu = suboptionsMenu;
            this.suboptionsMenu.style.display = 'none';

            this.parent.appendChild(this.suboptionsMenu);
            this.parent.appendChild(this.container);

            ToolbarRenderer.options.forEach(option => {
                const button = document.createElement('button');
                button.className = SpecialClasses.NoSelect;
                button.innerText = option.tooltip;
                button.setAttribute('id', option.optionType);

                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!option.suboptions) {
                        console.log('setting tool');
                        this.maginet.spreadRenderer.selectedTool = option.optionType;
                        this.selectedToolCategory = option.optionType;

                        if (this.suboptionsMenu) {
                            this.suboptionsMenu.style.display = 'none';
                        }
                    } else if (this.suboptionsMenu && this.container) {
                        this.suboptionsMenu.style.top = `${button.getBoundingClientRect().bottom}px`;
                        this.suboptionsMenu.style.left = `${
                            button.getBoundingClientRect().left - this.container.getBoundingClientRect().left
                        }px`;
                        this.suboptionsMenu.style.display = 'block';
                        this.suboptionsMenu.replaceChildren();

                        for (const suboption of option.suboptions) {
                            const button = document.createElement('button');
                            button.classList.add('suboption-button', SpecialClasses.NoSelect);
                            button.innerText = suboption.tooltip;

                            button.onclick = () => {
                                this.selectedToolCategory = option.optionType;
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

            this.selectedToolCategory = this._selectedToolCategory;
        }
    }
}