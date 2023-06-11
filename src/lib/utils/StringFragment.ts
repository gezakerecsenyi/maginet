export type StringFragmentData = [number, string][];

export default class StringFragment {
    private keys: StringFragmentData;

    constructor(keys: StringFragmentData = []) {
        this.keys = keys;
    }

    static fromString(string: string) {
        const keys: StringFragmentData = [];
        string
            .split('')
            .forEach((e, i) => keys.push([
                i,
                e,
            ]));

        return new StringFragment(keys);
    }

    set(index: number, char: string) {
        this.keys = this
            .keys
            .filter(e => e[0] !== index)
            .concat([
                [
                    index,
                    char,
                ],
            ]);
    }

    mergeWith(fragment: StringFragment) {
        if (fragment.keys.some(t => this.keys.some(q => q[0] === t[0]))) {
            return null;
        }

        return new StringFragment(
            [
                ...this.keys,
                ...fragment.keys,
            ],
        );
    }

    flattenToString(fillGapsWith?: string, clashSilently = false) {
        const items: (string | null)[] = Array(
            (Math.max(...this.keys.map(e => e[0]).filter(t => t >= 0)) || 0) +
            this
                .keys
                .filter(e =>
                    e[0] < 0 &&
                    Array(Math.abs(e[0]))
                        .fill(0)
                        .every((_, i) => this.keys.some(t => t[0] === -(i + 1))),
                )
                .length
            + 1,
        ).fill(fillGapsWith ?? null);

        for (const key of this.keys) {
            const targetIndex = key[0] >= 0 ? key[0] : items.length + key[0];
            if (items[targetIndex] !== null && !clashSilently) {
                return null;
            }

            items[targetIndex] = key[1];
        }

        if (fillGapsWith !== undefined) {
            return items.map(e => e ?? fillGapsWith).join('');
        }

        if (!items.some(t => t === null)) {
            return items.join('');
        }

        return null;
    }
}