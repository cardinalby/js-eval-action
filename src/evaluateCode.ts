import { Octokit } from '@octokit/core'
import { ActionInputsObjectInterface } from './actionInputsObject';
import { Context } from '@actions/github/lib/context';
import vm from "vm";
import { ActionOutputsInterface } from './actionOutputs';
import ProcessEnv = NodeJS.ProcessEnv;

export async function evaluateCode(
    octokit: Octokit|undefined,
    inputs: ActionInputsObjectInterface,
    githubContext: Context,
    env: ProcessEnv,
    expression: string,
    outputs: ActionOutputsInterface,
    extractOutputs: boolean,
    timeoutMs: number|undefined
) {
    const evalContext = {
        inputs,
        env,
        octokit,
        context: githubContext
    }

    const expressionWrapper = `'(async () => ${expression})()'`;
    const result = await Promise.resolve(vm.runInNewContext(
        expressionWrapper, evalContext, { timeout: timeoutMs }
        ));

    if (extractOutputs && typeof result === 'object' && result !== null) {
        outputs.setOutputs(result);
    } else {
        outputs.setResult(result);
    }
}