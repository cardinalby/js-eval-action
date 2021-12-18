import * as ghActions from '@actions/core';
import {context, getOctokit} from '@actions/github';
import * as semver from 'semver';
import * as wildstring from 'wildstring';
import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import {ActionOutputs, formatOutput} from './actionOutputs';
import {ProxyObject} from './proxyObject';
import {ActionInputs} from './actionInputs';
import {evaluateCode} from './evaluateCode';
import {KeyValueJsonStorage} from "./keyValueJsonStorage";

export async function run(): Promise<void> {
    try {
        await runImpl();
    } catch (error) {
        ghActions.setFailed(String(error));
    }
}

async function runImpl() {
    const actionInputs = new ActionInputs(ghActions.getInput);
    const inputsJsonEvaluator = new KeyValueJsonStorage(
        ghActions.getInput, actionInputs.jsonInputs
    );
    const envVarsJsonEvaluator = new KeyValueJsonStorage(
        name => process.env[name] || '', actionInputs.jsonEnvs
    );
    const octokit = process.env.GITHUB_TOKEN
        ? getOctokit(process.env.GITHUB_TOKEN)
        : undefined;

    const evalContext = {
        inputs: new ProxyObject(inputsJsonEvaluator.getInput.bind(inputsJsonEvaluator), 'input'),
        env: new ProxyObject(inputsJsonEvaluator.getInput.bind(envVarsJsonEvaluator), 'env variable'),
        octokit,
        context,
        semver,
        yaml,
        wildstring,
        fs
    };

    await evaluateCode(
        evalContext,
        actionInputs.expression,
        new ActionOutputs(ghActions.setOutput, formatOutput),
        actionInputs.extractOutputs,
        actionInputs.timeoutMs
    )
}