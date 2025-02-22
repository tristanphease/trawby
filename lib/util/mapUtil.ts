/**
 * Adds a value to a map with an array as a value.
 * If array exists, will push to the array, otherwise will add array with the value
 */
export function addToMapArray<K, V>(map: Map<K, Array<V>>, key: K, value: V) {
    if (!map.has(key)) {
        map.set(key, [value]);
    } else {
        const eventArray = map.get(key);
        eventArray!.push(value);
    }
}
