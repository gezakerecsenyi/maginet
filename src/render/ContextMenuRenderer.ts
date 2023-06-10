import Maginet from '../Maginet';

export enum ContextEntryType {
    Info,
    Button,
    Checkbox,
    Separator,
}

export interface ContextMenuInfo {
    type: ContextEntryType.Info;
    text: string;
}

export interface ContextMenuButton {
    type: ContextEntryType.Button;
    label: string;
    onClick: () => boolean;
}

export interface ContextMenuCheckbox {
    type: ContextEntryType.Checkbox;
    label: string;
    onClick: (newState: boolean) => boolean;
}

export interface ContextMenuSeparator {
    type: ContextEntryType.Separator;
}

export type ContextMenuSpec = (ContextMenuInfo | ContextMenuButton | ContextMenuCheckbox | ContextMenuSeparator)[];

export class ContextMenuRenderer {
    private maginet: Maginet;
    private readonly element: HTMLDivElement;

    constructor(maginet: Maginet) {
        this.maginet = maginet;

        this.element = document.createElement('div');
        this.element.className = 'context-menu closed';
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        });

        window.addEventListener('mousedown', () => {
            this.closeContextMenu();
        });

        document.body.appendChild(this.element);

        this.closeContextMenu();
    }

    closeContextMenu() {
        this.element.classList.add('closed');
        this.element.classList.remove('open');
        this.element.style.left = '-100vw';
        this.element.style.top = '-100vh';
        this.element.replaceChildren();
    }

    summonContextMenu(x: number, y: number, spec: ContextMenuSpec) {
        this.element.classList.remove('closed');
        this.element.classList.add('open');
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        const container = document.createElement('ul');
        container.replaceChildren(
            ...spec.map(entry => {
                const nodeHere = document.createElement('li');

                switch (entry.type) {
                    case ContextEntryType.Info:
                        nodeHere.className = 'info-node';
                        nodeHere.innerText = entry.text;
                        break;
                    case ContextEntryType.Separator:
                        nodeHere.className = 'separator';
                        break;
                    case ContextEntryType.Button:
                        nodeHere.className = 'button-node';
                        const buttonHere = document.createElement('button');
                        buttonHere.innerText = entry.label;
                        buttonHere.addEventListener('click', () => {
                            const res = entry.onClick();
                            if (res) {
                                this.closeContextMenu();
                            }
                        });

                        nodeHere.appendChild(buttonHere);
                        break;
                    case ContextEntryType.Checkbox:
                        nodeHere.className = 'checkbox-node';
                        const label = document.createElement('label');
                        label.innerText = entry.label;

                        const checkboxHere = document.createElement('input');
                        checkboxHere.type = 'checkbox';
                        checkboxHere.addEventListener('change', () => {
                            const res = entry.onClick(checkboxHere.checked);
                            if (res) {
                                this.closeContextMenu();
                            }
                        });

                        label.appendChild(checkboxHere);
                        nodeHere.appendChild(label);
                        break;
                }

                return nodeHere;
            }),
        );

        this.element.replaceChildren(container);
    }
}