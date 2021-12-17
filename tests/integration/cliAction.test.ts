import {readCommands, setInputsEnv} from "../utils/utils";
import {run} from "../../src/runner";
import interceptStdout from 'intercept-stdout'
import './../typeDefinitions/interceptStdout.d';
import {performance} from "perf_hooks";
import * as dotenv from 'dotenv';
import ProcessEnv = NodeJS.ProcessEnv;

describe('js-eval-action', () => {
    let stdout = '';
    let originalEnv: ProcessEnv;

    interceptStdout(data => {
        stdout += data;
        return '';
    })

    beforeAll(() => {
        dotenv.config({path: 'tests.env'});
        originalEnv = {...process.env};
    })

    beforeEach(() => {
        stdout = '';
    });

    afterEach(() => {
        process.env = {...originalEnv};
    })

    it('simple math', async () => {
        setInputsEnv({
            expression: '3*(parseInt(inputs.x) + parseInt(inputs.y))',
            x: '5',
            y: '2'
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({result: '21'});
        expect(commands.errors).toEqual([]);
    });

    it('extract outputs', async () => {
        setInputsEnv({
            expression: '({o1: inputs.x.length, o2: {nested: inputs.y}})',
            extractOutputs: 'true',
            x: 'aa',
            y: 'bba'
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({o1: '2', o2: JSON.stringify({nested: 'bba'})});
        expect(commands.errors).toEqual([]);
    });

    it('extract outputs failure', async () => {
        setInputsEnv({
            expression: '123',
            extractOutputs: 'true',
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.errors.length).toEqual(1);
        expect(commands.outputs).toEqual({});
    });

    it('json inputs', async () => {
        setInputsEnv({
            expression: '3*(inputs.x + inputs.y) + inputs.z',
            extractOutputs: 'false',
            jsonInputs: 'x | y',
            x: '4',
            y: '2',
            z: '100'
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({result: '18100'});
        expect(commands.errors).toEqual([]);
    });

    it('json inputs failure', async () => {
        setInputsEnv({
            expression: 'inputs.x',
            extractOutputs: 'true',
            jsonInputs: '*',
            x: '.',
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.errors.length).toBeGreaterThan(0);
        expect(commands.outputs).toEqual({});
    });

    it('expression failure', async () => {
        setInputsEnv({
            expression: '{{',
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.errors.length).toEqual(1);
        expect(commands.outputs).toEqual({});
    });

    it('resolved promise expression', async () => {
        const startTime = performance.now();
        setInputsEnv({
            expression: 'new Promise((resolve, reject) => setTimeout(() => resolve(22), 50))',
        });
        await run();
        const endTime = performance.now();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({result: '22'});
        expect(commands.errors).toEqual([]);
        expect(endTime-startTime).toBeGreaterThanOrEqual(50);
    });

    it('rejected promise expression', async () => {
        const startTime = performance.now();
        setInputsEnv({
            expression: 'new Promise((resolve, reject) => setTimeout(() => reject(new Error("xxyy")), 50))',
        });
        await run();
        const endTime = performance.now();
        const commands = readCommands(stdout);
        expect(commands.errors.length).toEqual(1);
        expect(commands.errors[0].indexOf('xxyy')).not.toEqual(-1);
        expect(commands.outputs).toEqual({});
        expect(endTime-startTime).toBeGreaterThanOrEqual(50);
    });

    it('env variables', async () => {
        process.env.XX_E = '45353';
        setInputsEnv({
            expression: 'env.XX_E',
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({result: '45353'});
        expect(commands.errors).toEqual([]);
    });

    it('octokit request', async () => {
        if (process.env.GITHUB_TOKEN) {
            setInputsEnv({
                expression:
                    '(await octokit.rest.repos.get({owner: context.repo.owner, repo: context.repo.repo})).data.name',
            });
            await run();
            const commands = readCommands(stdout);
            expect(commands.outputs).toEqual({result: 'js-eval-action'});
            expect(commands.errors).toEqual([]);
        }
    });

    it('semver', async () => {
        setInputsEnv({
            expression:
                'semver.parse(inputs.x).compare(inputs.y)',
            x: '2.3.4',
            y: '2.5.6'
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({result: '-1'});
        expect(commands.errors).toEqual([]);
    });

    it('yaml, fs, await', async () => {
        setInputsEnv({
            expression: 'yaml.parse((await fs.readFile("action.yml")).toString()).name'
        });
        await run();
        const commands = readCommands(stdout);
        expect(commands.outputs).toEqual({result: 'js-eval-action'});
        expect(commands.errors).toEqual([]);
    });

    it("timeout doesn't prevent to exit early", async () => {
        setInputsEnv({
            expression: "2",
            timeoutMs: '1000'
        });
        const startTime = performance.now();
        await run();
        const endTime = performance.now();
        expect(endTime-startTime).toBeLessThan(1000);
    });
});