import {InputsJsonEvaluator} from "../../src/inputsJsonEvaluator";

describe('InputsJsonEvaluator', () => {
    const getRawInput = (name: string) => {
        switch (name) {
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

    it('should pass raw value without regex', function () {
        const evaluator = new InputsJsonEvaluator(getRawInput, []);
        expect(evaluator.getInput('i1')).toEqual('str');
        expect(evaluator.getInput('i2')).toEqual('42');
        expect(evaluator.getInput('i3')).toEqual('{"x": "val"}');
        expect(evaluator.getInput('i4')).toEqual('{');
        expect(evaluator.getInput('i5')).toEqual('2 * 2');
    });

    it('should pass mixed values', function () {
        const evaluator = new InputsJsonEvaluator(getRawInput, ['i3', 'i2']);
        expect(evaluator.getInput('i1')).toEqual('str');
        expect(evaluator.getInput('i2')).toEqual(42);
        expect(evaluator.getInput('i3')).toEqual({x: "val"});
        expect(evaluator.getInput('i4')).toEqual('{');
        expect(evaluator.getInput('i5')).toEqual('2 * 2');
        expect(evaluator.getInput('i6')).toEqual('{"__proto__": {"x": 5}}');
        expect(evaluator.getInput('i7')).toEqual('');
    });

    it('should handle true jsonInputs', function () {
        const evaluator = new InputsJsonEvaluator(getRawInput, true);
        expect(evaluator.getInput('i2')).toEqual(42);
        expect(evaluator.getInput('i3')).toEqual({x: "val"});
    });

    it('should not pollute prototype', function () {
        const evaluator = new InputsJsonEvaluator(getRawInput, true);
        expect(evaluator.getInput('i6')).toEqual({['__proto__']: {"x": 5}});
        const emptyObj: any = {};
        expect(emptyObj.x).toBeUndefined();
    });

    it('should throw on invalid JSON', function () {
        const evaluator = new InputsJsonEvaluator(getRawInput, true);
        expect(() => evaluator.getInput('i1')).toThrow('i1');
        expect(() => evaluator.getInput('i4')).toThrow('i4');
        expect(() => evaluator.getInput('i5')).toThrow('i5');
        expect(() => evaluator.getInput('i7')).toThrow('i7');
    });
});