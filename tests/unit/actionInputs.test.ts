import {createReadRawInputsFnFake} from "./ReadRawInputsFnFake";
import {ActionInputs, ActionInputsInterface} from "../../src/actionInputs";
import {MatchKeyRule} from "../../src/matchKeyRule";

type PropertyType<T, K extends keyof T> = T extends {[P in K]: infer R} ? R : any;
type InputTester<K extends keyof ActionInputsInterface> = (value: string) => PropertyType<ActionInputsInterface, K>

function getInputTester<K extends keyof ActionInputsInterface>(name: K): InputTester<K> {
    return (value: string): any => {
        const actionInputs = new ActionInputs(createReadRawInputsFnFake({[name]: value}));
        return actionInputs[name];
    }
}

describe('ActionInputs', () => {
    it('should read expression', () => {
        const tester = getInputTester('expression');
        expect(tester('2 * 2')).toEqual('2 * 2');
        expect(tester('21')).toEqual('21');
        expect(tester('x')).toEqual('x');
        expect(tester('')).toBeUndefined()
    });

    it('should read extractOutputs', () => {
        const tester = getInputTester('extractOutputs');
        expect(tester('true')).toEqual(true);
        expect(tester('True')).toEqual(true);
        expect(tester('TRUE')).toEqual(true);
        expect(tester('false')).toEqual(false);
        expect(tester('False')).toEqual(false);
        expect(tester('FALSE')).toEqual(false);
        expect(() => tester('12')).toThrow();
        expect(() => tester('')).toThrow();
    });

    it('should read jsonInputs', () => {
        const tester = getInputTester('jsonInputs');
        expect(tester('')).toEqual(MatchKeyRule.matchNone());
        expect(tester('ab | cd')).toEqual(MatchKeyRule.matchKeys(['ab', 'cd'], false));
        expect(tester('af')).toEqual(MatchKeyRule.matchKeys(['af'], false));
        expect(tester('*')).toEqual(MatchKeyRule.matchAll());
    });

    it('should read jsonEnvs', () => {
        const tester = getInputTester('jsonEnvs');
        expect(tester('')).toEqual(MatchKeyRule.matchNone());
        expect(tester('ab | cd')).toEqual(MatchKeyRule.matchKeys(['ab', 'cd'], true));
        expect(tester('af')).toEqual(MatchKeyRule.matchKeys(['af'], true));
        expect(tester('*')).toEqual(MatchKeyRule.matchAll());
    });

    it('should read timeoutMs', () => {
        const tester = getInputTester('timeoutMs');
        expect(tester('123')).toEqual(123);
        expect(tester('')).toEqual(undefined);
        expect(() => tester('-12')).toThrow();
        expect(() => tester('0')).toThrow();
        expect(() => tester('wefwe')).toThrow();
    });
});