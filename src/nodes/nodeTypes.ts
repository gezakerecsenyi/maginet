import SearchableMap from '../lib/utils/SearchableMap';
import { ParameterAssociationDescriptor, ParameterType, ParameterValueType } from '../types';

export interface NodeDatumSpecification<T extends string> {
    id: T;
    type: ParameterType;
    displayName: string;
}

export interface NodeIOValue {
    data: ParameterValueType | ParameterValueType[];
    isArray: boolean;
}

export interface NodeIO<T extends string> {
    id: T;
    value: NodeIOValue;
}

export type NodeEvaluator<T extends string, Q extends string> = (sources: SearchableMap<T, NodeIO<T>>) => NodeIO<Q>[];

export interface NodeInputMapping<T> {
    id: T;
    isReference: boolean;
    value?: NodeIOValue;
    referenceTo?: ParameterAssociationDescriptor;
}