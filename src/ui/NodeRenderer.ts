import NodeInstance from '../nodes/NodeInstance';
import ParameterRelationshipEvaluator from '../nodes/ParameterRelationshipEvaluator';
import { SpecialClasses } from '../types';

export default class NodeRenderer {
    container: HTMLElement;
    viewWindow: HTMLElement;
    evaluator: ParameterRelationshipEvaluator;
    private mouseIsDown: boolean = false;
    private middleButtonIsDown: boolean = false;

    constructor(container: HTMLElement, evaluator: ParameterRelationshipEvaluator) {
        this.container = container;
        this.evaluator = evaluator;

        container.className = SpecialClasses.NodeEditor;

        this.viewWindow = document.createElement('div');
        this.viewWindow.className = 'node-view-window';
        container.replaceChildren(this.viewWindow);

        this.x = 0;
        this.y = 0;

        container.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
        container.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        container.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
        container.addEventListener('mousedown', this.handleWorkspaceClick.bind(this));

        this.drawNodes();
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

                        const nameLabel = document.createElement('span');
                        nameLabel.innerText = input.displayName;

                        inputHere.appendChild(nameLabel);

                        nodePropertyList.appendChild(inputHere);
                    });

                const nodeOutputList = document.createElement('ul');
                node
                    .node
                    .outputs
                    .forEach(input => {
                        const outputHere = document.createElement('li');

                        const nameLabel = document.createElement('span');
                        nameLabel.innerText = input.displayName;

                        outputHere.appendChild(nameLabel);
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
}