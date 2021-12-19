import {ActionOutputsInterface, ActionOutputsObjectInterface} from "../../src/actionOutputs";

export class ActionOutputsFake implements ActionOutputsInterface{
    public result: any = undefined;
    public timedOut: boolean|undefined;
    public outputsObj: ActionOutputsObjectInterface|undefined = undefined;

    setOutputs(outputs: ActionOutputsObjectInterface): void {
        this.outputsObj = outputs;
    }

    setResult(value: any): void {
        this.result = value;
    }

    setTimedOut(value: boolean): void {
        this.timedOut = value;
    }
}