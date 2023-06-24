import ParameterRelationshipEvaluator from '../../nodes/ParameterRelationshipEvaluator';
import ComponentInstance from '../../render/ComponentInstance';
import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import {
    ComponentCompositionType,
    ParameterAssociationDescriptor,
    ParameterValueDatum,
    ParentComponent,
    SpecialParameterId,
} from '../../types';

export interface ParameterCalculatorData<BelongsTo extends string = string, IsReference extends boolean = any> {
    isReference: IsReference;
    value?: ParameterValueDatum;
    belongsTo?: ComponentInstanceFactory<BelongsTo, any> | ComponentInstance<BelongsTo, any>;
    tiedTo?: ParameterAssociationDescriptor;
    relationshipEvaluator?: ParameterRelationshipEvaluator;
}

export type DefiniteParameterCalculator<T extends string> = ParameterCalculator<T | SpecialParameterId, false>;

export class ParameterCalculator<BelongsToIDs extends string, IsReference extends boolean = any> {
    isReference: IsReference;
    tiedTo?: ParameterAssociationDescriptor;
    value?: ParameterValueDatum;
    relationshipEvaluator?: ParameterRelationshipEvaluator;
    contextualId: string = '';

    constructor(id: BelongsToIDs | SpecialParameterId, data: ParameterCalculatorData<BelongsToIDs, IsReference>) {
        this.id = id;
        this.belongsTo = data.belongsTo || null;

        this.isReference = data.isReference;
        this.tiedTo = data.tiedTo;
        this.value = data.value;
        this.relationshipEvaluator = data.relationshipEvaluator;

        const type = this.dataType;
        if (this.isReference && this.tiedTo && type && !data.relationshipEvaluator) {
            const sourceParamType = this
                .tiedTo
                .inComponent
                .component
                .parameters
                .getById(this.tiedTo.parameterId)!
                .type;

            this.relationshipEvaluator = new ParameterRelationshipEvaluator(
                sourceParamType,
                type,
            );
        }
    }

    private _id!: BelongsToIDs | SpecialParameterId;

    get id(): SpecialParameterId | BelongsToIDs {
        return this._id;
    }

    set id(value: SpecialParameterId | BelongsToIDs) {
        this._id = value;
        this.contextualId = this.getContextualId();
    }

    private _belongsTo!: ComponentInstanceFactory<BelongsToIDs, any> | ComponentInstance<BelongsToIDs, any> | null;

    get belongsTo(): ComponentInstanceFactory<BelongsToIDs, any> | ComponentInstance<BelongsToIDs, any> | null {
        return this._belongsTo;
    }

    set belongsTo(value: ComponentInstanceFactory<BelongsToIDs, any> | ComponentInstance<BelongsToIDs, any> | null) {
        this._belongsTo = value;
        this.contextualId = this.getContextualId();
    }

    get dataType() {
        return this.belongsTo?.component.parameters.getById(this.id)?.type;
    }

    get data(): ParameterCalculatorData<BelongsToIDs, IsReference> {
        return {
            isReference: this.isReference,
            tiedTo: this.tiedTo,
            value: this.value,
            relationshipEvaluator: this.relationshipEvaluator,
            belongsTo: this._belongsTo || undefined,
        };
    }

    asChildOf(value: ComponentInstanceFactory<BelongsToIDs, any> | ComponentInstance<BelongsToIDs, any> | null): ParameterCalculator<BelongsToIDs> {
        return new ParameterCalculator(
            this.id,
            {
                ...this.data,
                belongsTo: value || undefined,
            },
        );
    }

    getContextualId() {
        return `${this.id}.${this._belongsTo?.id || ''}`;
    }

    updateValueReference(value: ParameterValueDatum): boolean {
        if (!this.tiedTo || !this.isReference) {
            this.value = value;
            this.isReference = false as IsReference;
            return true;
        }

        const directReference = this
            .tiedTo!
            .inComponent;

        if (directReference.compositionType === ComponentCompositionType.Instance) {
            const currentValue = directReference
                .parameterValues
                .getById(this.tiedTo!.parameterId);

            const reversedRes = this
                .relationshipEvaluator
                ?.evaluateBackwards(currentValue!.value!, value);
            if (reversedRes) {
                directReference.updateParameter(
                    this.tiedTo!.parameterId,
                    reversedRes,
                );

                return true;
            }
        } else {
            const valueHere = directReference
                .parameterMapping
                .getById(this.tiedTo!.parameterId);
            const currentValue = valueHere?.resolveValue()[0];

            if (currentValue && valueHere) {
                const reversedRes = this
                    .relationshipEvaluator
                    ?.evaluateBackwards(currentValue, value);

                if (reversedRes) {
                    return valueHere.updateValueReference(reversedRes);
                }
            }
        }

        return false;
    }

    resolveValue(): [ParameterValueDatum | null, ParentComponent, string | SpecialParameterId | null] {
        if (!this.tiedTo || !this.isReference) {
            return [
                this.value!,
                null,
                null,
            ];
        }

        const directReference = this
            .tiedTo!
            .inComponent;

        if (directReference.compositionType === ComponentCompositionType.Instance) {
            const valueHere = directReference
                .parameterValues
                .getById(this.tiedTo!.parameterId);

            if (valueHere) {
                return [
                    this.relationshipEvaluator!.evaluate(valueHere.value!),
                    directReference as ParentComponent,
                    this.tiedTo!.parameterId,
                ];
            }
        } else {
            const valueHere = directReference
                .parameterMapping
                .getById(this.tiedTo!.parameterId);

            if (valueHere) {
                if (!valueHere.isReference) {
                    return [
                        this.relationshipEvaluator!.evaluate(valueHere.value!),
                        directReference as ParentComponent,
                        this.tiedTo!.parameterId,
                    ];
                }

                const resolvedValue = valueHere.resolveValue();
                return [
                    this.relationshipEvaluator!.evaluate(resolvedValue[0]!),
                    resolvedValue[1],
                    resolvedValue[2],
                ];
            }
        }

        return [
            null,
            null,
            null,
        ];
    }
}