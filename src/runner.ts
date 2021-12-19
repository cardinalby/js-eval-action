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
    const inputsKVJsonStorage = new KeyValueJsonStorage(
        ghActions.getInput, actionInputs.jsonInputs, false
    );
    const envVarsKVJsonStorage = new KeyValueJsonStorage(
        name => process.env[name] || '', actionInputs.jsonEnvs, true
    );
    const octokit = process.env.GITHUB_TOKEN
        ? getOctokit(process.env.GITHUB_TOKEN)
        : undefined;

    const evalContext = {
        inputs: new ProxyObject(inputsKVJsonStorage.getInput.bind(inputsKVJsonStorage), 'input'),
        env: new ProxyObject(inputsKVJsonStorage.getInput.bind(envVarsKVJsonStorage), 'env variable'),
        octokit,
        context,
        semver,
        yaml,
        wildstring,
        fs,
        core: ghActions
    };

    await evaluateCode(
        evalContext,
        actionInputs.expression,
        new ActionOutputs(ghActions.setOutput, formatOutput),
        actionInputs.extractOutputs,
        actionInputs.timeoutMs
    )
}