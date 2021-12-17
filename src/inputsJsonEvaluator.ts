import {wrapError} from "./utils";

export interface InputsEvaluatorInterface {
    getInput(name: string): any;
}

export type GetRawInputFn = (name: string) => string;

export class InputsJsonEvaluator implements InputsEvaluatorInterface {
    private readonly _getRawInput: GetRawInputFn;
    private readonly _jsonInputs: string[]|true;
    private readonly _evaluatedCache = new Map<string, any>();

    /**
     * @param getRawInput
     * @param jsonInputs array of input names to be considered as containing JSON. `true` means "all"
     */
    constructor(getRawInput: GetRawInputFn, jsonInputs: string[]|true) {
        this._getRawInput = getRawInput;
        this._jsonInputs = jsonInputs;
    }

    getInput(name: string): any {
        const rawValue = this._getRawInput(name);
        if (this._jsonInputs === true ||
            (Array.isArray(this._jsonInputs) && this._jsonInputs.includes(name))
        ) {
            if (!this._evaluatedCache.has(name)) {
                const parsed = wrapError(
                    () => JSON.parse(rawValue),
                    `Can't parse "${name}" input as JSON`
                    );

                this._evaluatedCache.set(name, parsed);
            }
            return this._evaluatedCache.get(name);
        }
        return rawValue;
    }
}