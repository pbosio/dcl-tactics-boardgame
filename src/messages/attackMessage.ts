import { Unit } from "../unit/unit";
import { AttackManager } from "../game/attackManager";
import { MessageManager } from "./messageManager";

export class AttackMessage implements MessageManager.IMessage{
    private _scrUnit: Unit
    private _atkInstance: AttackManager.AttackInstance

    constructor(scrUnit: Unit, atkInstance: AttackManager.AttackInstance){
        this._scrUnit = scrUnit
        this._atkInstance = atkInstance
    }

    execute() {
        this._scrUnit.attack(this._atkInstance)
    }
}