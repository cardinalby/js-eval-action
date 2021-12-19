export interface ActionOutputsObjectInterface {
    [key: string]: any;
}

export interface ActionOutputsInterface {
    setResult(value: any): void;
    setTimedOut(value: boolean): void;
    setOutputs(outputs: ActionOutputsObjectInterface): void;
}

export type SetOutputFn = (name: string, value: any) => void;
export type FormatOutputFn = (value: any) => string;

export class ActionOutputs implements ActionOutputsInterface {
    private readonly _setOutput: SetOutputFn;
    private readonly _formatOutput: FormatOutputFn;

    constructor(setOutput: SetOutputFn, formatOutput: FormatOutputFn) {
        this._setOutput = setOutput;
        this._formatOutput = formatOutput;
    }

    setResult(value: any): void {
        this._setOutput('result', this._formatOutput(value))
    }

    setTimedOut(value: boolean): void {
        this._setOutput('timedOut', value ? 'true' : 'false');
    }

    setOutputs(outputs: ActionOutputsObjectInterface): void {
        for (let name of Object.keys(outputs)) {
            try {
                this._setOutput(name, this._formatOutput(outputs[name]))
            } catch (e) {
                throw new Error(`Can't format "${name}" output. ${String(e)}`);
            }
        }
    }
}

export function formatOutput(value: any): string {
    switch (typeof value) {
        case 'bigint':
        case 'number':
        case 'string':
        case 'undefined':
        case 'boolean':
            return String(value)
        case 'function':
        case 'symbol':
            throw new Error(`Can't set ${typeof value} as an output`);
        case 'object':
            return JSON.stringify(value);
    }
    return '';
}