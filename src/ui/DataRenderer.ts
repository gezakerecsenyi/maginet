import { Color } from '../lib/utils/Color';
import Size from '../lib/utils/Size';
import Maginet from '../Maginet';
import ComponentInstance from '../render/ComponentInstance';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import { ParameterType, ParameterValueType, RerenderOption, SizeUnit, SpecialClasses } from '../types';

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
                ];
                for (let i = 0; i < pathToNode.length; i++) {
                    const pathToHere = pathToNode.slice(0, i + 1);

                    const id = pathToHere.join('.') + '::opener';
                    const element = document.getElementById(id);
                    if (element) {
                        element.setAttribute('open', 'open');
                        if (i === pathToNode.length - 1) {
                            window.location.hash = '';
                            window.location.hash = id;
                        }
                    }
                }
            }
        }
    }

    renderList(only?: ComponentInstanceFactory[]) {
        const list = document.createElement('ol');

        const selectedNodeLocation = this.focussingOn?.locateSelfInComponent(
            this.maginet.magazine,
            this.viewingComponent.parameterValues,
            this.viewingComponent.component,
        );
        const pathToSelectedNode = selectedNodeLocation ? [
            this.viewingComponent.id,
            ...selectedNodeLocation,
        ].join('.') : '';

        const formatProperties = (list: ComponentInstance[], currentPath: string[] = []): HTMLElement[] => {
            return list.map(instance => {
                const elementContainer = document.createElement('li');
                const elementHere = document.createElement('details');

                const idStem = currentPath.concat(instance.id).join('.');
                elementHere.setAttribute('id', `${idStem}::opener`);
                if (idStem === pathToSelectedNode) {
                    elementHere.setAttribute('open', 'open');
                }

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
                        valueLabel.className = 'child-list';

                        const idStem = currentPath.concat(instance.id, id).join('.');
                        valueLabel.setAttribute('id', `${idStem}::opener`);
                        if (idStem === pathToSelectedNode) {
                            valueLabel.setAttribute('open', 'open');
                        }

                        const childList = document.createElement('ol');
                        childList.replaceChildren(...value as HTMLElement[]);
                        entry.appendChild(propertyLabel);

                        valueLabel.appendChild(propertyLabel);
                        valueLabel.appendChild(childList);

                        entry.appendChild(valueLabel);
                    }

                    entry.setAttribute('id', currentPath.concat(instance.id, id).join('.'));
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
                                this.getEditorFor(
                                    parameter.value,
                                    parameter.type,
                                    currentPath.concat(instance.id, parameter.id),
                                ),
                                parameter.id,
                            );
                        } else {
                            addPropertyEntry(
                                parameter.displayKey,
                                formatProperties(
                                    (parameter.value as ComponentInstanceFactory[]).map(
                                        e => e.composeComponentInstance(this.maginet.magazine),
                                    ),
                                    currentPath.concat(instance.id, parameter.id),
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

        if (only) {
            for (const factory of only) {
                const location = factory.locateSelfInComponent(
                    this.maginet.magazine,
                    this.viewingComponent.parameterValues,
                    this.viewingComponent.component,
                );

                if (location) {
                    const container = document.getElementById(
                        `${[this.viewingComponent.id].concat(...location).join('.')}::opener`,
                    )?.closest('li');

                    if (container) {
                        container.replaceWith(...formatProperties(
                            [factory.composeComponentInstance(this.maginet.magazine)],
                            [this.viewingComponent.id].concat(...location).slice(0, -1),
                        ));
                        continue;
                    }
                }

                this.renderList();
                break;
            }
        } else {
            list.replaceChildren(...formatProperties([this.viewingComponent]));
            this.parent.replaceChildren(list);
            this.ensureFocus(this.focussingOn);
        }
    }

    public getEditorFor(
        value: ParameterValueType,
        type: ParameterType,
        location: string[],
    ): HTMLElement {
        switch (type) {
            case ParameterType.Size: {
                const node = document.createElement('span');
                node.className = 'size-editor';

                const distance = document.createElement('input');
                distance.type = 'number';
                distance.valueAsNumber = (value as Size).distance;

                const unit = document.createElement('select');
                const options = [
                    SizeUnit.PX,
                    SizeUnit.MM,
                    SizeUnit.PT,
                ]
                    .map(e => {
                        const option = document.createElement('option');
                        option.innerText = e;
                        option.value = e;

                        return option;
                    });
                unit.replaceChildren(...options);
                unit.value = (value as Size).unit;

                let currentValue = value as Size;
                const listener = () => {
                    this.maginet.updateInstanceParameter(
                        location,
                        new Size(distance.valueAsNumber, unit.value as SizeUnit),
                        RerenderOption.PreviewsAndLinked,
                    );
                };
                unit.addEventListener('change', () => {
                    currentValue.distance = distance.valueAsNumber;
                    currentValue = currentValue.toType(unit.value as SizeUnit);
                    distance.valueAsNumber = currentValue.distance;

                    this.maginet.updateInstanceParameter(
                        location,
                        currentValue,
                        RerenderOption.PreviewsAndLinked,
                    );
                });
                distance.addEventListener('input', listener);

                node.replaceChildren(distance, unit);

                return node;
            }
            case ParameterType.String: {
                const node = document.createElement('span');

                const lNode = document.createElement('span');
                const rNode = document.createElement('span');
                lNode.innerText = `"`;
                rNode.innerText = `"`;

                const cNode = document.createElement('span');
                cNode.contentEditable = 'true';
                cNode.className = 'editable';
                cNode.innerText = value as string;

                const id = `${location.join('.')}::editor`;
                cNode.setAttribute('id', id);
                cNode.addEventListener('input', () => {
                    const newValue = cNode.innerText;
                    this.maginet.updateInstanceParameter(location, newValue, RerenderOption.PreviewsAndLinked);
                });

                node.replaceChildren(lNode, cNode, rNode);

                return node;
            }
            case ParameterType.Color: {
                const node = document.createElement('span');
                node.innerText = (value as Color).toCSSString();
                return node;
            }
        }

        const fallbackNode = document.createElement('span');
        fallbackNode.innerText = JSON.stringify(value);
        return fallbackNode;
    }
}