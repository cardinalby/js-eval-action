import * as ghActions from '@actions/core';
import { context } from '@actions/github';
import { getOctokit } from '@actions/github'
import { ActionOutputs } from './actionOutputs';
import { ActionInputsObject } from './actionInputsObject';
import { actionInputs } from './actionInputs';
import { evaluateCode } from './evaluateCode';

async function run(): Promise<void> {
    try {
        await runImpl();
    } catch (error) {
        ghActions.setFailed(error.message);
    }
}

async function runImpl() {
    const octokit = process.env.GITHUB_TOKEN
        ? getOctokit(process.env.GITHUB_TOKEN)
        : undefined;
    await evaluateCode(
        octokit,
        new ActionInputsObject(),
        context,
        process.env,
        actionInputs.expression,
        new ActionOutputs(),
        actionInputs.extractOutputs,
        actionInputs.timeout
    )
}

// noinspection JSIgnoredPromiseFromCall
run();
