import { v4 } from 'uuid';
import { availableNodes } from '../lib/nodes/availableNodes';
import Maginet from '../Maginet';
import NodeInstance from '../nodes/NodeInstance';
import {
    DropdownTyping,
    IOType,
    NodeDatumSpecification,
    NodeInputMapping,
    NodeInputsSpecification,
    SpecialNodeIds,
} from '../nodes/nodeTypes';
import ParameterRelationshipEvaluator from '../nodes/ParameterRelationshipEvaluator';
import { SpecialClasses } from '../types';
import { ContextEntryType, ContextMenuButton } from './ContextMenuRenderer';

export default class NodeRenderer {
    container: HTMLElement;
    viewWindow: HTMLElement;
    evaluator: ParameterRelationshipEvaluator;
    maginet: Maginet;
    private mouseIsDown: boolean = false;
    private middleButtonIsDown: boolean = false;
    private newConnectionLine: HTMLElement;
    private aboutToDropOn: [NodeInstance<string, string>, NodeInputMapping<any> & NodeInputsSpecification<any>] | null = null;

    constructor(container: HTMLElement, evaluator: ParameterRelationshipEvaluator, maginet: Maginet) {
        this.container = container;
        this.evaluator = evaluator;
        this.maginet = maginet;

        this.newConnectionLine = document.createElement('div');
        this.newConnectionLine.className = `connection-line hidden`;

        container.className = SpecialClasses.NodeEditor;

        this.viewWindow = document.createElement('div');
        this.viewWindow.className = 'node-view-window';
        container.replaceChildren(this.newConnectionLine, this.viewWindow);

        this.x = 0;
        this.y = 0;

        container.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
        container.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        container.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
        container.addEventListener('mousedown', this.handleWorkspaceClick.bind(this));
        container.addEventListener('contextmenu', this.showContextMenu.bind(this));

        this.drawNodes();
    }

    private _draggingBlob: [NodeInstance<string>, NodeDatumSpecification<any, IOType>, HTMLElement] | null = null;

    get draggingBlob() {
        return this._draggingBlob;
    }

    set draggingBlob(value) {
        if (value) {
            this.newConnectionLine.classList.remove('hidden');

            const containerRect = this.container.getBoundingClientRect();
            const rect = value[2].getBoundingClientRect();
            this.newConnectionLine.style.left = `${rect.left - containerRect.left + 5}px`;
            this.newConnectionLine.style.top = `${rect.top - containerRect.top + 5}px`;
            this.newConnectionLine.style.height = `0`;
        } else {
            this.newConnectionLine.classList.add('hidden');
        }

        this._draggingBlob = value;
    }

    private _selectedNode: NodeInstance | null = null;

    get selectedNode() {
        return this._selectedNode;
    }

    set selectedNode(node: NodeInstance | null) {
        if (this.selectedNode) {
            const currentNodeElem = this.viewWindow.querySelector(`#${NodeRenderer.getNodeId(this.selectedNode)}`) as HTMLElement | null;

            if (currentNodeElem) {
                currentNodeElem.classList.remove('selected');
            }
        }

        if (node) {
            const nodeElem = this.viewWindow.querySelector(`#${NodeRenderer.getNodeId(node)}`) as HTMLElement | null;

            if (nodeElem) {
                nodeElem.classList.add('selected');
            }
        }

        this._selectedNode = node;
    }

    private _x!: number;

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this.viewWindow.style.left = `${value}px`;

