import { Unit } from "./unit";

export class Faction{
    private _name: string
    private _units: Unit[] = []

    get name(): string{return this._name}

    private static _factions: Faction[] = []
    static getFaction(factionName: string){
        Faction._factions.forEach(faction => {
            if(faction.name == factionName) return faction
        });
        return null
    }

    static getAllUnits(): Unit[]{
        let ret: Unit[] = []
        Faction._factions.forEach(faction => {
            ret = ret.concat(faction._units)
        });
        return ret
    }

    constructor(factionName: string){
        this._name = factionName
        Faction._factions.push(this)
    }

    addUnit(unit: Unit){
        unit.factionData = {uid: this._units.length, faction: this}
        this._units.push(unit)
    }

    getUnit(uid: number){
        return this._units[uid]
    }

    getUnits(): Unit[]{
        return this._units
    }

    removeUnit(unit: Unit){
        this._units.splice(this._units.indexOf(unit),1)
    }
}

export namespace Faction{
}