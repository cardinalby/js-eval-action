export interface ActionInputsObjectInterface {
    [key: string]: any;
}

export type GetInputFn = (name: string) => string;

export class ProxyObject implements ActionInputsObjectInterface{
    constructor(getInputFn: GetInputFn, valuesName: string) {
        return new Proxy(this, {
            get(target, prop): string|undefined {
                if (typeof prop !== 'string') {
                    throw new Error(`${valuesName} name should be a string`)
                }
                try {
                    return getInputFn(prop);
                } catch (err) {
                    throw new Error(`Error reading "${prop}" ${valuesName}. ${err}`);
                }
            }
        });
    }

    [key: string]: string | undefined;
}