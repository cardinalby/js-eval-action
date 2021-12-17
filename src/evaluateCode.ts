import vm from "vm";
import {ActionOutputsInterface} from './actionOutputs';

export async function evaluateCode(
    evalContext: object,
    expression: string,
    outputs: ActionOutputsInterface,
    extractOutputs: boolean,
    timeoutMs?: number|undefined
) {
    // setTimeout is not available inside vm
    const context = Object.assign({setTimeout: setTimeout}, evalContext);

    let timeoutTimerPromise: Promise<any>|undefined;
    let timeoutTimer: NodeJS.Timeout|undefined = undefined;
    if (timeoutMs !== undefined) {
        // Promise gets rejected on timeout of await outside the vm.runInNewContext()
        timeoutTimerPromise = new Promise((resolve, reject) => {
            timeoutTimer = setTimeout(
                () => { reject(new Error('Result promise awaiting timed out')); },
                timeoutMs
            )
        });
    }
    let result: any;
    const expressionWrapper = `(async () => ${expression})()`;
    let runResult: any;
    try {
        runResult = vm.runInNewContext(
            expressionWrapper, context, {timeout: timeoutMs}
        );
    } catch(err) {
        clearTimeout(timeoutTimer);
        throw err;
    }
    if (runResult && typeof runResult.then === 'function' && timeoutTimerPromise) {
        result = await Promise.race([runResult, timeoutTimerPromise]);
        clearTimeout(timeoutTimer);
    } else {
        clearTimeout(timeoutTimer);
        result = await Promise.resolve(runResult);
    }
    if (extractOutputs) {
        if (typeof result !== 'object' || result === null) {
            throw new Error('"extractOutputs" input is true but expression result is not an object');
        }
        outputs.setOutputs(result);
    } else {
        outputs.setResult(result);
    }
}