import { Faction } from "../unit/faction";
import { TimerSystem } from "../modules/timerSystem";
import { TurnChangeScreen } from "../screens/turnChangeScreen";

export class TurnManager{
    private static _factions: Faction[] = []
    private static _currentFactionId: number = 0
    private static _onTurnChangedListeners: TurnManager.IOnTurnChangeListener[] = []
    private static _isPerformingAction = false

    static addFaction(faction: Faction){
        this._factions.push(faction)
    }

    static endTurn(){
        //TODO: check unit left for win/lose condition
        TurnChangeScreen.Show(this.getNextFaction().name + "\'s Turn",()=>{
            this._currentFactionId ++;
            if (this._currentFactionId >= this._factions.length){
                this._currentFactionId = 0
            }
            this._factions[this._currentFactionId].getUnits().forEach(unit => {
                unit.resetTurn()
            });
            log("turn "+this._factions[this._currentFactionId].name)
            this._onTurnChangedListeners.forEach(listener => {
                listener.onTurnChanged(this._factions[this._currentFactionId]) 
            });
            this.endAction()
        })
    }

    static addListener(listener: TurnManager.IOnTurnChangeListener){
        this._onTurnChangedListeners.push(listener)
    }

    static startAction(){
        this._isPerformingAction = true
    }

    static endAction(){
        this._isPerformingAction = false
    }

    static canPerfromAction(): boolean{
        return !this._isPerformingAction
    }

    static getNextFaction(): Faction{
        let current = this._currentFactionId
        current++
        if (current >= this._factions.length){
            current = 0
        }
        return this._factions[current]
    }

    private constructor(){

    }
}

export namespace TurnManager{
    export interface IOnTurnChangeListener{
        onTurnChanged(faction: Faction)
    }
}