export interface ActionInputsObjectInterface {
    [key: string]: any;
}

export type GetInputFn = (name: string) => string;

export class ActionInputsObject implements ActionInputsObjectInterface{
    constructor(getInputFn: GetInputFn) {
        return new Proxy(this, {
            get(target, prop): string|undefined {
                if (typeof prop !== 'string') {
                    throw new Error("Input name should be string")
                }
                return getInputFn(prop);
            }
        });
    }

    [key: string]: string | undefined;
}