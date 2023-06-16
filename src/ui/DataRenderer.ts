import { Color } from '../lib/utils/Color';
import { DefiniteParameterCalculator, ParameterCalculator } from '../lib/utils/ParameterCalculator';
import ParentRelationDescriptor from '../lib/utils/ParentRelationDescriptor';
import Size from '../lib/utils/Size';
import Maginet from '../Maginet';
import ParameterRelationshipEvaluator from '../nodes/ParameterRelationshipEvaluator';
import ComponentInstance from '../render/ComponentInstance';
import ComponentInstanceFactory from '../render/ComponentInstanceFactory';
import {
    ComponentCompositionType,
    ParameterTyping,
    RerenderOption,
    SizeUnit,
    SpecialClasses,
    SpecialParameterId,
} from '../types';
import { ContextEntryType } from './ContextMenuRenderer';
import ModalRenderer from './ModalRenderer';
import NodeRenderer from './NodeRenderer';

export default class DataRenderer {
    private parent: HTMLElement;
    private maginet: Maginet;
    private focussingOn: ComponentInstanceFactory | null = null;

    constructor(parent: HTMLElement, maginet: Maginet) {
        this.parent = parent;
        this.maginet = maginet;
    }

    private _selectingLinkFor: ParameterCalculator<any> | null = null;

    get selectingLinkFor() {
        return this._selectingLinkFor;
    }

    set selectingLinkFor(value) {
        this._selectingLinkFor = value;

        Array
            .from(this.parent.getElementsByClassName(SpecialClasses.ReferenceTarget))
            .forEach(target => {
                if (value) {
                    target.classList.add('ready-for-reference');
                } else {
                    target.classList.remove('ready-for-reference');
                    target.classList.remove(SpecialClasses.ReferenceSource);
                }
            });
    }

    get viewingComponent(): ComponentInstance<any> {
        return this
            .maginet
            .magazine
            .spreads
            .find(e => e.id === this.maginet.currentSpreadId)!;
    }

    static getEditorFor<T extends SpecialParameterId | string>(
        maginet: Maginet,
        parameter: DefiniteParameterCalculator<T>,
    ): HTMLElement {
        const parameterData = parameter
            .belongsTo
            ?.component
            .parameters
            .getById(parameter.id);

        const resolvedValue = parameter.resolveValue()[0];

        if (!parameterData || !resolvedValue) {
            return document.createElement('span');
        }

        switch (parameterData.type) {
            case ParameterTyping.Size: {
                const node = document.createElement('span');
                node.className = 'size-editor';

                const distance = document.createElement('input');
                distance.type = 'number';
                distance.valueAsNumber = (resolvedValue as Size).distance;

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
                unit.value = (resolvedValue as Size).unit;

                let currentValue = resolvedValue as Size;
                const listener = () => {
                    maginet.updateInstanceParameter(
                        parameter,
                        new Size(distance.valueAsNumber, unit.value as SizeUnit),
                        RerenderOption.PreviewsAndLinked,
                    );
                };
                unit.addEventListener('change', () => {
                    currentValue.distance = distance.valueAsNumber;
                    currentValue = currentValue.toType(unit.value as SizeUnit);
                    distance.valueAsNumber = currentValue.distance;

                    maginet.updateInstanceParameter(
                        parameter,
                        currentValue,
                        RerenderOption.PreviewsAndLinked,
                    );
                });
                distance.addEventListener('input', listener);

                node.replaceChildren(distance, unit);

                return node;
            }
            case ParameterTyping.String: {
                const node = document.createElement('span');

                const lNode = document.createElement('span');
                const rNode = document.createElement('span');
                lNode.innerText = `"`;
                rNode.innerText = `"`;

                const cNode = document.createElement('span');
                cNode.contentEditable = 'true';
                cNode.className = 'editable';
                cNode.innerText = resolvedValue as string;

                const id = `${parameter.belongsTo!.id}.${parameter.id}::editor`;
                cNode.setAttribute('id', id);
                cNode.addEventListener('input', () => {
                    const newValue = cNode.innerText;
                    maginet.updateInstanceParameter(parameter, newValue, RerenderOption.PreviewsAndLinked);
                });

                node.replaceChildren(lNode, cNode, rNode);

                return node;
            }
            case ParameterTyping.Color: {
                const node = document.createElement('span');
                node.classList.add('color-chip');
                node.style.backgroundColor = (resolvedValue as Color).toCSSString();

                return node;
            }
        }

        const fallbackNode = document.createElement('span');
        fallbackNode.innerText = JSON.stringify(resolvedValue);
        return fallbackNode;
    }

