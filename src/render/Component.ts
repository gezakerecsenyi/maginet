import getDefaultValueForType from '../lib/utils/getDefaultValueForType';
import MaginetError from '../lib/utils/MaginetError';
import SearchableMap from '../lib/utils/SearchableMap';
import {
    ImmutableSpecialParameters,
    ParametersFrom,
    ParameterType,
    ParameterValue,
    ParameterValueType,
    RenderMethod,
    SpecialParameterId,
} from '../types';
import ComponentInstanceFactory, { ParameterCalculator } from './ComponentInstanceFactory';
import Renderer from './Renderer';

export default class Component<T extends string = string> {
    public parameters: SearchableMap<T | SpecialParameterId, ParametersFrom<T>>;
    public id: string;
    public renderMethod: RenderMethod<T>;
    public displayName: string;
    public isSelectable: boolean;
    public defaultParameterValues: ParameterValue<T>[];
    public contents: ComponentInstanceFactory[];

    constructor(
        parameters: ParametersFrom<Exclude<T, ImmutableSpecialParameters>>[],
        allowChildren: boolean,
        contents: ComponentInstanceFactory[],
        renderMethod: RenderMethod<T>,
        id: string,
        displayName: string,
        isSelectable: boolean = true,
        defaultParameterValues: ParameterValue<T>[] = [],
    ) {
        this.isSelectable = isSelectable;
        this.displayName = displayName;
        this.contents = contents;
        this.parameters = new SearchableMap<T | SpecialParameterId, ParametersFrom<T>>(...[
            ...parameters,
            {
                displayKey: 'X',
                id: SpecialParameterId.X,
                type: ParameterType.Size,
            },
            {
                displayKey: 'Y',
                id: SpecialParameterId.Y,
                type: ParameterType.Size,
            },
            {
                displayKey: 'Layer Depth',
                id: SpecialParameterId.LayerDepth,
                type: ParameterType.Number,
            },
            {
                displayKey: 'Width',
                id: SpecialParameterId.Width,
                type: ParameterType.Size,
            },
            {
                displayKey: 'Height',
                id: SpecialParameterId.Height,
                type: ParameterType.Size,
            },
            {
                displayKey: 'Component contents',
                id: SpecialParameterId.Contents,
                type: ParameterType.Children,
                isRenderedAsChildren: true,
                isImmutable: true,
            },
            ...(
                allowChildren ?
                    [
                        {
                            displayKey: 'Sublayers',
                            id: SpecialParameterId.Children,
                            type: ParameterType.Children,
                            isRenderedAsChildren: true,
                        } as const,
                    ] :
                    []
            ),
        ]);
        this.defaultParameterValues = this
            .parameters
            .map(e => {
                const lookup = defaultParameterValues.find(d => d.id === e.id);
                if (lookup) {
                    return lookup;
                }

                return {
                    id: e.id,
                    value: getDefaultValueForType(e.type),
                };
            });
        this.renderMethod = renderMethod;
        this.id = id;
    }

    render(
        parameterValues: SearchableMap<T | SpecialParameterId, ParameterValue<T>>,
        srcInstance: ComponentInstanceFactory<Component<T | SpecialParameterId>> | null,
        renderer: Renderer,
    ) {
        let renderRes!: HTMLElement;
        try {
            renderRes = this.renderMethod(parameterValues, renderer);

            if (!renderRes) throw 0;
        } catch (err: any) {
            // prevent nested catches (thus blaming the top-most element)
            if (err.name === MaginetError.Name) {
                throw err;
            }

            throw new MaginetError(
                `Failed to render component of type ${this.displayName} (${this.id}/` +
                `${srcInstance?.id || '[unknown]'}). Check that all data is properly being passed in, and that the ` +
                `render method is complete.\n\nExpected parameters:\n` + this
                    .parameters
                    .map(e => `\t${e.displayKey} (${e.id})`)
                    .join('\n')
                + `\n\nGot:\n` + parameterValues
                    .map(e => `\t${e.id} == ${MaginetError.processValue(e.value)}`)
                    .join('\n')
                + `\n\nFrom:\n` + (
                    srcInstance
                        ?.parameterMapping
                        .map(e => `\t${e.id} == ${e.value ?
                            MaginetError.processValue(e.value) :
                            `[reference to ${e.tiedTo?.locationId}::${e.tiedTo?.id}]`}`)
                        .join('\n') || '\t[unknown]'
                ) + `\n\n(+assuming defaults of:\n` + this
                    .defaultParameterValues
                    .map(e => `\t${e.id} == ${MaginetError.processValue(e.value)}`)
                    .join('\n')
                + `)\n`,
            );
        }

        if (renderer.interactable && srcInstance) {
            renderRes.setAttribute('id', srcInstance.getInstanceId());
            return renderer.maginet.makeSelectable(renderRes, srcInstance as ComponentInstanceFactory<any>);
        } else {
            return renderRes;
        }
    }

    withDefaults(value: (ParameterCalculator<T | SpecialParameterId> | ParameterValue<T>)[]): SearchableMap<
        T | SpecialParameterId,
        {
            id: T | SpecialParameterId,
            isReference?: boolean,
            value?: ParameterValueType
        }
    > {
        return new SearchableMap(...value)
            .concatIfNew(
                ...this
                    .defaultParameterValues
                    .map(e => ({
                        ...e,
                        isReference: false,
                    })),
            )
            .concatOrReplace(
                ...this
                    .defaultParameterValues
                    .filter(e => this.parameters.getById(e.id)!.isImmutable)
                    .map(e => ({
                        ...e,
                        isReference: false,
                    })),
            )
            .concatOrReplace(
                {
                    id: SpecialParameterId.Contents,
                    isReference: false,
                    value: this.contents,
                },
            );
    }

    addParameter(key: string, type: ParameterType, id: T) {
        this.parameters.push({
            displayKey: key,
            type,
            id,
        });
    }

    removeParameter(id: T) {
        this.parameters = this.parameters.sFilter(e => e.id !== id);
    }
}