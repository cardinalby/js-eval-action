import * as assertModule from "assert";
import * as ghActions from '@actions/core';
import * as github from '@actions/github';
import * as semverLib from 'semver';
import * as wildstringLib from 'wildstring';
import * as dotenvLib from 'dotenv';
import dotenvExpandLib from 'dotenv-expand';
import * as yamlLib from 'yaml';
import * as fsExtraLib from 'fs-extra';
import * as pathLib from 'path';

declare global {
    const
        inputs:  {[key: string]: any|string, expression: string, data: string},
        env: {[key: string]: any|string},
        octokit: ReturnType<typeof github.getOctokit>,
        context: typeof github.context,
        semver: typeof semverLib,
        yaml: typeof yamlLib,
        dotenv: typeof dotenvLib,
        dotenvExpand: typeof dotenvExpandLib,
        core: typeof ghActions,
        wildstring: typeof wildstringLib,
        assert: typeof assertModule,
        fs: typeof fsExtraLib,
        path: typeof pathLib
}