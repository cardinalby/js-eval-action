import Mock = jest.Mock;
import {ProxyObject, ActionInputsObjectInterface, GetInputFn} from "../../src/proxyObject";

describe('ProxyObject', () => {
    let getInputMock: GetInputFn & Mock;
    let actionInputsObject: ActionInputsObjectInterface;

    beforeEach(() => {
        getInputMock = jest.fn();
        actionInputsObject = new ProxyObject(getInputMock, 'input')
    });

    it('should return values', () => {
        getInputMock.mockImplementation((input: string) => {
            switch (input) {
                case 'input1': return 'val1';
                case 'input2': return 'val2';
            }
            return '';
        })

        expect(actionInputsObject.input1).toBe('val1');
        expect(actionInputsObject.input2).toBe('val2');
        expect(actionInputsObject.input3).toBe('');
    })
})