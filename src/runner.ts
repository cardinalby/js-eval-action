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
import {GetRawValueFn, KeyValueJsonStorage} from "./keyValueJsonStorage";
import {LoggerFunction} from "./logger";
import {MatchKeyRuleInterface} from "./matchKeyRule";
import assert = require("assert");

export async function run(logger?: LoggerFunction|undefined): Promise<void> {
    try {
        await runImpl(logger);
    } catch (error) {
        ghActions.setFailed(String(error));
    }
}

async function runImpl(logger?: LoggerFunction|undefined) {
    const actionInputs = new ActionInputs(ghActions.getInput);
    const actionOutputs = new ActionOutputs(ghActions.setOutput, formatOutput, logger);

    const octokit = process.env.GITHUB_TOKEN
        ? getOctokit(process.env.GITHUB_TOKEN)
        : undefined;

    const createProxy = (
        getRawValue: GetRawValueFn,
        jsonKeysRule: MatchKeyRuleInterface,
        caseSensitive: boolean,
        entityName: string
    ) => {
        const storage = new KeyValueJsonStorage(
            getRawValue, jsonKeysRule, caseSensitive, entityName, logger
        );
        return new ProxyObject(storage.getInput.bind(storage), entityName);
    }

    const inputsProxy = createProxy(ghActions.getInput, actionInputs.jsonInputs, false, 'input');
    const envProxy = createProxy(name => process.env[name] || '', actionInputs.jsonEnvs, true, 'env variable');

    const evalContext = {
        inputs: inputsProxy,
        env: envProxy,
        octokit,
        context,
        semver,
        yaml,
        wildstring,
        fs,
        core: ghActions,
        assert
    };

    await evaluateCode(
        evalContext,
        actionInputs.expression,
        actionOutputs,
        actionInputs.extractOutputs,
        actionInputs.timeoutMs
    )
}