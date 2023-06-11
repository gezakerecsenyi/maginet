import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import RenderContext from '../../render/RenderContext';
import { ParameterValue, SpecialClasses, SpecialParameterId } from '../../types';
import Size from './Size';

export default function renderAsBlock(width?: Size, height?: Size, htmlClassName?: string) {
    return (dataHere: ParameterValue[], renderer: RenderContext): HTMLElement => {
        const element = document.createElement('div');
        element.style.position = 'relative';
        element.className = `${SpecialClasses.GeneratedBlock} ${htmlClassName || ''}`;
        element.style.width = width?.toCSSString() || '0px';
        element.style.height = height?.toCSSString() || '0px';

        const children = [
            ...(
                dataHere
                    .find(e => e.id === SpecialParameterId.Contents)
                    ?.value || []
            ) as ComponentInstanceFactory[],
            ...(
                dataHere
                    .find(e => e.id === SpecialParameterId.Children)
                    ?.value || []
            ) as ComponentInstanceFactory[],
        ];
        children
            .map((child) => child.composeComponentInstance(renderer.maginet.magazine))
            .map((child) => {
                const element = child.render(renderer);

                element.style.position = 'absolute';
                element.style.top = (
                    child
                        .parameterValues
                        .getById(SpecialParameterId.Y)!.value as Size
                ).toCSSString();
                element.style.left = (
                    child
                        .parameterValues
                        .getById(SpecialParameterId.X)!.value as Size
                ).toCSSString();

                return element;
            })
            .forEach(child => {
                element.appendChild(child);
            });

        return element;
    };
}