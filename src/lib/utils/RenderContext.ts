import Maginet from '../../Maginet';

export default class RenderContext {
    public maginet: Maginet;
    public interactable: boolean;

    constructor(maginet: Maginet, interactable: boolean = true) {
        this.maginet = maginet;
        this.interactable = interactable;
    }
}