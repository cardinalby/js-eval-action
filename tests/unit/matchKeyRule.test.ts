import {MatchKeyRule} from "../../src/matchKeyRule";

describe('MatchKeyRule', () => {
    it('should match all', () => {
        const rule = MatchKeyRule.matchAll();
        expect(rule.matches('abc')).toStrictEqual(true);
        expect(rule.matches('WF')).toStrictEqual(true);
    });

    it('should handle repeating keys', () => {
        const rule = MatchKeyRule.matchKeys(['a', 'a'], true);
        expect(rule.matches('aa')).toStrictEqual(false);
        expect(rule.matches('a')).toStrictEqual(true);
    });

    it('should match case-insensitive keys', () => {
        const rule = MatchKeyRule.matchKeys(['ABC', 'def'], false);
        expect(rule.matches('abC')).toStrictEqual(true);
        expect(rule.matches('ABC')).toStrictEqual(true);
        expect(rule.matches('DEf')).toStrictEqual(true);
        expect(rule.matches('def')).toStrictEqual(true);
        expect(rule.matches('tit')).toStrictEqual(false);
    });

    it('should match case-sensitive keys', () => {
        const rule = MatchKeyRule.matchKeys(['ABC', 'def'], true);
        expect(rule.matches('abC')).toStrictEqual(false);
        expect(rule.matches('ABC')).toStrictEqual(true);
        expect(rule.matches('DEf')).toStrictEqual(false);
        expect(rule.matches('def')).toStrictEqual(true);
        expect(rule.matches('tit')).toStrictEqual(false);
    });

    it('should handle matchNone', () => {
        const rule = MatchKeyRule.matchNone();
        expect(rule.matches('A')).toStrictEqual(false);
        expect(rule.matches('a')).toStrictEqual(false);
    });
});