import getDefaultValueForType from '../lib/utils/getDefaultValueForType';
import MaginetError from '../lib/utils/MaginetError';
import { DefiniteParameterCalculator, ParameterCalculator } from '../lib/utils/ParameterCalculator';
import RenderContext from '../lib/utils/RenderContext';
import SearchableMap from '../lib/utils/SearchableMap';
import validateType from '../lib/utils/validateType';
import {
    ComponentCompositionType,
    ImmutableSpecialParameters,
    ParametersFrom,
    ParameterTyping,
    RenderMethod,
    SpecialParameterId,
    UIBindingSpec,
} from '../types';
import { PopulatedWindow } from '../window';
import ComponentInstanceFactory from './ComponentInstanceFactory';

export default class Component<IDs extends string = string> {
    public parameters: SearchableMap<IDs | SpecialParameterId, ParametersFrom<IDs>>;
    public id: string;
    public renderMethod: RenderMethod<IDs>;
    public displayName: string;
    public isSelectable: boolean;
    public defaultParameterValues: DefiniteParameterCalculator<IDs>[];
    public contents: ComponentInstanceFactory[];
    public bindUITo: UIBindingSpec<IDs>;
    public readonly compositionType = ComponentCompositionType.Specification;
    public component = this;

    constructor(
        parameters: ParametersFrom<Exclude<IDs, ImmutableSpecialParameters>>[],
        allowChildren: boolean,
        contents: ComponentInstanceFactory[],
        renderMethod: RenderMethod<IDs>,
        id: string,
        displayName: string,
        isSelectable: boolean = true,
        defaultParameterValues: DefiniteParameterCalculator<IDs>[] = [],
        bindUITo: UIBindingSpec<IDs> = {
            width: [SpecialParameterId.Width],
            height: [SpecialParameterId.Height],
        },
    ) {
        this.isSelectable = isSelectable;
        this.displayName = displayName;
        this.contents = contents;
        this.bindUITo = bindUITo;
        this.parameters = new SearchableMap<IDs | SpecialParameterId, ParametersFrom<IDs>>(...[
            ...parameters,
            {
                displayKey: 'X',
                id: SpecialParameterId.X,
                type: ParameterTyping.Size,
            },
            {
                displayKey: 'Y',
                id: SpecialParameterId.Y,
                type: ParameterTyping.Size,
            },
            {
                displayKey: 'Layer Depth',
                id: SpecialParameterId.LayerDepth,
                type: ParameterTyping.Number,
            },
            {
                displayKey: 'Width',
                id: SpecialParameterId.Width,
                type: ParameterTyping.Size,
            },
            {
                displayKey: 'Height',
                id: SpecialParameterId.Height,
                type: ParameterTyping.Size,
            },
            {
                displayKey: 'Component contents',
                id: SpecialParameterId.Contents,
                type: ParameterTyping.Children,
                isRenderedAsChildren: true,
                isImmutable: true,
            },
            ...(
                allowChildren ?
                    [
                        {
                            displayKey: 'Sublayers',
                            id: SpecialParameterId.Children,
                            type: ParameterTyping.Children,
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

                return new ParameterCalculator(
                    e.id,
                    {
                        isReference: false,
                        value: getDefaultValueForType(e.type),
                    },
                );
            });

        if ((window as PopulatedWindow).debug) {
            this
                .parameters
                .asSecondaryKey(this.defaultParameterValues)
                .forEach(param => {
                    if (!validateType(param.type, param.value!)) {
                        throw new MaginetError(
                            `Detected discrepancy in passed data for parameter ${param.displayKey} (in ` +
                            `default value specification for ${this.displayName}):\n` +
                            `\tExpected type: ${param.type}\n\tGot value: ` +
                            `${MaginetError.processValue(param.value)}\n`,
                        );
                    }
                });
        }

        this.renderMethod = renderMethod;
        this.id = id;
    }

    render(
        parameterValues: SearchableMap<SpecialParameterId | IDs, DefiniteParameterCalculator<IDs>>,
        srcInstance: ComponentInstanceFactory<SpecialParameterId | IDs, any> | null,
        renderer: RenderContext,
    ) {
        let renderRes!: HTMLElement;
        try {
            renderRes = this.renderMethod(parameterValues, renderer);

            if (!renderRes) throw 0;
        } catch (err: any) {
            // prevent nested catches (thus blaming the top-most component)
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
                            `[reference to ${e.tiedTo?.inComponent.id}::${e.tiedTo?.parameterId}]`}`)
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

    withDefaults(value: (ParameterCalculator<IDs | SpecialParameterId>)[]): SearchableMap<
        IDs | SpecialParameterId,
        DefiniteParameterCalculator<IDs>
    > {
        return new SearchableMap(...value)
            .concatIfNew(
                ...this
                    .defaultParameterValues
                    .map(e => e),
            )
            .concatOrReplace(
                ...this
                    .defaultParameterValues
                    .filter(e => this.parameters.getById(e.id)!.isImmutable)
                    .map(e => new ParameterCalculator(e.id, {
                        ...e.data,
                        isReference: false,
                    })),
            )
            .concatOrReplace(
                new ParameterCalculator(
                    SpecialParameterId.Contents,
                    {
                        value: this.contents,
                        isReference: false,
                    },
                ),
            );
    }

    addParameter(key: string, type: ParameterTyping, id: IDs) {
        this.parameters.push({
            displayKey: key,
            type,
            id,
        });
    }

    removeParameter(id: IDs) {
        this.parameters = this.parameters.sFilter(e => e.id !== id);
    }
}