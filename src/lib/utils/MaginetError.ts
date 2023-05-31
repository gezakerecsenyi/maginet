export default class MaginetError extends Error {
    static Name = 'MaginetError';

    constructor(message: string) {
        super();

        const error = new Error(`Maginet - ${message}`);
        error.name = MaginetError.Name;

        return error;
    }
}