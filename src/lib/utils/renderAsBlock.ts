import Maginet from '../../Maginet';
import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import { DefaultParameterId, ParameterValue } from '../../types';
import Size from './Size';

export default function renderAsBlock(width?: Size, height?: Size, htmlClassName?: string) {
    return (dataHere: ParameterValue[], maginet: Maginet): HTMLElement => {
        const element = document.createElement('div');
        element.style.position = 'relative';
        element.className = `generated-rendered-block ${htmlClassName || ''}`;
        element.style.width = width?.toString() || '0px';
        element.style.height = height?.toString() || '0px';

        const children = [
            ...(
                dataHere
                    .find(e => e.id === DefaultParameterId.Contents)
                    ?.value || []
            ) as ComponentInstanceFactory[],
            ...(
                dataHere
                    .find(e => e.id === DefaultParameterId.Children)
                    ?.value || []
            ) as ComponentInstanceFactory[],
        ];
        children
            .map(child => child.composeComponentInstance(maginet.magazine))
            .map(child => {
                const element = child.render(maginet);

                element.style.position = 'absolute';
                element.style.top = (
                    child
                        .parameterValues
                        .find((e: ParameterValue) => e.id === DefaultParameterId.Y)!.value as Size
                ).toString();
                element.style.left = (
                    child
                        .parameterValues
                        .find((e: ParameterValue) => e.id === DefaultParameterId.X)!.value as Size
                ).toString();

                return element;
            })
            .forEach(child => {
                element.appendChild(child);
            });

        return element;
    };
}