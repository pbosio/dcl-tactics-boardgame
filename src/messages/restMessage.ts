import { MessageManager } from "./messageManager";
import { Unit } from "../unit/unit";

export class RestMessage implements MessageManager.IMessage{
    private _unit: Unit

    constructor(unit: Unit){
        this._unit = unit
    }

    execute() {
        this._unit.rest()
    }
}