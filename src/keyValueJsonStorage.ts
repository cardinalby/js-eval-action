import {wrapError} from "./utils";

export interface KeyValueStorageInterface {
    getInput(name: string): any;
}

export type GetRawInputFn = (name: string) => string;

export class KeyValueJsonStorage implements KeyValueStorageInterface {
    private readonly _getRawValue: GetRawInputFn;
    private readonly _jsonKeys: string[]|true;
    private readonly _evaluatedCache = new Map<string, any>();

    /**
     * @param getRawInput
     * @param jsonKeys array of keys names to be considered as containing JSON. `true` means "all"
     */
    constructor(getRawInput: GetRawInputFn, jsonKeys: string[]|true) {
        this._getRawValue = getRawInput;
        this._jsonKeys = jsonKeys;
    }

    getInput(name: string): any {
        const rawValue = this._getRawValue(name);
        if (this._jsonKeys === true ||
            (Array.isArray(this._jsonKeys) && this._jsonKeys.includes(name))
        ) {
            if (!this._evaluatedCache.has(name)) {
                const parsed = wrapError(
                    () => JSON.parse(rawValue),
                    `Can't parse "${name}" value as JSON`
                    );

                this._evaluatedCache.set(name, parsed);
            }
            return this._evaluatedCache.get(name);
        }
        return rawValue;
    }
}