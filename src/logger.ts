import * as ghActions from '@actions/core';

export type LoggerFunction = (message: string) => void;

export const actionsInfoLogger: LoggerFunction = (message: string) => ghActions.info(message);