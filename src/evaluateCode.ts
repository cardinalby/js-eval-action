import vm from "vm";
import {ActionOutputsInterface} from './actionOutputs';
import {TrackedTimers} from "./trackedTimers";

function isPromise(value: any): value is Promise<any> {
    return value &&
        typeof value === 'object' &&
        typeof value.then === 'function' &&
        typeof value.catch === 'function';
}

export async function evaluateCode(
    evalContext: object,
    expression: string,
    outputs: ActionOutputsInterface,
    extractOutputs: boolean,
    timeoutMs?: number|undefined
) {
    const trackedTimers = new TrackedTimers();
    // setTimeout and setInterval are not available inside vm
    const context = Object.assign({
        setTimeout: trackedTimers.setTimeout.bind(trackedTimers),
        setInterval: trackedTimers.setInterval.bind(trackedTimers),
    }, evalContext);

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
        if (isPromise(runResult) && timeoutTimerPromise) {
            result = await Promise.race([runResult, timeoutTimerPromise]);
        } else {
            clearTimeout(timeoutTimer);
            result = await Promise.resolve(runResult);
        }
    } catch(err) {
        throw err;
    } finally {
        clearTimeout(timeoutTimer);
        trackedTimers.clearAll();
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