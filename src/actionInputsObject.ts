import * as ghActions from '@actions/core';

export interface ActionInputsObjectInterface {
    [key: string]: string | undefined;
}

export class ActionInputsObject implements ActionInputsObjectInterface{
    constructor() {
        return new Proxy(this, {
            get(target, prop): string|undefined {
                if (typeof prop !== 'string') {
                    throw new Error("Input name should be string")
                }
                const value = ghActions.getInput(prop);
                return value.length > 0 ? value : undefined
            }
        });
    }

    [key: string]: string | undefined;
}