        this._x = value;
    }

    private _y!: number;

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this.viewWindow.style.top = `${value}px`;

        this._y = value;
    }

    static getConnectionLine(a: { x: number, y: number }, b: { x: number, y: number }, element?: HTMLElement | null) {
        const angle = Math.atan2(a.y - b.y, a.x - b.x);
        const length = Math.sqrt(
            Math.pow(a.y - b.y, 2) +
            Math.pow(a.x - b.x, 2),
        );

        let elementToUse = element;
        if (!elementToUse) {
            elementToUse = document.createElement('div');
            elementToUse.className = 'connection-line';
        }

        elementToUse.style.height = `${length}px`;
        elementToUse.style.transform = `rotate(${angle - Math.PI / 2}rad)`;

        return elementToUse;
    }

    static getNodeId(node: NodeInstance) {
        return `node-${node.id}`;
    }

    static getInputId(node: NodeInstance, input: NodeInputMapping<string> | NodeDatumSpecification<string, IOType>) {
        return `io-${node.id}-${input.id}-${input.datumType}`;
    }

    static getLineId(node: NodeInstance, input: NodeInputMapping<string> | NodeDatumSpecification<string, IOType>) {
        return `line-${node.id}-${input.id}-${input.datumType}`;
    }

    markSelected() {
        this.selectedNode = this.selectedNode;
    }

    handleMouseUp() {
        if (this.aboutToDropOn && this.draggingBlob) {
            this.aboutToDropOn[0].inputMappings.updateById(this.aboutToDropOn[1].id, {
                isReference: true,
                referenceTo: {
                    node: this.draggingBlob[0],
                    parameterId: this.draggingBlob[1].id,
                },
            });
        }

        this.mouseIsDown = false;
        this.middleButtonIsDown = false;
        this.draggingBlob = null;

        this.drawNodes();
    }

    handleMouseDown(e: MouseEvent) {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();

            this.middleButtonIsDown = true;
        }
    }

    showContextMenu(ev: MouseEvent) {
        ev.preventDefault();

        this
            .maginet
            .contextMenuRenderer
            .summonContextMenu(
                ev.clientX,
                ev.clientY,
                availableNodes.map((e): ContextMenuButton => (
                    {
                        type: ContextEntryType.Button,
                        label: e.displayName,
                        onClick: () => {
                            const boundingBox = this.container.getBoundingClientRect();

                            const instance = new NodeInstance(
                                v4(),
                                e,
                                [],
                                ev.clientX - boundingBox.left - this.x,
                                ev.clientY - boundingBox.top - this.y,
                            );
                            this.evaluator.nodes.push(instance);

                            this.selectedNode = instance;
                            this.mouseIsDown = true;

                            this.drawNodes();

                            return true;
                        },
                    }
                )),
            );
    }

    handleWorkspaceClick(e: MouseEvent) {
        if ((e.target as HTMLElement).classList.contains(SpecialClasses.NodeEditor)) {
            this.selectedNode = null;
        }
    }

    handleMouseMove(e: MouseEvent) {
        if (this.middleButtonIsDown) {
            this.x += e.movementX;
            this.y += e.movementY;

            return;
        }

        if (this.mouseIsDown && this.draggingBlob) {
            const blobPos = this.draggingBlob[2].getBoundingClientRect();

            this.newConnectionLine = NodeRenderer.getConnectionLine(
                {
                    x: e.clientX,
                    y: e.clientY,
                },
                {
                    x: blobPos.left,
                    y: blobPos.top,
                },
                this.newConnectionLine,
            );

            return;
        }

        if (this.mouseIsDown && this.selectedNode) {
            this.selectedNode.x += e.movementX;
            this.selectedNode.y += e.movementY;

            this.updateNodePositions();
            this.drawConnections();
        }
    }

    drawNodes() {
        const nodes = this
            .evaluator
            .nodes
            .map(node => {
                const container = document.createElement('div');
                container.className = 'node';
                container.id = NodeRenderer.getNodeId(node);

                const nodeName = document.createElement('h4');
                nodeName.innerText = node.node.displayName;

                const ioContainer = document.createElement('div');
                ioContainer.className = 'io-container';

                const nodePropertyList = document.createElement('ul');
                node
                    .inputMappings
                    .asSecondaryKey(node.node.inputs)
                    .forEach(input => {
                        const inputHere = document.createElement('li');

                        const nodeBlob = document.createElement('div');
                        nodeBlob.className = 'node-blob nb-l';
                        nodeBlob.id = NodeRenderer.getInputId(node, input);

                        nodeBlob.addEventListener('mouseover', () => {
                            if (this.draggingBlob) {
                                nodeBlob.classList.add('will-snap');

                                if (
                                    this.draggingBlob[1].type === input.type ||
                                    this.draggingBlob[0].node.id === SpecialNodeIds.Saver ||
                                    node.node.id === SpecialNodeIds.Saver || (
                                        input.type === DropdownTyping.Dropdown &&
                                        input.dropdownName === this.draggingBlob[1].dropdownContext
                                    )
                                ) {
                                    nodeBlob.classList.remove('illegal');
                                    this.aboutToDropOn = [
                                        node,
                                        input,
                                    ];
                                } else {
                                    nodeBlob.classList.add('illegal');
                                }
                            }
                        }, true);

                        nodeBlob.addEventListener('mouseout', () => {
                            nodeBlob.classList.remove('will-snap');
                            nodeBlob.classList.remove('illegal');
                            this.aboutToDropOn = null;
                        }, true);

                        nodeBlob.addEventListener('mousedown', (e) => {
                            if (input.isReference) {
                                e.preventDefault();
                                e.stopPropagation();

                                node.inputMappings.updateById(input.id, {
                                    isReference: false,
                                });
                                this.drawNodes();
                            }
                        });

                        const nameLabel = document.createElement('span');
                        nameLabel.innerText = input.displayName;

                        inputHere.appendChild(nodeBlob);
                        inputHere.appendChild(nameLabel);

                        nodePropertyList.appendChild(inputHere);
                    });

                const nodeOutputList = document.createElement('ul');
                node
                    .node
                    .outputs
                    .forEach(output => {
                        const outputHere = document.createElement('li');

                        const nodeBlob = document.createElement('div');
                        nodeBlob.className = 'node-blob nb-r';
                        nodeBlob.id = NodeRenderer.getInputId(node, output);

                        nodeBlob.addEventListener('mousedown', (e) => this.handleBlobDrag(e, node, output));

                        const nameLabel = document.createElement('span');
                        nameLabel.innerText = output.displayName;

                        outputHere.appendChild(nameLabel);
                        outputHere.appendChild(nodeBlob);

                        nodeOutputList.appendChild(outputHere);
                    });

                container.addEventListener('mousedown', () => this.handleNodeClick(node));

                ioContainer.replaceChildren(nodePropertyList, nodeOutputList);
                container.replaceChildren(nodeName, ioContainer);

                return container;
            });

        this.viewWindow.replaceChildren(...nodes);
        this.updateNodePositions();
        this.drawConnections();
        this.markSelected();
    }

    drawConnections() {
        const containerOffset = this.viewWindow.getBoundingClientRect();

        let isBad = false;
        for (let node of this.evaluator.nodes) {
            if (isBad) {
                break;
            }

            for (let input of node.inputMappings) {
                if (input.isReference) {
                    const inputHere = document.getElementById(NodeRenderer.getInputId(node, input));

                    if (inputHere) {
                        const inputPos = inputHere.getBoundingClientRect();

                        const fromOutput = document.getElementById(
                            NodeRenderer.getInputId(
                                input.referenceTo!.node,
                                input.referenceTo!.node.node.outputs.getById(input.referenceTo!.parameterId)!,
                            ),
                        );
                        const outputPos = fromOutput!.getBoundingClientRect();

                        const nodeElem = NodeRenderer.getConnectionLine(
                            inputPos,
                            outputPos,
                            document.getElementById(NodeRenderer.getLineId(node, input)),
                        );

                        nodeElem.style.top = `${outputPos.y - containerOffset.y + 5}px`;
                        nodeElem.style.left = `${outputPos.x - containerOffset.x + 5}px`;
                        nodeElem.setAttribute('id', NodeRenderer.getLineId(node, input));

                        this.viewWindow.appendChild(nodeElem);
                    } else {
                        isBad = true;
                        break;
                    }
                }
            }
        }

        if (isBad) {
            window.setTimeout(() => this.drawConnections(), 0);
        }
    }

    handleNodeClick(node: NodeInstance) {
        this.mouseIsDown = true;
        this.selectedNode = node;
    }

    updateNodePositions() {
        this
            .evaluator
            .nodes
            .forEach(node => {
                const nodeElem = this.viewWindow.querySelector(`#node-${node.id}`) as HTMLElement | null;

                if (nodeElem) {
                    nodeElem.style.left = `${node.x}px`;
                    nodeElem.style.top = `${node.y}px`;
                }
            });
    }

    handleBlobDrag(
        event: MouseEvent,
        node: NodeInstance,
        output: NodeDatumSpecification<any, IOType>,
    ) {
        event.preventDefault();
        event.stopPropagation();

        this.draggingBlob = [
            node,
            output,
            event.target as HTMLElement,
        ];
        this.mouseIsDown = true;
    }
}