    ensureFocus(newNode?: ComponentInstanceFactory | null) {
        const node = (newNode === undefined ? this.focussingOn : newNode);
        this.focussingOn = node;

        for (let detailTag of this.parent.getElementsByTagName('details')) {
            detailTag.removeAttribute('open');
        }

        if (node) {
            document
                .getElementById(`${node.id}::opener`)
                ?.setAttribute('open', 'open');

            let currentLocation: ParentRelationDescriptor<any> | null = node.parent;

            while (currentLocation && currentLocation.component) {
                document
                    .getElementById(`${currentLocation.component.id}::opener`)
                    ?.setAttribute('open', 'open');

                document
                    .getElementById(`${currentLocation.parameterId}.${currentLocation.component.id}::opener`)
                    ?.setAttribute('open', 'open');

                if (currentLocation.component.compositionType !== ComponentCompositionType.Specification) {
                    currentLocation = currentLocation.component.parent;
                } else {
                    break;
                }
            }
        }
    }

    renderList(only?: ComponentInstanceFactory[]) {
        const list = document.createElement('ol');

        const formatProperties = (list: [ComponentInstance, ComponentInstanceFactory | null][]): HTMLElement[] => {
            return list.map(([instance, factory]) => {
                const elementContainer = document.createElement('li');
                const elementHere = document.createElement('details');

                elementHere.setAttribute('id', `${instance.id}::opener`);
                if (instance.id === this.focussingOn?.id) {
                    elementHere.setAttribute('open', 'open');
                }

                const listHere = document.createElement('ul');

                const addPropertyEntry = (
                    property: string,
                    value: string | HTMLElement | HTMLElement[],
                    parameter: DefiniteParameterCalculator<any>,
                ) => {
                    const entry = document.createElement('li');

                    const tiedToButton = document.createElement('button');
                    tiedToButton.className = `${SpecialClasses.ReferenceTarget} dummy`;
                    entry.appendChild(tiedToButton);

                    tiedToButton.addEventListener('click', (e) => {
                        if (this.selectingLinkFor && parameter.belongsTo) {
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            e.preventDefault();

                            const nodeEditorContainer = document.createElement('div');

                            const evaluator = new ParameterRelationshipEvaluator(
                                parameter.belongsTo.component.parameters.getById(parameter.id)!.type,
                                this.selectingLinkFor.belongsTo!.component.parameters.getById(this.selectingLinkFor.id)!.type,
                            );
                            const nodeEditor = new NodeRenderer(nodeEditorContainer, evaluator);
                            const modal = new ModalRenderer(nodeEditorContainer);

                            this.selectingLinkFor = null;
                        }
                    });

                    if (factory) {
                        const parameterMapping = factory.parameterMapping.getById(parameter.id);
                        tiedToButton.classList.remove('dummy');

                        if (parameterMapping?.isReference) {
                            tiedToButton.classList.add('entry-is-reference');

                            tiedToButton.addEventListener('click', (e) => {
                                e.stopPropagation();

                                const [, foundInComponent, foundInParameter] = parameterMapping.resolveValue();

                                const boundingBox = tiedToButton.getBoundingClientRect();
                                this.maginet.contextMenuRenderer.summonContextMenu(
                                    boundingBox.left,
                                    boundingBox.bottom,
                                    [
                                        {
                                            type: ContextEntryType.Info,
                                            text: `Tied to _${
                                                foundInComponent
                                                    ?.component
                                                    .parameters
                                                    .getById((foundInParameter)!)
                                                    ?.displayKey
                                                || '<unknown>'
                                            }_ in _${
                                                foundInComponent
                                                    ?.component
                                                    .displayName ||
                                                '<unknown>'
                                            }_`,
                                        },
                                        {
                                            type: ContextEntryType.Separator,
                                        },
                                        {
                                            type: ContextEntryType.Button,
                                            label: 'Detach',
                                            onClick: () => {
                                                factory!.setParameter(
                                                    parameter.id,
                                                    {
                                                        value: instance.parameterValues.getById(parameter.id)!.value,
                                                        isReference: false,
                                                    },
                                                );
                                                this.maginet.rerender([factory!]);

                                                return true;
                                            },
                                        },
                                    ],
                                );
                            });
                        } else {
                            tiedToButton.classList.add('add-entry-reference');

                            tiedToButton.addEventListener('click', (e) => {
                                e.stopPropagation();

                                const boundingBox = tiedToButton.getBoundingClientRect();
                                this.maginet.contextMenuRenderer.summonContextMenu(
                                    boundingBox.left,
                                    boundingBox.bottom,
                                    [
                                        {
                                            type: ContextEntryType.Info,
                                            text: `Parameter value`,
                                        },
                                        {
                                            type: ContextEntryType.Separator,
                                        },
                                        {
                                            type: ContextEntryType.Button,
                                            label: 'Link to value...',
                                            onClick: () => {
                                                tiedToButton.classList.add(SpecialClasses.ReferenceSource);
                                                this.selectingLinkFor = parameterMapping!;

                                                return true;
                                            },
                                        },
                                    ],
                                );
                            });
                        }
                    }

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

                        valueLabel.setAttribute('id', `${parameter.contextualId}::opener`);

                        const childList = document.createElement('ol');
                        childList.replaceChildren(...value as HTMLElement[]);
                        entry.appendChild(propertyLabel);

                        valueLabel.appendChild(propertyLabel);
                        valueLabel.appendChild(childList);

                        entry.appendChild(valueLabel);
                    }

                    entry.setAttribute('id', parameter.contextualId);
                    entry.appendChild(valueLabel);

                    listHere.appendChild(entry);
                };

                const label = document.createElement('summary');
                label.className = SpecialClasses.DatumPropertyLabel;
                label.innerText = instance.component.displayName;

                instance
                    .parameterValues
                    .forEach(parameter => {
                        const parameterData = instance.component.parameters.getById(parameter.id)!;
                        const parameterSource = factory?.parameterMapping.getById(parameter.id) || parameter;

                        if (parameterData.type !== ParameterTyping.Children) {
                            addPropertyEntry(
                                parameterData.displayKey,
                                DataRenderer.getEditorFor(
                                    this.maginet,
                                    parameterSource,
                                ),
                                parameterSource,
                            );
                        } else {
                            addPropertyEntry(
                                parameterData.displayKey,
                                formatProperties(
                                    (parameterSource.value as ComponentInstanceFactory[]).map(
                                        e => [
                                            e.composeComponentInstance(),
                                            e,
                                        ],
                                    ),
                                ),
                                parameterSource,
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
                if (location && factory.parent?.component) {
                    const container = document.getElementById(
                        `${factory.parent.component.id}.${factory.parent.parameterId}::opener`,
                    )?.closest('li');

                    if (container) {
                        container.replaceWith(...formatProperties(
                            [
                                [
                                    factory.composeComponentInstance(),
                                    factory,
                                ],
                            ],
                        ));
                        continue;
                    }
                }

                this.renderList();
                break;
            }
        } else {
            list.replaceChildren(...formatProperties([
                [
                    this.viewingComponent,
                    null,
                ],
            ]));
            this.parent.replaceChildren(list);
            this.ensureFocus(this.focussingOn);
        }
    }
}