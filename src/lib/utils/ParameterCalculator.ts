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
            directReference.updateParameter(this.tiedTo!.parameterId, value);
            return true;
        } else {
            const valueHere = directReference
                .parameterMapping
                .getById(this.tiedTo!.parameterId);

            if (valueHere) {
                return valueHere.updateValueReference(value);
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
                    valueHere.value!,
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
                        valueHere.value!,
                        directReference as ParentComponent,
                        this.tiedTo!.parameterId,
                    ];
                }

                return valueHere.resolveValue();
            }
        }

        return [
            null,
            null,
            null,
        ];
    }
}