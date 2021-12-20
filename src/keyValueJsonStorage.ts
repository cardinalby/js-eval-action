import {wrapError} from "./utils";
import {MatchKeyRuleInterface} from "./matchKeyRule";
import {LoggerFunction} from "./logger";

export interface KeyValueStorageInterface {
    getInput(name: string): any;
}

export type GetRawValueFn = (name: string) => string;

export class KeyValueJsonStorage implements KeyValueStorageInterface {
    private readonly _getRawValue: GetRawValueFn;
    private readonly _evaluatedCache = new Map<string, any>();
    private readonly _jsonKeysRule: MatchKeyRuleInterface;
    private readonly _caseSensitiveKeys: boolean;
    private readonly _entityName: string;
    private readonly _logger: LoggerFunction | undefined;

    constructor(
        getRawValue: GetRawValueFn,
        jsonKeysRule: MatchKeyRuleInterface,
        caseSensitiveKeys: boolean,
        entityName: string = 'value',
        logger?: LoggerFunction|undefined
    ) {
        this._getRawValue = getRawValue;
        this._jsonKeysRule = jsonKeysRule;
        this._caseSensitiveKeys = caseSensitiveKeys;
        this._entityName = entityName;
        this._logger = logger;
    }

    getInput(name: string): any {
        const rawValue = this._getRawValue(name);
        const effectiveName = this._caseSensitiveKeys ? name : name.toUpperCase();
        if (this._evaluatedCache.has(effectiveName)) {
            return this._evaluatedCache.get(effectiveName);
        }
        if (this._jsonKeysRule.matches(name)) {
            const parsed = wrapError(
                () => JSON.parse(rawValue),
                `Can't parse "${name}" ${this._entityName} as JSON`
                );
            this._logger && this._logger(`${name} ${this._entityName} parsed as JSON`);
            this._evaluatedCache.set(effectiveName, parsed);
            return parsed;
        }
        return rawValue;
    }
}