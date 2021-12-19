export interface MatchKeyRuleInterface {
    matches(key: string): boolean;
}

export class MatchKeyRule implements MatchKeyRuleInterface {
    private readonly _keys: Set<string>|boolean;
    private readonly _caseSensitive: boolean;

    private constructor(keys: Set<string>|boolean, caseSensitive: boolean) {
        this._keys = keys;
        this._caseSensitive = caseSensitive;
    }

    static matchAll(): MatchKeyRule {
        return new MatchKeyRule(true, false);
    }

    static matchKeys(keys: string[], caseSensitive: boolean): MatchKeyRule {
        return new MatchKeyRule(
            new Set(caseSensitive
                ? keys
                : keys.map(k => k.toUpperCase())
            ),
            caseSensitive
        );
    }

    static matchNone() {
        return new MatchKeyRule(false, false);
    }

    matches(key: string): boolean {
        if (typeof this._keys === 'boolean') {
            return this._keys;
        }
        return this._keys.has(this._caseSensitive
            ? key
            : key.toUpperCase()
        );
    }
}