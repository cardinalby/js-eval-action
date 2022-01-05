import vm from "vm";
import {ActionOutputsInterface} from './actionOutputs';
import {TrackedTimers} from "./trackedTimers";
import {isPromise} from "./utils";

export class TimedOutError extends Error {}

export function wrapExpression(expression: string): string {
    return `(async () => ${expression})()`;
}

export async function evaluateCode(
    evalContext: object,
    code: string,
    outputs: ActionOutputsInterface,
    extractOutputs: boolean,
    timeoutMs?: number|undefined,
    filename?: string|undefined
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
                () => { reject(new TimedOutError('Result promise awaiting timed out')); },
                timeoutMs
            )
        });
    }
    let result: any;
    let runResult: any;
    try {
        runResult = vm.runInNewContext(
            code, context, {timeout: timeoutMs, filename}
        );
        if (isPromise(runResult) && timeoutTimerPromise) {
            result = await Promise.race([runResult, timeoutTimerPromise]);
        } else {
            clearTimeout(timeoutTimer);
            result = await Promise.resolve(runResult);
        }
        outputs.setTimedOut(false);
    } catch(err) {
        const resultErr = (err && (err as any).code === 'ERR_SCRIPT_EXECUTION_TIMEOUT')
            ? new TimedOutError('Script timed out')
            : err;
        outputs.setTimedOut(resultErr instanceof TimedOutError);
        throw resultErr;
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