import {ActionOutputs, formatOutput, FormatOutputFn, SetOutputFn} from '../../src/actionOutputs'
import 'jest'
import Mock = jest.Mock;

const wasCalledWith = (mock: Mock, args: any[]) => {
    const compareArrays = (arr1: any[], arr2: any[]) =>
        arr1.length === arr2.length &&
        arr1.every((value, index) => arr2[index] === value);

    return mock.mock.calls.findIndex(call => compareArrays(call, args)) !== -1;
}

describe('formatOutput', () => {
    it('should stringify primitive types', () => {
        expect(formatOutput('sss')).toBe('sss');
        expect(formatOutput(124)).toBe('124');
        expect(formatOutput(13.43)).toBe('13.43');
        expect(formatOutput(null)).toBe('null');
        expect(formatOutput(false)).toBe('false');
        expect(formatOutput(true)).toBe('true');
        expect(formatOutput(undefined)).toBe('undefined');
    });
    it('should throw on unsupported types', () => {
        expect(() => { formatOutput(Symbol('s1')) }).toThrow(Error);
        expect(() => { formatOutput(() => {}) }).toThrow(Error);
    });
    it('should stringify object', () => {
        expect(JSON.parse(formatOutput({p1: 11, p2: 's2'}))).toStrictEqual({p1: 11, p2: 's2'});
        expect(JSON.parse(formatOutput({}))).toStrictEqual({});
        expect(JSON.parse(formatOutput(['x', 'y']))).toStrictEqual(['x', 'y']);
        const date = new Date()
        expect(formatOutput(date)).toBe(JSON.stringify(date));
    });
});

describe('ActionOutputs', () => {
    let setOutputMock: SetOutputFn & Mock;
    let formatOutputMock: FormatOutputFn & Mock;
    let actionOutputs: ActionOutputs;

    beforeEach(() => {
        setOutputMock = jest.fn(() => {});
        formatOutputMock = jest.fn(value => formatOutput(value));
        actionOutputs = new ActionOutputs(setOutputMock, formatOutputMock);
    });

    it('should set result', () => {
        actionOutputs.setResult('testVal');
        expect(setOutputMock.mock.calls.length).toBe(1);
        expect(formatOutputMock.mock.calls.length).toBe(1);
        expect(formatOutputMock.mock.calls[0]).toEqual(['testVal']);
        expect(setOutputMock.mock.calls[0]).toEqual(['result', 'testVal']);
    });

    it('should set outputs happy path', () => {
        const outputsObj = {
            prop1: 'val1',
            prop2: 49,
            333: {a: 2},
            [Symbol('s')]: 21,
        };
        actionOutputs.setOutputs(outputsObj);

        expect(wasCalledWith(formatOutputMock, [outputsObj.prop1])).toBeTruthy();
        expect(wasCalledWith(formatOutputMock, [outputsObj.prop2])).toBeTruthy();
        expect(wasCalledWith(formatOutputMock, [outputsObj['333']])).toBeTruthy();

        expect(setOutputMock.mock.calls.length).toBe(3);
        expect(wasCalledWith(setOutputMock, ['prop1', formatOutputMock(outputsObj.prop1)])).toBeTruthy();
        expect(wasCalledWith(setOutputMock, ['prop2', formatOutputMock(outputsObj.prop2)])).toBeTruthy();
        expect(wasCalledWith(setOutputMock, ['333', formatOutputMock(outputsObj['333'])])).toBeTruthy();
    });
});