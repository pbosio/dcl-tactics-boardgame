import { Unit } from "./unit";

export class Faction{
    private _name: string
    private _units: Unit[] = []

    get name(): string{return this._name}

    private static _factions: Record<string, Faction> = {}
    static getFaction(factionName: string){return Faction._factions[factionName]}

    constructor(factionName: string){
        this._name = factionName
        Faction._factions[factionName] = this
    }

    addUnit(unit: Unit){
        unit.factionData = {uid: this._units.length, faction: this}
        this._units.push(unit)
    }

    getUnit(uid: number){
        return this._units[uid]
    }

    removeUnit(unit: Unit){
        this._units.splice(this._units.indexOf(unit))
    }
}

export namespace Faction{
}