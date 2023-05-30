export default class SearchableMap<T extends { id: string }> extends Array<T> {
    updateById(id: string, keys: Partial<T>) {
        const index = Array.from(this.entries()).find(e => e[1].id === id);

        if (index) {
            this.splice(index[0], 1, { ...index[1], ...keys });
            return true;
        }

        return false;
    }
}