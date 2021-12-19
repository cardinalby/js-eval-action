import {InputOptions} from "@actions/core";
import {MatchKeyRule, MatchKeyRuleInterface} from "./matchKeyRule";

const INPUT_EXPRESSION = 'expression';
const INPUT_JSON_INPUTS = 'jsonInputs';
const INPUT_JSON_ENVS = 'jsonEnvs';
const INPUT_EXTRACT_OUTPUTS = 'extractOutputs';
const INPUT_TIMEOUT = 'timeoutMs';

export interface ActionInputsInterface {
    expression: string;
    jsonInputs: MatchKeyRuleInterface;
    jsonEnvs: MatchKeyRuleInterface;
    extractOutputs: boolean;
    timeoutMs: number|undefined
}

export type ReadRawInputsFn = (name: string, options?: InputOptions) => string;

export class ActionInputs implements ActionInputsInterface {
    private readonly _readRawInput: ReadRawInputsFn;

    constructor(readRawInput: ReadRawInputsFn) {
        this._readRawInput = readRawInput;
    }

    get expression(): string {
        const expression = this._readRawInput(
            INPUT_EXPRESSION, { required: true, trimWhitespace: true }
        );
        if (expression.length === 0) {
            throw new Error('Empty "expression" input');
        }
        return expression;
    }

    get jsonInputs(): MatchKeyRule {
        return ActionInputs.getNamesList(this._readRawInput(INPUT_JSON_INPUTS), false);
    }

    get jsonEnvs(): MatchKeyRule {
        return ActionInputs.getNamesList(this._readRawInput(INPUT_JSON_ENVS), true);
    }

    get extractOutputs(): boolean {
        return this.getBooleanInput(INPUT_EXTRACT_OUTPUTS);
    }

    get timeoutMs(): number|undefined {
        const timeout = this._readRawInput(INPUT_TIMEOUT);
        if (timeout.length > 0) {
            const mSeconds = Number.parseInt(timeout);
            if (Number.isNaN(mSeconds) || mSeconds <= 0) {
                throw new Error('Invalid "timeoutMs" input');
            }
            return mSeconds;
        }
        return undefined;
    }

    private static getNamesList(value: string, caseSensitive: boolean): MatchKeyRule {
        if (value.length > 0) {
            if (value.trim() === '*') {
                return MatchKeyRule.matchAll();
            }
            return MatchKeyRule.matchKeys(
                value
                    .split('|')
                    .filter(name => name.length > 0)
                    .map(name => name.trim()),
                caseSensitive
            );
        }
        return MatchKeyRule.matchNone();
    }

    private getBooleanInput(name: string, options?: InputOptions): boolean {
        const trueValue = ['true', 'True', 'TRUE'];
        const falseValue = ['false', 'False', 'FALSE'];
        const val = this._readRawInput(name, options);
        if (trueValue.includes(val))
            return true;
        if (falseValue.includes(val))
            return false;
        throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
            `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
    }
}