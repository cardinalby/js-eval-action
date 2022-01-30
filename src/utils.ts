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

export function stringToBoolean(str: string) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    if (trueValue.includes(str))
        return true;
    if (falseValue.includes(str))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${str}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}