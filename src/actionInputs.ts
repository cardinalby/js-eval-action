import * as ghActions from '@actions/core';

const INPUT_EXPRESSION = 'expression';
const INPUT_EXTRACT_OUTPUTS = 'extractOutputs';
const INPUT_TIMEOUT = 'timeout';

export const actionInputs = {
    get expression(): string {
        const expression = ghActions.getInput(INPUT_EXPRESSION, { required: true, trimWhitespace: true });
        if (expression.length === 0) {
            throw new Error('Empty expression');
        }
        return expression;
    },

    get extractOutputs(): boolean {
        return ghActions.getBooleanInput(INPUT_EXTRACT_OUTPUTS)
    },

    get timeout(): number|undefined {
        const timeout = ghActions.getInput(INPUT_TIMEOUT);
        if (timeout.length > 0) {
            const mSeconds = Number.parseInt(timeout);
            if (Number.isNaN(mSeconds)) {
                throw new Error('Invalid timeout input value');
            }
            return mSeconds;
        }
        return undefined;
    }
}