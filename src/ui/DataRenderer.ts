import Maginet from '../Maginet';
import ComponentInstance from '../render/ComponentInstance';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { ParameterType, SpecialClasses } from '../types';

export default class DataRenderer {
    private parent: HTMLElement;
    private maginet: Maginet;

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

    focusOn(node: ComponentInstanceFactory | null) {
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

                    const element = document.getElementById(pathToHere.join('') + '::opener');
                    if (element) {
                        element.setAttribute('open', 'true');
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

                const addPropertyEntry = (property: string, value: string | HTMLElement[], id: string) => {
                    const entry = document.createElement('li');

                    let valueLabel: HTMLElement;
                    if (typeof value === 'string') {
                        const propertyLabel = document.createElement('span');
                        propertyLabel.className = SpecialClasses.DataBarPropertyLabel;
                        propertyLabel.innerText = property;
                        entry.appendChild(propertyLabel);

                        valueLabel = document.createElement('span');
                        valueLabel.className = SpecialClasses.DataBarValueLabel;
                        valueLabel.innerText = value;
                    } else {
                        const propertyLabel = document.createElement('summary');
                        propertyLabel.className = SpecialClasses.DataBarPropertyLabel;
                        propertyLabel.innerText = property;

                        valueLabel = document.createElement('details');
                        valueLabel.setAttribute('id', `${currentPath}.${instance.id}.${id}::opener`);
                        valueLabel.className = 'child-list';

                        const childList = document.createElement('ol');
                        childList.replaceChildren(...value);
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
                label.className = SpecialClasses.DataBarPropertyLabel;
                label.innerText = instance.component.displayName;

                instance
                    .parameterValues
                    .asSecondaryKey(instance.component.parameters)
                    .forEach(parameter => {
                        if (parameter.type !== ParameterType.Children) {
                            // TODO: current this is just rendering everything as strings. Add an option to allow for
                            //  changing this, and also to render everything nicely according to data type.
                            addPropertyEntry(parameter.displayKey, JSON.stringify(parameter.value), parameter.id);
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
    }
}