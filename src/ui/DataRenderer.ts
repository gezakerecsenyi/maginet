import Size from '../lib/utils/Size';
import Maginet from '../Maginet';
import ComponentInstance from '../render/ComponentInstance';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { ParameterType, ParameterValueType, SpecialClasses } from '../types';

export default class DataRenderer {
    private parent: HTMLElement;
    private maginet: Maginet;
    private focussingOn: ComponentInstanceFactory | null = null;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
    }

    get viewingComponent(): ComponentInstance<any> {
        return this
            .maginet
            .magazine
            .spreads
            .find(e => e.id === this.maginet.currentSpreadId)!;
    }

    ensureFocus(newNode?: ComponentInstanceFactory | null) {
        const node = (newNode === undefined ? this.focussingOn : newNode);
        this.focussingOn = node;

        for (let detailTag of this.parent.getElementsByTagName('details')) {
            detailTag.removeAttribute('open');
        }

        if (node) {
            const nodeLocation = node.locateSelfInComponent(
                this.maginet.magazine,
                this.viewingComponent.parameterValues,
                this.viewingComponent.component,
            );
            if (nodeLocation) {
                const pathToNode = [
                    this.viewingComponent.id,
                    ...nodeLocation,
                ]
                    .map(e => `.${e}`);
                for (let i = 0; i < pathToNode.length; i++) {
                    const pathToHere = pathToNode.slice(0, i + 1);

                    const id = pathToHere.join('') + '::opener';
                    const element = document.getElementById(id);
                    if (element) {
                        element.setAttribute('open', 'true');
                        if (i === pathToNode.length - 1) {
                            window.location.hash = '';
                            window.location.hash = id;
                        }
                    }
                }
            }
        }
    }

    renderList() {
        const list = document.createElement('ol');
        const formatProperties = (list: ComponentInstance[], currentPath = ''): HTMLElement[] => {
            return list.map(instance => {
                const elementContainer = document.createElement('li');
                const elementHere = document.createElement('details');
                elementHere.setAttribute('id', `${currentPath}.${instance.id}::opener`);

                const listHere = document.createElement('ul');

                const addPropertyEntry = (
                    property: string,
                    value: string | HTMLElement | HTMLElement[],
                    id: string,
                ) => {
                    const entry = document.createElement('li');

                    let valueLabel: HTMLElement;
                    if (!Object.hasOwn(value as object, 'length')) {
                        const propertyLabel = document.createElement('span');
                        propertyLabel.className = SpecialClasses.DatumPropertyLabel;
                        propertyLabel.innerText = property;
                        entry.appendChild(propertyLabel);

                        valueLabel = document.createElement('span');
                        valueLabel.className = SpecialClasses.DatumValueLabel;
                        if (typeof value === 'string') {
                            valueLabel.innerText = value;
                        } else {
                            valueLabel.replaceChildren(value as HTMLElement);
                        }
                    } else {
                        const propertyLabel = document.createElement('summary');
                        propertyLabel.className = SpecialClasses.DatumPropertyLabel;
                        propertyLabel.innerText = property;

                        valueLabel = document.createElement('details');
                        valueLabel.setAttribute('id', `${currentPath}.${instance.id}.${id}::opener`);
                        valueLabel.className = 'child-list';

                        const childList = document.createElement('ol');
                        childList.replaceChildren(...value as HTMLElement[]);
                        entry.appendChild(propertyLabel);

                        valueLabel.appendChild(propertyLabel);
                        valueLabel.appendChild(childList);

                        entry.appendChild(valueLabel);
                    }

                    entry.setAttribute('id', `${currentPath}.${instance.id}.${id}`);
                    entry.appendChild(valueLabel);

                    listHere.appendChild(entry);
                };

                const label = document.createElement('summary');
                label.className = SpecialClasses.DatumPropertyLabel;
                label.innerText = instance.component.displayName;

                instance
                    .parameterValues
                    .asSecondaryKey(instance.component.parameters)
                    .forEach(parameter => {
                        if (parameter.type !== ParameterType.Children) {
                            addPropertyEntry(
                                parameter.displayKey,
                                this.getEditorFor(parameter.value, parameter.type),
                                parameter.id,
                            );
                        } else {
                            addPropertyEntry(
                                parameter.displayKey,
                                formatProperties(
                                    (parameter.value as ComponentInstanceFactory[]).map(
                                        e => e.composeComponentInstance(this.maginet.magazine),
                                    ),
                                    `${currentPath}.${instance.id}.${parameter.id}`,
                                ),
                                parameter.id,
                            );
                        }
                    });

                elementHere.replaceChildren(label, listHere);
                elementContainer.replaceChildren(elementHere);
                return elementContainer;
            });
        };

        list.replaceChildren(...formatProperties([this.viewingComponent]));
        this.parent.replaceChildren(list);
        this.ensureFocus(this.focussingOn);
    }

    public getEditorFor(
        value: ParameterValueType,
        type: ParameterType,
    ): HTMLElement {
        switch (type) {
            case ParameterType.Size:
                const node = document.createElement('span');
                node.innerText = (value as Size).toCSSString();
                return node;
        }

        const fallbackNode = document.createElement('span');
        fallbackNode.innerText = JSON.stringify(value);
        return fallbackNode;
    }
}