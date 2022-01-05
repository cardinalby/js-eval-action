import * as ghActions from '@actions/core';
import {context, getOctokit} from '@actions/github';
import * as semver from 'semver';
import * as wildstring from 'wildstring';
import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import * as path from 'path';
import {ActionOutputs, formatOutput} from './actionOutputs';
import {ProxyObject} from './proxyObject';
import {ActionInputs, ActionInputsInterface} from './actionInputs';
import {evaluateCode, wrapExpression} from './evaluateCode';
import {GetRawValueFn, KeyValueJsonStorage} from "./keyValueJsonStorage";
import {LoggerFunction} from "./logger";
import {MatchKeyRuleInterface} from "./matchKeyRule";
import assert = require("assert");

export async function run(logger?: LoggerFunction|undefined): Promise<void> {
    try {
        await runImpl(logger);
    } catch (error) {
        if (typeof error == 'object' && error && error.hasOwnProperty('stack')) {
            console.log((error as any).stack);
        }
        ghActions.setFailed(String(error));
    }
}

function createProxyObject(
    logger: LoggerFunction|undefined,
    getRawValue: GetRawValueFn,
    jsonKeysRule: MatchKeyRuleInterface,
    caseSensitive: boolean,
    entityName: string
): ProxyObject {
    const storage = new KeyValueJsonStorage(
        getRawValue, jsonKeysRule, caseSensitive, entityName, logger
    );
    return new ProxyObject(storage.getInput.bind(storage), entityName);
}

function getEvalContext(
    jsonInputs: MatchKeyRuleInterface,
    jsonEnvs: MatchKeyRuleInterface,
    logger: LoggerFunction|undefined
): object {
    const inputsProxy = createProxyObject(
        logger, ghActions.getInput, jsonInputs, false, 'input');
    const envProxy = createProxyObject(
        logger, name => process.env[name] || '', jsonEnvs, true, 'env variable');

    const octokit = process.env.GITHUB_TOKEN
        ? getOctokit(process.env.GITHUB_TOKEN)
        : undefined;

    return {
        inputs: inputsProxy,
        env: envProxy,
        octokit,
        context,
        semver,
        yaml,
        wildstring,
        dotenv,
        dotenvExpand,
        fs,
        path,
        core: ghActions,
        assert
    };
}

async function getExpressionCode(inputs: ActionInputsInterface): Promise<string> {
    if (!!inputs.expression === !!inputs.jsFile) {
        throw new Error('Either "expression" or "jsFile" input should be set');
    }
    if (inputs.expression) {
        return wrapExpression(inputs.expression);
    }
    if (inputs.jsFile) {
        return (await fs.readFile(inputs.jsFile)).toString();
    }
    assert.fail('not reachable');
}

async function runImpl(logger?: LoggerFunction|undefined) {
    const actionInputs = new ActionInputs(ghActions.getInput);
    const actionOutputs = new ActionOutputs(ghActions.setOutput, formatOutput, logger);
    const evalContext = getEvalContext(actionInputs.jsonInputs, actionInputs.jsonEnvs, logger);
    let expressionCode: string;
    try {
        expressionCode = await getExpressionCode(actionInputs);
    } catch (error) {
        actionOutputs.setTimedOut(false);
        throw error;
    }

    await evaluateCode(
        evalContext,
        expressionCode,
        actionOutputs,
        actionInputs.extractOutputs,
        actionInputs.timeoutMs
    )
}