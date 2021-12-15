import {evaluateCode} from "../../src/evaluateCode";
import {ActionOutputsFake} from "./ActionOutputsFake";
import {performance} from "perf_hooks";

describe('evaluateCode', () => {
    let outputsFake: ActionOutputsFake;

    beforeEach(() => {
        outputsFake = new ActionOutputsFake();
    })

    it('should calculate math expression', async () => {
       await evaluateCode(
           {},
           '5 * 2',
           outputsFake,
           false
           )
       expect(outputsFake.result).toEqual(10);
       expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should set result', async () => {
        await evaluateCode(
            {},
            '({a: 4, b: 5})',
            outputsFake,
            false
        )
        expect(outputsFake.result).toEqual({a: 4, b: 5});
        expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should set outputs', async () => {
        await evaluateCode(
            {},
            '({a: 4, b: 5})',
            outputsFake,
            true
        )
        expect(outputsFake.result).toBeUndefined();
        expect(outputsFake.outputsObj).toEqual({a: 4, b: 5});
    });

    it('should handle null', async () => {
        await evaluateCode(
            {},
            'null',
            outputsFake,
            true
        )
        expect(outputsFake.result).toBeNull();
        expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should access context', async () => {
        await evaluateCode(
            { x: {y: 5} },
            'x.y * 3',
            outputsFake,
            false
        )
        expect(outputsFake.result).toEqual(15);
        expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should not access external var', async () => {
        await expect(async () => {
             // noinspection JSUnusedLocalSymbols
            const x = 5;
             await evaluateCode(
                {},
                'x',
                outputsFake,
                false
            )
        }).rejects.toThrow();

        expect(outputsFake.result).toBeUndefined();
        expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should await promise', async () => {
        await evaluateCode(
            {},
            'new Promise((resolve, reject) => {resolve("blah")})',
            outputsFake,
            false
        )
        expect(outputsFake.result).toEqual('blah');
        expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should fail on sync timeout', async () => {
        const startTime = performance.now();
        await expect(async () => {
            await evaluateCode(
                {},
                '{ let x = 0; for (let i = 0; i < 100000000; i++) { x += i*i; }; return x; }',
                outputsFake,
                false,
                100
            )
        }).rejects.toThrow('timed out');
        const endTime = performance.now();
        expect(endTime-startTime).toBeLessThan(200);
        expect(endTime-startTime).toBeGreaterThan(100);
        expect(outputsFake.result).toBeUndefined();
        expect(outputsFake.outputsObj).toBeUndefined();
    });

    it('should fail on async timeout', async () => {
        const startTime = performance.now();
        await expect(async () => {
            await evaluateCode(
                {},
                'new Promise((resolve, reject) => { setTimeout(() => { resolve(3); }, 200); })',
                outputsFake,
                false,
                100
            );
        }).rejects.toThrow('timed out');
        const endTime = performance.now();
        expect(endTime-startTime).toBeLessThan(200);
        expect(endTime-startTime).toBeGreaterThan(100);
        expect(outputsFake.result).toBeUndefined();
        expect(outputsFake.outputsObj).toBeUndefined();
    });
});