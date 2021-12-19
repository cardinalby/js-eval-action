import {KeyValueJsonStorage} from "../../src/keyValueJsonStorage";
import {MatchKeyRule} from "../../src/matchKeyRule";

const getRawVal = (name: string, caseSensitive: boolean) => {
    switch (caseSensitive ? name : name.toLowerCase()) {
        case 'i1':
            return 'str';
        case 'i2':
            return '42';
        case 'i3':
            return '{"x": "val"}';
        case 'i4':
            return '{';
        case 'i5':
            return '2 * 2';
        case 'i6':
            return '{"__proto__": {"x": 5}}'
    }
    return '';
};
const getRawValCaseSensitive = (name: string) => getRawVal(name, true);
const getRawValCaseInsensitive = (name: string) => getRawVal(name, false);

describe('KeyValueJsonStorage', () => {
    it('should pass raw value with empty rule', function () {
        const matchRule = jest.fn(() => false);
        const storage = new KeyValueJsonStorage(getRawValCaseInsensitive, {matches: matchRule}, true);
        expect(storage.getInput('i1')).toEqual('str');
        expect(storage.getInput('I2')).toEqual('42');
        expect(storage.getInput('i3')).toEqual('{"x": "val"}');
        expect(storage.getInput('I4')).toEqual('{');
        expect(storage.getInput('i5')).toEqual('2 * 2');
        expect(matchRule.mock.calls[0]).toEqual(['i1']);
        expect(matchRule.mock.calls[1]).toEqual(['I2']);
        expect(matchRule.mock.calls[2]).toEqual(['i3']);
        expect(matchRule.mock.calls[3]).toEqual(['I4']);
        expect(matchRule.mock.calls[4]).toEqual(['i5']);
    });

    it('should pass mixed values', function () {
        const storage = new KeyValueJsonStorage(
            getRawValCaseInsensitive, MatchKeyRule.matchKeys(['i3', 'i2'], false), false
        );
        expect(storage.getInput('i1')).toEqual('str');
        expect(storage.getInput('i2')).toEqual(42);
        expect(storage.getInput('i3')).toEqual({x: "val"});
        expect(storage.getInput('i4')).toEqual('{');
        expect(storage.getInput('i5')).toEqual('2 * 2');
        expect(storage.getInput('i6')).toEqual('{"__proto__": {"x": 5}}');
        expect(storage.getInput('i7')).toEqual('');
    });

    it('should handle all jsonKeys', function () {
        const storage = new KeyValueJsonStorage(getRawValCaseInsensitive, MatchKeyRule.matchAll(), false);
        expect(storage.getInput('i2')).toEqual(42);
        expect(storage.getInput('i3')).toEqual({x: "val"});
    });

    it('should not pollute prototype', function () {
        const storage = new KeyValueJsonStorage(getRawValCaseInsensitive, MatchKeyRule.matchAll(), false);
        expect(storage.getInput('i6')).toEqual({['__proto__']: {"x": 5}});
        const emptyObj: any = {};
        expect(emptyObj.x).toBeUndefined();
    });

    it('should throw on invalid JSON', function () {
        const storage = new KeyValueJsonStorage(getRawValCaseInsensitive, MatchKeyRule.matchAll(), false);
        expect(() => storage.getInput('i1')).toThrow('i1');
        expect(() => storage.getInput('i4')).toThrow('i4');
        expect(() => storage.getInput('i5')).toThrow('i5');
        expect(() => storage.getInput('i7')).toThrow('i7');
    });

    it('should handle case insensitive rule', function () {
        const storage = new KeyValueJsonStorage(
            getRawValCaseInsensitive,
            MatchKeyRule.matchKeys(['i2', 'I3'], false),
            false
        );
        expect(storage.getInput('i1')).toEqual('str');
        expect(storage.getInput('i2')).toEqual(42);
        expect(storage.getInput('I2')).toEqual(42);
        expect(storage.getInput('I3')).toEqual({x: "val"});
        expect(storage.getInput('i3')).toEqual({x: "val"});
    });

    it('should handle case sensitive rule', function () {
        const storage = new KeyValueJsonStorage(
            getRawValCaseSensitive,
            MatchKeyRule.matchKeys(['i2', 'I3'], true),
            true
        );
        expect(storage.getInput('i1')).toEqual('str');
        expect(storage.getInput('i2')).toEqual(42);
        expect(storage.getInput('I2')).toEqual('');
        expect(storage.getInput('i3')).toEqual('{"x": "val"}');
        expect(() => storage.getInput('I3')).toThrow();
    });
});