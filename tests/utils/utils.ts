import * as fs from "fs";
import * as yaml from "yaml";
import {wrapError} from "../../src/utils";

export type ActionInputsObject = {
    expression?: string;
    jsFile?: string;
    jsonInputs?: string;
    jsonEnvs?: string;
    extractOutputs?: string,
    timeoutMs?: string,
    [key: string]: string|undefined
}

export function setInputsEnv(inputs: ActionInputsObject) {
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
            const inputValue = inputs[inputName];
            if (inputValue !== undefined) {
                setInput(inputName, inputValue);
            }
        }
    );
}

export function readCommands(stdout: string): {
    outputs: ReturnType<typeof readOutputs>,
    errors: ReturnType<typeof readErrors>
} {
    return {
        outputs: readOutputs(stdout),
        errors: readErrors(stdout)
    }
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

export function readErrors(stdout: string): string[] {
    const re = /^::error::(.*?)$/gm;
    let match: RegExpExecArray | null;
    const result: string[] = [];
    while (match = re.exec(stdout)) {
        result.push(match[1]);
    }
    return result;
}