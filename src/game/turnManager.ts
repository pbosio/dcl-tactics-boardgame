import { Faction } from "../unit/faction";

export class TurnManager{
    private static _factions: Faction[] = []
    private static _currentFactionId: number = 0
    private static _onTurnChangedListeners: TurnManager.IOnTurnChangeListener[] = []
    private static _isPerformingAction = false

    static addFaction(faction: Faction){
        this._factions.push(faction)
    }

    static endTurn(){
        //this._currentFactionId ++;
        if (this._currentFactionId > this._factions.length){
            this._currentFactionId = 0
        }
        this._onTurnChangedListeners.forEach(listener => {
            listener.onTurnChanged(this._factions[this._currentFactionId]) 
        });
    }

    static addListener(listener: TurnManager.IOnTurnChangeListener){
        this._onTurnChangedListeners.push(listener)
    }

    static startAction(){
        this._isPerformingAction = true
    }

    static endAction(){
        this._isPerformingAction = false
        this.endTurn()
    }

    static canPerfromAction(): boolean{
        return !this._isPerformingAction
    }

    private constructor(){

    }
}

export namespace TurnManager{
    export interface IOnTurnChangeListener{
        onTurnChanged(faction: Faction)
    }
}