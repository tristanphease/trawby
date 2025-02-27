/**
 * Adds a value to a map with an array as a value.
 * If array exists, will push to the array, otherwise will add array with the value
 */
export function addToMapArray<K, V>(
    map: Map<K, Array<V>>,
    key: K,
    value: V,
): void {
    if (!map.has(key)) {
        map.set(key, [value]);
    } else {
        const eventArray = map.get(key);
        eventArray!.push(value);
    }
}

/** Get a sub map within a map of maps, if doesn't exist then will add it and return the new one */
export function getMapOfMap<K, K2, V>(
    mapOfMaps: Map<K, Map<K2, V>>,
    key: K,
): Map<K2, V> {
    const subMap = mapOfMaps.get(key);
    if (subMap) {
        return subMap;
    }

    const newMap = new Map<K2, V>();
    mapOfMaps.set(key, newMap);
    return newMap;
}
