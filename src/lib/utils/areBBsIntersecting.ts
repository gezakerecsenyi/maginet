export interface BasicDOMRect {
    left: number,
    right: number,
    top: number,
    bottom: number,
    width: number,
    height: number,
}

export function doesBBCrossBB(bb1: BasicDOMRect, bb2: BasicDOMRect) {
    let leftIsIntersecting = bb1.left >= bb2.left && bb1.left <= bb2.right;
    let rightIsIntersecting = bb1.right <= bb2.right && bb1.right >= bb2.left;
    let topIsIntersecting = bb1.top >= bb2.top && bb1.top <= bb2.bottom;
    let bottomIsIntersecting = bb1.bottom <= bb2.bottom && bb1.bottom >= bb2.top;

    return (leftIsIntersecting || rightIsIntersecting) && (topIsIntersecting || bottomIsIntersecting);
}

export default function areBBsIntersecting(bb1: BasicDOMRect, bb2: BasicDOMRect) {
    return doesBBCrossBB(bb1, bb2) || doesBBCrossBB(bb2, bb1);
}