import { Faction } from "../unit/faction";
import { TimerSystem } from "../modules/timerSystem";
import { TurnChangeScreen } from "../screens/turnChangeScreen";
import { GameOverScreen } from "../screens/gameoverScreen";

export class TurnManager{
    private static _factions: Faction[] = []
    private static _currentFactionId: number = 0
    private static _onTurnChangedListeners: TurnManager.IOnTurnChangeListener[] = []
    private static _isPerformingAction = false
    private static _turnNumber: number = 0

    static addFaction(faction: Faction){
        this._factions.push(faction)
    }

    static endTurn(){
        if (this.getNextFaction().getUnits().length > 0){
            TurnChangeScreen.Show(this.getNextFaction().name + "\'s Turn",()=>{
                this._turnNumber ++
                this._currentFactionId ++
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
        else{
            TimerSystem.instance.createTimer(2,()=>{GameOverScreen.Show(this._factions[this._currentFactionId].isLocal, this._turnNumber)})
        }
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

    static reset(){
        this.endAction()
        this._turnNumber = 0
        this._currentFactionId = 0
        this._factions[this._currentFactionId].getUnits().forEach(unit => {
            unit.resetTurn()
        });
        this._onTurnChangedListeners.forEach(listener => {
            listener.onTurnChanged(this._factions[this._currentFactionId]) 
        });
    }

    private constructor(){

    }
}

export namespace TurnManager{
    export interface IOnTurnChangeListener{
        onTurnChanged(faction: Faction)
    }
}