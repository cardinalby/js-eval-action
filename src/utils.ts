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