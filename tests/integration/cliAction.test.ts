import {run} from "../../src/runner";
import {RunOptions, RunTarget} from 'github-action-ts-run-api';
import * as dotenv from 'dotenv';
import inspector from "inspector";
import {ActionInputsInterface} from "../utils/ActionInputsInterface";

describe('js-eval-action', () => {
    dotenv.config({path: 'tests.env'});
    const target = RunTarget.asyncFn(run, 'action.yml');

    it('simple math', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '3*(parseInt(inputs.x) + parseInt(inputs.y))',
                x: '5'
            })
            .setEnv({
                INPUT_Y: '2'
            })
        );
        expect(res.commands.outputs).toEqual({result: '21', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('validating data', async () => {
        const res = await target.run(RunOptions.create()
            .setEnv({attempt: '3', max: '2'})
            .setInputs(<ActionInputsInterface>{
                expression: `{ \
                  const \
                    attempt = parseInt(env.attempt), \
                    max = parseInt(env.max); \
                  assert(attempt && max && max >= attempt);           
                }`,
            }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.outputs).toEqual({timedOut: 'false'});
        expect(res.warnings).toHaveLength(0);
    });

    it('validate and return data', async () => {
        const res = await target.run(RunOptions.create()
            .setEnv({attempt: '1', max: '3'})
            .setInputs(<ActionInputsInterface>{
                expression: `{ \
                  const \
                    attempt = parseInt(env.attempt), \
                    max = parseInt(env.max); \
                  assert(attempt && max && max >= attempt);  
                  return attempt + 1;              
                }`,
            }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.outputs).toEqual({result: '2', timedOut: 'false'});
        expect(res.warnings).toHaveLength(0);
    });

    it('extract outputs', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '({o1: inputs.x.length, o2: {nested: inputs.y}})',
                extractOutputs: 'true',
                x: 'aa',
                y: 'bba'
            }));
        expect(res.commands.outputs).toEqual({o1: '2', o2: JSON.stringify({nested: 'bba'}), timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('extract outputs failure', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '123',
                extractOutputs: 'true',
            }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors.length).toEqual(1);
        expect(res.commands.outputs).toEqual({ timedOut: 'false' });
        expect(res.warnings).toHaveLength(0);
    });

    it('json inputs', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '3*(inputs.x + inputs.Y) + inputs.z',
                extractOutputs: 'false',
                jsonInputs: 'X | y',
                x: '4',
                y: '2',
                z: '100'
            }));
        expect(res.commands.outputs).toEqual({result: '18100', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('jsonInputs asterisk', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '3*(inputs.x.a + inputs.x.b) + inputs.z',
                extractOutputs: 'false',
                jsonInputs: '*',
                x: '{"a": 4, "b": 2}',
                z: '100'
            }));
        expect(res.commands.outputs).toEqual({result: '118', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('json inputs failure', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'inputs.x',
                extractOutputs: 'false',
                jsonInputs: '*',
                x: '.',
            }));
        expect(res.commands.errors.length).toBeGreaterThan(0);
        expect(res.commands.outputs).toEqual({ timedOut: 'false' });
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it('expression failure', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '{{',
            }));
        expect(res.commands.errors.length).toEqual(1);
        expect(res.commands.outputs).toEqual({ timedOut: 'false'});
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it('resolved promise expression', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'new Promise((resolve, reject) => setTimeout(() => resolve(22), 50))',
            }));
        expect(res.durationMs).toBeGreaterThanOrEqual(50);
        expect(res.commands.outputs).toEqual({result: '22', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('rejected promise expression', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'new Promise((resolve, reject) => setTimeout(() => reject(new Error("xxyy")), 50))',
            }));
        expect(res.commands.errors.length).toEqual(1);
        expect(res.commands.errors[0].indexOf('xxyy')).not.toEqual(-1);
        expect(res.commands.outputs).toEqual({ timedOut: 'false'});
        if (!inspector.url()) {
            expect(res.durationMs).toBeGreaterThanOrEqual(50);
        }
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it('env variables', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'env.XX_E',
            })
            .setEnv({XX_E: '45353'})
        );
        expect(res.commands.outputs).toEqual({result: '45353', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('export env variables', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '{ core.exportVariable("my_env_var1", "my_env_var_value1"); core.addPath("my_path2"); }',
            }));
        expect(res.commands.exportedVars).toEqual({my_env_var1: 'my_env_var_value1'});
        expect(res.commands.addedPaths).toEqual(['my_path2']);
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('json envs', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '3*(env.ex + env.ey) + env.ez',
                extractOutputs: 'false',
                jsonEnvs: 'ex | ey',
            })
            .setEnv({
                ex: '4',
                ey: '2',
                ez: '100'
            })
        );
        expect(res.commands.outputs).toEqual({result: '18100', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('json envs are case sensitive', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'env.ex + env.EX',
                extractOutputs: 'false',
                jsonEnvs: 'ex',
            })
            .setEnv({
                ex: '4',
                EX: '200'
            }));
        expect(res.commands.outputs).toEqual({result: '4200', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('jsonEnvs asterisk', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: '3*(env.x.a + env.x.b) + env.z',
                extractOutputs: 'false',
                jsonEnvs: '*',
            })
            .setEnv({
                x: '{"a": 4, "b": 2}',
                z: '100'
            }));
        expect(res.commands.outputs).toEqual({result: '118', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('json envs failure', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'env.x',
                extractOutputs: 'false',
                jsonEnvs: '*',
            })
            .setEnv({x: '.'}));
        expect(res.commands.errors.length).toBeGreaterThan(0);
        expect(res.commands.outputs).toEqual({timedOut: 'false'});
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it('octokit request', async () => {
        if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
            const res = await target.run(RunOptions.create()
                .setInputs(<ActionInputsInterface>{
                    expression:
                        '(await octokit.rest.repos.get({owner: context.repo.owner, repo: context.repo.repo})).data.name',
                })
                .setEnv({
                    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
                    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY
                })
            );
            expect(res.commands.outputs).toEqual({
                result: 'js-eval-action',
                timedOut: 'false'
            });
            expect(res.commands.errors).toEqual([]);
            expect(res.isSuccess).toEqual(true);
            expect(res.warnings).toHaveLength(0);
        }
    });

    it('semver', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression:
                    'semver.parse(inputs.x).compare(inputs.y)',
                x: '2.3.4',
                y: '2.5.6'
            }));
        expect(res.commands.outputs).toEqual({result: '-1', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('semver assertion', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: `({ 
                    greater: semver.gte(env.NEW_VERSION, env.OLD_VERSION), 
                    compatible: semver.major(env.NEW_VERSION) === semver.major(env.OLD_VERSION)
                    })`,
                extractOutputs: 'true'
            })
            .setEnv({
                OLD_VERSION: '1.2.3',
                NEW_VERSION: '1.4.1'
            }));
        expect(res.commands.outputs).toEqual({greater: 'true', compatible: 'true', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('yaml, fs, path await', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'yaml.parse((await fs.readFile(path.join(".", "action.yml"))).toString()).name'
            }));
        expect(res.commands.outputs).toEqual({result: 'js-eval-action', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('dotenv test', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'dotenvExpand({parsed: dotenv.parse(fs.readFileSync("tests/integration/values.env"))}).parsed',
                extractOutputs: 'true'
            }));
        expect(res.commands.outputs).toEqual({
            VALUE1: 'abc',
            VALUE2: '123abc456',
            timedOut: "false"
        });
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('buffer', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: `Buffer.from(new ArrayBuffer(10)).length === 10 && buffer.Buffer === Buffer`
            }));
        expect(res.commands.outputs).toEqual({
            result: 'true',
            timedOut: "false"
        });
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it("respect timeoutMs", async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: "new Promise(resolve => { setTimeout(() => resolve(22), 1000) })",
                timeoutMs: '50'
            }));
        expect(res.commands.outputs).toEqual({ timedOut: 'true' });
        if (!inspector.url()) {
            expect(res.durationMs).toBeLessThan(1000);
            expect(res.durationMs).toBeGreaterThanOrEqual(50);
        }
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it("timeout doesn't prevent to exit early", async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: "2",
                timeoutMs: '1000'
            }));
        expect(res.commands.outputs).toEqual({ result: '2', timedOut: 'false' });
        if (!inspector.url()) {
            expect(res.durationMs).toBeLessThan(1000);
        }
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('github core access', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                expression: 'core.setSecret("adr32fer43434f")',
            }));
        expect(res.commands.secrets).toEqual(['adr32fer43434f']);
        expect(res.commands.outputs).toEqual({result: 'undefined', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('correct jsFile', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                jsFile: 'tests/integration/evaluateJsFileCases/oneLine.js',
            }));
        expect(res.commands.outputs).toEqual({result: '4', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('complicated jsFile', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                jsFile: 'tests/integration/evaluateJsFileCases/complicated.js',
            }));
        expect(res.commands.secrets).toEqual(['sa5464dad']);
        expect(res.commands.outputs).toEqual({result: '22', timedOut: 'false'});
        expect(res.commands.errors).toEqual([]);
        expect(res.isSuccess).toEqual(true);
        expect(res.warnings).toHaveLength(0);
    });

    it('incorrect jsFile', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                jsFile: 'tests/integration/evaluateJsFileCases/incorrect.js',
            }));
        expect(res.commands.outputs).toEqual({timedOut: 'false'});
        expect(res.commands.errors).toEqual(['ReferenceError: require is not defined']);
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it('non-existing jsFile', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                jsFile: 'tests/integration/evaluateJsFileCases/non-existing.js',
            }));
        expect(res.commands.outputs).toEqual({timedOut: 'false'});
        expect(res.commands.errors.find(err => err.indexOf('non-existing.js') !== -1)).toBeTruthy();
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });

    it('jsFile and expression', async () => {
        const res = await target.run(RunOptions.create()
            .setInputs(<ActionInputsInterface>{
                jsFile: 'tests/integration/evaluateJsFileCases/oneLine.js',
                expression: '2 * 2'
            }));
        expect(res.commands.outputs).toEqual({timedOut: 'false'});
        expect(res.commands.errors.length).toBeGreaterThan(0);
        expect(res.isSuccess).toEqual(false);
        expect(res.warnings).toHaveLength(0);
    });
});