import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import { SpecialClasses, SpecialParameterId } from '../../types';
import { DefiniteParameterCalculator } from './ParameterCalculator';
import RenderContext from './RenderContext';
import SearchableMap from './SearchableMap';
import Size from './Size';

export default function renderAsBlock(width?: Size, height?: Size, htmlClassName?: string) {
    return (
        dataHere: SearchableMap<string | SpecialParameterId, DefiniteParameterCalculator<string>>,
        renderer: RenderContext,
    ): HTMLElement => {
        const element = document.createElement('div');
        element.style.position = 'relative';
        element.className = `${SpecialClasses.GeneratedBlock} ${htmlClassName || ''}`;
        element.style.width = width?.toCSSString() || '0px';
        element.style.height = height?.toCSSString() || '0px';

        [
            SpecialParameterId.Contents,
            SpecialParameterId.Children,
        ]
            .map((childListName) => (
                    dataHere
                        .find(e => e.id === childListName)
                        ?.value as ComponentInstanceFactory[] || []
                )
                    .map(child => child.composeComponentInstance())
                    .map(child => {
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
                    }),
            )
            .flat()
            .forEach(child => {
                element.appendChild(child);
            });

        return element;
    };
}