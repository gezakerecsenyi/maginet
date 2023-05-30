export default function updateFromLocation(object: { [key: string]: any }, value: any, location: string[]) {
    if (location.length === 1) {
        object[location[0]] = value;
    } else {
        const currentValue = object[location[0]];
        if (Object.hasOwn(currentValue as object, 'length')) {
            const relevantIndex = (currentValue as { id: string }[])
                .findIndex(e => e.id === location[1]);
            updateFromLocation(object[location[0]][relevantIndex], value, location.slice(2));
        } else {
            updateFromLocation(object[location[0]], value, location.slice(1));
        }
    }
}