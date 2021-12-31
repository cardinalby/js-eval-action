[![test](https://github.com/cardinalby/js-eval-action/actions/workflows/test.yml/badge.svg)](https://github.com/cardinalby/js-eval-action/actions/workflows/test.yml)
[![build](https://github.com/cardinalby/js-eval-action/actions/workflows/build.yml/badge.svg)](https://github.com/cardinalby/js-eval-action/actions/workflows/build.yml)

## Eval JS expression as a workflow step

GitHub Action for evaluating JavaScript code passed as `expression` input.
Can be handy for implementing easy logic, math and string manipulation instead 
of using bash scripts.

## Examples

### Do simple math:
```yaml
- id: getNextAttemptNumber
  uses: cardinalby/js-eval-action@v1
  env:
    STEP_SIZE: 2
  with:
    data: '8'
    expression: "parseInt(inputs.data) + parseInt(env.STEP_SIZE)"

# steps.getNextAttemptNumber.outputs.result == "10"
```

### Compare the new version with the old one
```yaml
- id: checkNewVersion
  uses: cardinalby/js-eval-action@v1
  env:
    OLD_VERSION: 1.2.3
    NEW_VERSION: 1.3.0
  with:
    expression: |
      ({ 
        greater: semver.gte(env.NEW_VERSION, env.OLD_VERSION), 
        compatible: semver.major(env.NEW_VERSION) === semver.major(env.OLD_VERSION)
      })
    extractOutputs: 'true'  

# steps.checkNewVersion.outputs.greater == "true"
# steps.checkNewVersion.outputs.compatible == "true"
```

### Export env variables from .env file to a job env

```yaml
- name: Export env variables
  uses: ./
  env:
    ENV_FILE: 'constants.env'
  with:
    expression: |
      Object.entries(
        dotenv.parse(fs.readFileSync(env.ENV_FILE))
      ).forEach(
        e => core.exportVariable(e[0], e[1])
      )
```

### Validate [dispatched_workflow](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#workflow_dispatch) inputs

```yaml
- name: Validate workflow_dispatch inputs
  uses: ./
  env:
    attempt: ${{ github.event.inputs.attemptNumber }}
    max: ${{ github.event.inputs.maxAttempts }}
  with:
    expression: |
      {
        const attempt = parseInt(env.attempt), max = parseInt(env.max);
        assert(attempt && max && max >= attempt);
      } 

# Will fail if github.event.inputs are invalid
```

### Read JSON data
```yaml
- id: jsonExample
  uses: cardinalby/js-eval-action@v1
  env:
    MY_VAR: '{"a": "hello", "b": "hell"}'
  with:
    jsonEnvs: MY_VAR
    expression: "env.MY_VAR.a.indexOf(env.MY_VAR.b) !== -1"

# steps.jsonExample.outputs.result == "true"
```

### Get default branch by octokit request
```yaml
- id: getDefaultBranch
  uses: cardinalby/js-eval-action@v1
  env:
    # Required to use octokit
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} 
  with:
    expression: | 
      (await octokit.rest.repos.get({
        owner: context.repo.owner, 
        repo: context.repo.repo
      })).data.default_branch

# steps.getDefaultBranch.outputs.result == "master"
```
For this particular case you can use a dedicated [octokit/request-action](https://github.com/marketplace/actions/github-api-request).

### Parse yaml
```yaml
- id: readYamlExample
  uses: cardinalby/js-eval-action@v1  
  with:
    expression: 'yaml.parse((await fs.readFile("fileInRepo.yml")).toString()).myProperty'

# steps.readYamlExample.outputs.result == "property value"
```

## Inputs

### `expression` **Required**
JS expression that returns a value. 
* By default, (if `extractOutputs` input is `false`) 
the value will be [serialized](#output-serialization) to string and put to `result` output. 
If `extractOutputs` iss `true`, the value has to be an object. Each property of it will be considered 
as a separate output and [serialized](#output-serialization) to string.
* Expression will be put to `async () => %EXPRESSION%` wrapper.
* You can use `await` in the expression and return a Promise. When it is fulfilled, 
it's result will be taken.
* You can use curly braces with return statement: `{ let x = 5; x += 2; return x; }` 
* To return the object directly wrap it into parentheses: `({out1: 5, out2: 10})`; 
* Do not pass untrusted string to `expression`!

### `extractOutputs` Default: `false`
Requires the value returned by the expression to be an object. Each property of it will be considered
as a separate output and [serialized](#output-serialization) to string. To return the object directly in the 
expression wrap it into parentheses
 
### `jsonInputs` Default: _empty_
Parse listed inputs as JSON (if you access them via `inputs.NAME` in expression). 
* Format: input names separated by `|` sign. Example: `input1|input2`.
* Use asterisk `*` to parse all inputs as JSON.

### `jsonEnvs` Default: _empty_
Parse listed env variables as JSON (if you access them via `env.NAME` in expression).
* Format: input names separated by `|` sign. Example: `input1|input2`.
* Use asterisk `*` to parse all inputs as JSON.

### `timeoutMs` Default: _empty_
Timeout of JS evaluation in milliseconds. No timeout if empty. If timeout reached, action fails with error
and `timedOut` output set to `true`.

### `data` Default: _empty_
Arbitrary data to be accessed inside JS expression. Doesn't have any other meaning.

### Any other inputs
You can also set other not documented inputs and access them in JS expression using `inputs.NAME`, 
but in this case GitHub runner will produce warnings about unknown inputs. To avoid it you can:
* Set env variables for the step and access them as `env.NAME` in the expression
* Set env variables with `INPUT_` prefixes. For example, `INPUT_XYZ` (upper case!) env variable is 
  considered `xyz` input and doesn't produce a warning.

## Outputs

### `result`
If `extractOutputs` input is `false` contains a result of the expression evaluation. `undefined` otherwise.

### `timedOut`
If `timeoutMs` input is set and execution was timed out, this output contains `true`. `false` otherwise.

### Any other outputs
If `extractOutputs` input is `true`, each property of the object returned by the expression will be
serialized and set as a separate output.

## Output serialization
Value returned by the JS expression is serialized to string that will be set to output(s).
* If `extractOutputs` input is `false` (default), expression result will be serialized and put to `result` output.
* If `extractOutputs` input is `true`, expression result has to be an object. Each property of it will be
  serialized and set as a separate output.

Serialization rules:

| JS value       | String           |
|----------------|------------------|
| true           | true             |
| false          | false            |
| 123            | 123              |
| "abc"          | abc              |
| undefined      | undefined        |
| {a: 3, b: "c"} | {"a":3,"b":"c"}  |
| ["a", "b"]     | ["a","b"]        |

## JavaScript evaluation context

In the expression you can access the following objects:

### `inputs`

Allows you to read inputs in form of `inputs.inputName`. Note, that input names are not case-sensitive.  
Normally all inputs are of string type. But if the input you read is marked as JSON input by 
[`jsonInputs`](#jsoninputs-default-_empty_), it will be parsed 
(at the moment of access) and result value will be returned.

### `env`

Allows you to read env variables in form of `env.varName`. Note, that env variables names are case-sensitive.  
Normally all env variables are of string type. But if the env variable you read is marked as JSON input by
[`jsonEnvs`](#jsonenvs-default-_empty_), it will be parsed
(at the moment of access) and result value will be returned.

### `context`

GitHub Actions [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts) object.

### `octokit`
 
Contains an instance of [octokit](https://www.npmjs.com/package/@actions/github) if `GITHUB_TOKEN` 
env variable is set. Usage example:
```js
(await octokit.rest.repos.get({owner: context.repo.owner, repo: context.repo.repo})).data.name
```

### `core`

Contains [@actions/core](https://github.com/actions/toolkit/tree/main/packages/core) library.

### `semver`

Contains [semver](https://www.npmjs.com/package/semver) library.

### `yaml`

Contains [yaml](https://www.npmjs.com/package/yaml) library.

### `wildstring`

Contains [wildstring](https://www.npmjs.com/package/wildstring) library.

### `dotenv`

Contains [dotenv](https://www.npmjs.com/package/dotenv) library.

### `fs`

Contains [fs-extra](https://www.npmjs.com/package/fs-extra) library.

### `assert`

Contains NodJS [assert](https://nodejs.org/docs/latest-v12.x/api/assert.html) library.<br>
Note: `console.assert()` doesn't cause an Error in NodeJS since version 10. It's the reason to
use `assert(value)`, `assert.deepStrictEqual(actual, expected)`, etc. instead.