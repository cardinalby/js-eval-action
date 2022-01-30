export interface ActionInputsInterface {
    expression?: string;
    jsFile?: string;
    jsonInputs?: string;
    jsonEnvs?: string;
    extractOutputs?: string,
    timeoutMs?: string,
    [key: string]: string|undefined
}