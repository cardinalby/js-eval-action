import {createReadRawInputsFnFake} from "./ReadRawInputsFnFake";
import {ActionInputs} from "../../src/actionInputs";

type InputName = 'expression'|'extractOutputs'|'jsonInputs'|'jsonEnvs'|'timeoutMs';
function getInputTester<R>(name: InputName): (value: string) => R {
    return (value: string): any => {
        const actionInputs = new ActionInputs(createReadRawInputsFnFake({[name]: value}));
        return actionInputs[name];
    }
}

describe('ActionInputs', () => {
    it('should read expression', () => {
        const tester = getInputTester<string>('expression');
        expect(tester('2 * 2')).toEqual('2 * 2');
        expect(tester('21')).toEqual('21');
        expect(tester('x')).toEqual('x');
        expect(() => tester('')).toThrow();
    });

    it('should read extractOutputs', () => {
        const tester = getInputTester<boolean>('extractOutputs');
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
        const tester = getInputTester<string[]|true>('jsonInputs');
        expect(tester('')).toEqual([]);
        expect(tester('ab | cd')).toEqual(['ab', 'cd']);
        expect(tester('af')).toEqual(['af']);
        expect(tester('*')).toEqual(true);
    });

    it('should read jsonEnvs', () => {
        const tester = getInputTester<string[]|true>('jsonEnvs');
        expect(tester('')).toEqual([]);
        expect(tester('ab | cd')).toEqual(['ab', 'cd']);
        expect(tester('af')).toEqual(['af']);
        expect(tester('*')).toEqual(true);
    });

    it('should read timeoutMs', () => {
        const tester = getInputTester<number|undefined>('timeoutMs');
        expect(tester('123')).toEqual(123);
        expect(tester('')).toEqual(undefined);
        expect(() => tester('-12')).toThrow();
        expect(() => tester('0')).toThrow();
        expect(() => tester('wefwe')).toThrow();
    });
});