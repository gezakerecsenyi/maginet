import Maginet from '../Maginet';
import ComponentInstance from '../render/ComponentInstance';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { ParameterType } from '../types';

export default class DataRenderer {
    private parent: HTMLElement;
    private maginet: Maginet;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
    }

    renderList() {
        const list = document.createElement('ol');
        const formatProperties = (list: ComponentInstance[]): HTMLElement[] => {
            return list.map(instance => {
                const elementHere = document.createElement('li');
                const listHere = document.createElement('ul');

                const addPropertyEntry = (property: string, value: string | HTMLElement[]) => {
                    const entry = document.createElement('li');

                    let valueLabel: HTMLElement;
                    if (typeof value === 'string') {
                        const propertyLabel = document.createElement('span');
                        propertyLabel.className = 'property-label';
                        propertyLabel.innerText = property;
                        entry.appendChild(propertyLabel);

                        valueLabel = document.createElement('span');
                        valueLabel.className = 'value-label';
                        valueLabel.innerText = value;
                    } else {
                        const propertyLabel = document.createElement('summary');
                        propertyLabel.className = 'property-label';
                        propertyLabel.innerText = property;

                        valueLabel = document.createElement('details');
                        valueLabel.className = 'child-list';

                        const childList = document.createElement('ol');
                        childList.replaceChildren(...value);
                        entry.appendChild(propertyLabel);

                        valueLabel.appendChild(propertyLabel);
                        valueLabel.appendChild(childList);

                        entry.appendChild(valueLabel);
                    }

                    entry.appendChild(valueLabel);

                    listHere.appendChild(entry);
                };

                addPropertyEntry('Name', instance.component.displayName);

                instance.parameterValues.forEach(parameter => {
                    const parameterDescription = instance
                        .component
                        .parameters
                        .find(e => e.id === parameter.id)!;

                    if (parameterDescription.type !== ParameterType.Children) {
                        // TODO: current this is just rendering everything as strings. Add an option to allow for
                        //  changing this, and also to render everything nicely according to data type.
                        addPropertyEntry(parameterDescription.displayKey, JSON.stringify(parameter.value));
                    } else {
                        addPropertyEntry(
                            parameterDescription.displayKey,
                            formatProperties(
                                (parameter.value as ComponentInstanceFactory[])
                                    .map(e => e.composeComponentInstance(this.maginet.magazine)),
                            ),
                        );
                    }
                });

                elementHere.replaceChildren(listHere);
                return elementHere;
            });
        };

        list.replaceChildren(...formatProperties(this.maginet.magazine.spreads));
        this.parent.replaceChildren(list);
    }
}