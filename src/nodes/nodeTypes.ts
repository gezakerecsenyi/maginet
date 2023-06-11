import SearchableMap from '../lib/utils/SearchableMap';
import { NodeValueDatum, ParameterAssociationDescriptor, ParameterTyping } from '../types';

export interface NodeDatumSpecification<T extends string> {
    id: T;
    type: ParameterTyping;
    displayName: string;
}

export enum SpecialNodeIds {
    Input = 'input',
    Output = 'output',
    Saver = 'saver',
}

export type NodeEvaluationCache = { [key: string]: SearchableMap<string, NodeIO<string>> };

export interface NodeIOValue {
    data: NodeValueDatum | NodeValueDatum[];
    isArray: boolean;
}

export interface NodeIO<T extends string> {
    id: T;
    value: NodeIOValue;
}

export type NodeEvaluator<T extends string, Q extends string> = (
    sources: SearchableMap<T, NodeIO<T>>,
    knownValues?: SearchableMap<T, NodeIO<T>>,
) => NodeIO<Q>[] | null;

export interface NodeInputMapping<T> {
    id: T;
    isReference: boolean;
    value?: NodeIOValue;
    referenceTo?: ParameterAssociationDescriptor;
}