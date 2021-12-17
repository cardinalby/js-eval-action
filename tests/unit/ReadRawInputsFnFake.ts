import {InputOptions} from "@actions/core";
import {objectFromEntries} from "../../src/utils";
import {ReadRawInputsFn} from "../../src/actionInputs";
import {ActionInputsObject} from "../utils/utils";

export function createReadRawInputsFnFake(inputs: ActionInputsObject): ReadRawInputsFn {
    const inputsUpperCase = objectFromEntries(
        Object.entries(inputs).map(entry => [entry[0].toUpperCase(), entry[1]])
    );

    return ((name: string, options?: InputOptions): string => {
        const val = inputsUpperCase[name.replace(/ /g, '_').toUpperCase()] || '';
        if (options && options.required && !val) {
            throw new Error(`Input required and not supplied: ${name}`);
        }
        if (options && options.trimWhitespace === false) {
            return val;
        }
        return val.trim();
    });
}