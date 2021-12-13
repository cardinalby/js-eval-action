import * as ghActions from '@actions/core';

export interface ActionOutputsObjectInterface {
    [key: string]: string | undefined;
}

export interface ActionOutputsInterface {
    setResult(value: any): void;
    setOutputs(outputs: ActionOutputsObjectInterface): void;
}

export class ActionOutputs implements ActionOutputsInterface {
    setResult(value: any): void {
        ghActions.setOutput('result', formatOutput(value))
    }

    setOutputs(outputs: ActionOutputsObjectInterface): void {
        for (let name of Object.keys(outputs)) {
            // noinspection SuspiciousTypeOfGuard
            if (typeof name !== 'string') {
                throw new Error('Output name should be a string');
            }
            try {
                ghActions.setOutput(name, formatOutput(outputs[name]))
            } catch (e) {
                throw new Error(`Can't format "${name}" output. ` + e.message);
            }
        }
    }
}

export function formatOutput(value: any): string {
    switch (typeof value) {
        case 'bigint':
        case 'number':
        case 'string':
            return value.toString()
        case 'undefined':
            return 'undefined'
        case 'boolean':
            return value ? 'true' : 'false'
        case 'function':
        case 'symbol':
            throw new Error(`Can't set ${typeof value} as an output`);
        case 'object':
            return JSON.stringify(value);
    }
    return '';
}