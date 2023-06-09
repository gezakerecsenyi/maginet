export default class SearchableMap<Q extends string, T extends { id: Q }> extends Array<T> {
    getById<V extends Partial<T> = {}, M extends Q = Q>(id: M) {
        return this.find(e => e.id === id) as Exclude<(V & T), 'id'> & { id: M } | undefined;
    }

    asSecondaryKey<R extends { id: Q }>(parentArray: R[]): SearchableMap<Q, T & R> {
        const searchableParent = new SearchableMap(
            ...parentArray.filter(e => this.some(v => v.id === e.id)),
        );
        return this
            .sFilter(q => parentArray.some(v => v.id === q.id))
            .sMap(e => ({
                ...e,
                ...searchableParent.getById(e.id)!,
            }));
    }

    setById(id: Q, value: T) {
        const index = this.findIndex(e => e.id === id);

        if (index > -1) {
            this.splice(index, 1, value);
            return true;
        }

        return false;
    }

    concatIfNew(...values: T[]) {
        return new SearchableMap<Q, T>(...this.concat(...values.filter(e => !this.some(q => q.id === e.id))));
    }

    concatOrReplace(...values: T[]) {
        return new SearchableMap<Q, T>(...this.map(e => values.find(q => q.id === e.id) ?? e))
            .concatIfNew(...values);
    }

    pushIfNew(...values: T[]) {
        values
            .filter(e => !this.some(q => q.id === e.id))
            .forEach(e => this.push(e));
    }

    updateById(id: Q, keys: Partial<T>) {
        const index = Array.from(this.entries()).find(e => e[1].id === id);

        if (index) {
            this.splice(index[0], 1, { ...index[1], ...keys });
            return true;
        }

        return false;
    }

    sFilter(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): SearchableMap<Q, T> {
        return new SearchableMap(...super.filter(predicate, thisArg));
    }

    sMap<U extends { id: Q }>(
        callbackfn: (value: T, index: number, array: T[]) => U,
        thisArg?: any,
    ): SearchableMap<Q, U> {
        return new SearchableMap(...super.map(callbackfn, thisArg));
    }
}