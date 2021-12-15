import * as fs from "fs";
import * as yaml from "yaml";

function wrapError<T>(fn: () => T, messagePrefix: string): T {
    try {
        return fn();
    } catch (err) {
        throw new Error(messagePrefix + '. ' + err);
    }
}

export function setInputs(
    inputs: { [key: string]: string },
) {
    const actionConfig = wrapError(
        () => yaml.parse(fs.readFileSync('action.yml').toString()),
        "Can't parse action.yml"
    );

    const setInput = (name: string, value: string) => {
        process.env['INPUT_' + name.toUpperCase()] = value;
    };
    if (typeof actionConfig.inputs === 'object') {
        Object.keys(actionConfig.inputs).forEach(inputName => {
            const input = actionConfig.inputs[inputName];
            if (!input.required &&
                input.default !== undefined &&
                !inputs.hasOwnProperty(inputName)
            ) {
                setInput(inputName, String(input.default));
            }
        })
    }

    Object.keys(inputs).forEach(
        inputName => {
            setInput(inputName, inputs[inputName]);
        }
    );
}

export function readOutputs(stdout: string): { [key: string]: string } {
    const re = /^::set-output name=(\w+)::(.*?)$/gm;
    let match: RegExpExecArray | null;
    const result: { [key: string]: string } = {};
    while (match = re.exec(stdout)) {
        result[match[1]] = match[2];
    }
    return result;
}