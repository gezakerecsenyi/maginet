import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';
import { ParameterValueDatum } from '../../types';

export default class MaginetError extends Error {
    static Name = 'MaginetError';

    constructor(message: string) {
        super();

        const error = new Error(`Maginet - ${message}`);
        error.name = MaginetError.Name;

        return error;
    }

    static processValue = (e?: ParameterValueDatum) => e === undefined ? '[unknown]' : (
        Object.hasOwn(e as object, 'length') ?
            `[array (${(e as ComponentInstanceFactory[]).length})]` :
            JSON.stringify(e)
    );
}