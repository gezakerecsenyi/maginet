export default function updateFromLocation(object: { [p: string]: any }, location: string[], value: any) {
    if (location.length === 1) {
        object[location[0]] = value;
    } else {
        const currentValue = object[location[0]];
        if (Object.hasOwn(currentValue as object, 'length')) {
            const relevantIndex = (currentValue as { id: string }[])
                .findIndex(e => e.id === location[1]);
            updateFromLocation(object[location[0]][relevantIndex], location.slice(2), value);
        } else {
            updateFromLocation(object[location[0]], location.slice(1), value);
        }
    }
}