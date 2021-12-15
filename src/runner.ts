import * as ghActions from '@actions/core';
import { context } from '@actions/github';
import { getOctokit } from '@actions/github'
import * as semver from 'semver';
import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import {ActionOutputs, formatOutput} from './actionOutputs';
import { ActionInputsObject } from './actionInputsObject';
import { actionInputs } from './actionInputs';
import { evaluateCode } from './evaluateCode';

export async function run(): Promise<void> {
    try {
        await runImpl();
    } catch (error) {
        ghActions.setFailed(String(error));
    }
}

async function runImpl() {
    const octokit = process.env.GITHUB_TOKEN
        ? getOctokit(process.env.GITHUB_TOKEN)
        : undefined;

    const evalContext = {
        inputs: new ActionInputsObject(ghActions.getInput),
        env: process.env,
        octokit,
        context,
        semver,
        yaml,
        fs
    }

    await evaluateCode(
        evalContext,
        actionInputs.expression,
        new ActionOutputs(ghActions.setOutput, formatOutput),
        actionInputs.extractOutputs,
        actionInputs.timeout
    )
}