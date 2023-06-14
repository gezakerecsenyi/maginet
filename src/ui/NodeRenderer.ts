import NodeInstance from '../nodes/NodeInstance';
import { NodeDatumSpecification } from '../nodes/nodeTypes';
import ParameterRelationshipEvaluator from '../nodes/ParameterRelationshipEvaluator';
import { SpecialClasses } from '../types';

export default class NodeRenderer {
    container: HTMLElement;
    viewWindow: HTMLElement;
    evaluator: ParameterRelationshipEvaluator;
    private mouseIsDown: boolean = false;
    private middleButtonIsDown: boolean = false;
    private newConnectionLine: HTMLElement;

    constructor(container: HTMLElement, evaluator: ParameterRelationshipEvaluator) {
        this.container = container;
        this.evaluator = evaluator;

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

        this.drawNodes();
    }

    private _draggingBlob: [NodeInstance<string>, NodeDatumSpecification<any>, HTMLElement] | null = null;

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
            const currentNodeElem = this.viewWindow.querySelector(`#node-${this.selectedNode.id}`) as HTMLElement | null;

            if (currentNodeElem) {
                currentNodeElem.classList.remove('selected');
            }
        }

        if (node) {
            const nodeElem = this.viewWindow.querySelector(`#node-${node.id}`) as HTMLElement | null;

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

    handleMouseUp() {
        this.mouseIsDown = false;
        this.middleButtonIsDown = false;
        this.draggingBlob = null;
    }

    handleMouseDown(e: MouseEvent) {
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();

            this.middleButtonIsDown = true;
        }
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

            const angle = Math.atan2(e.clientY - blobPos.top, e.clientX - blobPos.left);
            const length = Math.sqrt(
                Math.pow(e.clientY - blobPos.top, 2) +
                Math.pow(e.clientX - blobPos.left, 2),
            );

            this.newConnectionLine.style.height = `${length}px`;
            this.newConnectionLine.style.transform = `rotate(${angle - Math.PI / 2}rad)`;

            return;
        }

        if (this.mouseIsDown && this.selectedNode) {
            this.selectedNode.x += e.movementX;
            this.selectedNode.y += e.movementY;

            this.updateNodePositions();
        }
    }

    drawNodes() {
        const nodes = this
            .evaluator
            .nodes
            .map(node => {
                const container = document.createElement('div');
                container.className = 'node';
                container.id = `node-${node.id}`;

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
                        nodeBlob.id = `io-${node.id}-${input.id}`;

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
                        nodeBlob.id = `io-${node.id}-${output.id}`;

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
        output: NodeDatumSpecification<any>,
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