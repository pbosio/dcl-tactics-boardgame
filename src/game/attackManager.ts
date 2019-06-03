import { Unit } from "../unit/unit";

export class AttackManager{
    private static _damageBonus: IDamageBonuses

    private constructor(){}

    static addBonus(forType: number, againstType: number, bonusMultiplier: number){
        if (this._damageBonus == null){
            this._damageBonus = {}
        }
        if (this._damageBonus[forType] == undefined){
            this._damageBonus[forType] = {}
        }
        this._damageBonus[forType][againstType] = bonusMultiplier
    }
    
    static getBonus(forType: number, againstType: number): number{
        if (this._damageBonus[forType] != undefined && this._damageBonus[forType][againstType] != undefined){
            return this._damageBonus[forType][againstType]
        }
        return 0
    }

    static getAttackInstance(attacker: Unit, target: Unit): AttackManager.AttackInstance{
        let ret = new AttackManager.AttackInstance()
        ret.bonusDamage = this.getBonus(attacker.getUnitType(), target.getUnitType())
        ret.totalDamage = attacker.getDamage() * (1+ret.bonusDamage)
        ret.isTargetDead = target.getHP() - ret.totalDamage <= 0
        ret.attacker = attacker
        ret.target = target
        return ret
    }
}

interface IDamageBonuses{
    [index: number]: IDamageBonusData
}

interface IDamageBonusData{
    [index: number]: number
}

export namespace AttackManager{

    export class AttackInstance{
        bonusDamage: number
        totalDamage: number
        isTargetDead: boolean
        attacker: Unit
        target: Unit
    }

}