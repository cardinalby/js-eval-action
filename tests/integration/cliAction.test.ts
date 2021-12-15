import {readOutputs, setInputs} from "./utils";
import {run} from "../../src/runner";
import interceptStdout from 'intercept-stdout'
import './../typeDefinitions/interceptStdout.d';

describe('js-eval-action', () => {
    let stdout = '';
    const originalEnv = process.env;
    interceptStdout(data => {
        stdout += data;
    })

    beforeEach(() => {
        stdout = '';
        process.env = originalEnv;
    });

    it('simple math', async () => {
        setInputs({
            expression: '3*(parseInt(inputs.x) + parseInt(inputs.y))',
            x: '5',
            y: '2'
        });
        await run();
        const outputs = readOutputs(stdout);
        expect(outputs).toEqual({result: '21'});
    })
});