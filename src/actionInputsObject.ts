import {InputOptions} from "@actions/core";

export interface ActionInputsObjectInterface {
    [key: string]: string | undefined;
}

export type GetInputFn = (name: string, options?: InputOptions) => string;

export class ActionInputsObject implements ActionInputsObjectInterface{
    constructor(getInputFn: GetInputFn) {
        return new Proxy(this, {
            get(target, prop): string|undefined {
                if (typeof prop !== 'string') {
                    throw new Error("Input name should be string")
                }
                const value = getInputFn(prop);
                return value.length > 0 ? value : undefined
            }
        });
    }

    [key: string]: string | undefined;
}