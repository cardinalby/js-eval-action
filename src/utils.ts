export function wrapError<T>(fn: () => T, messagePrefix: string): T {
    try {
        return fn();
    } catch (err) {
        throw new Error(messagePrefix + '. ' + err);
    }
}

export function objectFromEntries<T>(arr: [string, T][]): { [s: string]: T } {
    return Object.assign({}, ...Array.from(arr, ([k, v]) => ({[k]: v}) ));
}

export function isPromise(value: any): value is Promise<any> {
    return value &&
        typeof value === 'object' &&
        typeof value.then === 'function' &&
        typeof value.catch === 'function';
}