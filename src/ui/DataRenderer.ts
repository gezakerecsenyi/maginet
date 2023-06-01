import Maginet from '../Maginet';
import ComponentInstance from '../render/ComponentInstance';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { ParameterType, SpecialClasses } from '../types';

export default class DataRenderer {
    get viewingComponent(): ComponentInstance<any> {
        return this
            .maginet
            .magazine
            .spreads
            .find(e => e.id === this.maginet.currentSpreadId)!;
    }

    private parent: HTMLElement;
    private maginet: Maginet;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
    }

    focusOn(node: ComponentInstanceFactory) {
        // const nodeLocation = node.locateSelfInComponent(this.viewingComponent.parameterValues);
    }

    renderList() {
        const list = document.createElement('ol');
        const formatProperties = (list: ComponentInstance[]): HTMLElement[] => {
            return list.map(instance => {
                const elementContainer = document.createElement('li');
                const elementHere = document.createElement('details');

                const listHere = document.createElement('ul');

                const addPropertyEntry = (property: string, value: string | HTMLElement[]) => {
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

                const label = document.createElement('summary');
                label.className = SpecialClasses.DataBarPropertyLabel;
                label.innerText = instance.component.displayName;

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

                elementHere.replaceChildren(label, listHere);
                elementContainer.replaceChildren(elementHere);
                return elementContainer;
            });
        };

        list.replaceChildren(...formatProperties([this.viewingComponent]));
        this.parent.replaceChildren(list);
    }
}