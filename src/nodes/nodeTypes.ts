import SearchableMap from '../lib/utils/SearchableMap';
import { NodeValueDatum, ParameterTyping } from '../types';
import NodeInstance from './NodeInstance';

export enum IOType {
    Input = 'input',
    Output = 'output',
}

export interface NodeDatumSpecification<T extends string, Q extends IOType> {
    id: T;
    type: ParameterTyping;
    displayName: string;
    datumType: Q;
    dropdownContext?: string;
}

export enum DropdownTyping {
    Dropdown
}

export interface DropdownSpecification<T extends string> {
    id: T;
    type: DropdownTyping.Dropdown;
    datumType: IOType.Input;
    displayName: string;

    options: [string, string][];
    dropdownName: string;
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
    knownValues?: SearchableMap<Q, NodeIO<Q>>,
    ignoreIllegal?: boolean,
) => NodeIO<Q>[] | null;

export interface NodeConnectionDescriptor<T extends string> {
    node: NodeInstance<any, T>,
    parameterId: T,
}

export interface NodeInputMapping<T extends string> {
    id: T;
    isReference: boolean;
    value?: NodeIOValue;
    referenceTo?: NodeConnectionDescriptor<any>;
    datumType: IOType.Input;
}

export interface DefaultInputValue<T extends string> {
    id: T;
    value: NodeValueDatum,
}

export type NodeInputsSpecification<T extends string> = (NodeDatumSpecification<T, IOType.Input> | DropdownSpecification<T>);