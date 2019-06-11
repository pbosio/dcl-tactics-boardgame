import { Faction } from "../unit/faction";
import { GridManager } from "../grid/gridManager";
import { Tile } from "../grid/tile";
import { Unit } from "../unit/unit";
import { AttackManager } from "./attackManager";
import { TurnManager } from "./turnManager";
import { MessageManager } from "../messages/messageManager";
import { MoveUnitMessage } from "../messages/moveUnitMessage";
import { AttackMessage } from "../messages/attackMessage";
import { RestMessage } from "../messages/restMessage";

export class AIController implements TurnManager.IOnTurnChangeListener, Unit.IUnitListener{
 
    private _aiFaction: Faction
    private _playerFaction: Faction
    private _actionsList: AIAction[]
    private _currentActionIndex: number

    constructor(AIFaction: Faction, playerFaction: Faction){
        this._aiFaction = AIFaction
        this._playerFaction = playerFaction
    }

    onTurnChanged(faction: Faction) {
        this._actionsList = null

        if (faction == this._aiFaction){
            this.resetWeights()
            this.weightPlayerAtkTile()
            this._actionsList = this.sortActions(this.weightAIMove())
            this._currentActionIndex = 0
            this.performAction()
        }
    }

    onMoveEnd(unit: Unit, tile: Tile){
        if(this._actionsList && this._actionsList[this._currentActionIndex].unit == unit){
            if (this._actionsList[this._currentActionIndex].atkUnit){
                let action = this._actionsList[this._currentActionIndex]
                MessageManager.send(new AttackMessage(action.unit, AttackManager.getAttackInstance(action.unit, action.atkUnit)))
            }
            else{
                this.startNextAction()
            }
        }
    }

    private performAction(){
        let action = this._actionsList[this._currentActionIndex]
        log("AI PERFORM "+action.toString())
        if (action.moveToTile){
            if (action.moveToTile.object != null){
                this._actionsList[this._currentActionIndex] = this.weightAIUnitMove(action.unit)
                this.performAction()
            }
            else MessageManager.send(new MoveUnitMessage(action.unit.tile, action.moveToTile))
        }
        else if (action.atkUnit){
            if (action.atkUnit.tile == null){
                this._actionsList[this._currentActionIndex] = this.weightAIUnitMove(action.unit)
                this.performAction()
            }
            else MessageManager.send(new AttackMessage(action.unit, AttackManager.getAttackInstance(action.unit, action.atkUnit)))
        }
        else this.startNextAction()
    }

    private startNextAction(){
        this._currentActionIndex ++
        if (this._currentActionIndex >= this._actionsList.length){
            let lessHPUnit: Unit = null
            this._aiFaction.getUnits().forEach(unit => {
                if (lessHPUnit == null || lessHPUnit.getHP() < unit.getHP()){
                    lessHPUnit = unit
                } 
            });
            log("AI REST "+lessHPUnit)
            MessageManager.send(new RestMessage(lessHPUnit))
        }
        else{
            this.performAction()
        } 
    }

    private resetWeights(){
        GridManager.getGrid().tileList.forEach(tile => {
            tile.aiWeight = 0
            tile.debugText.value = "0"
        });
    }

    private weightPlayerAtkTile(){
        this._playerFaction.getUnits().forEach(unit => {
            GridManager.getTilesWithinDistance(unit.tile, unit.getFullMoveRange(), true).forEach(moveTile => {
                this.weightPlayerUnitAtkTile(moveTile, unit)
            });
        });
    }

    private weightPlayerUnitAtkTile(fromTile: Tile, unit: Unit){
        GridManager.getTilesWithinDistance(fromTile, unit.getAttakRange(), false).forEach(tile => {
            tile.aiWeight -= 1
            tile.debugText.value = tile.aiWeight.toString()
        });
    }

    private weightAIMove(): AIAction[]{
        let ret: AIAction[] = []
        this._aiFaction.getUnits().forEach(unit => {
            ret.push(this.weightAIUnitMove(unit))
        });
        return ret
    }

    private weightAIUnitMove(unit: Unit): AIAction{
        let unitActions: AIAction[] = []
        let reacheableTiles = GridManager.getTilesWithinDistance(unit.tile, unit.getMoveRange(), true)
        reacheableTiles.push(unit.tile) 
        reacheableTiles.forEach(moveTile => {
            unitActions.push(new AIAction(unit, moveTile, this._playerFaction))
        });
        let sortedActions = unitActions.sort((a,b)=>b.weight - a.weight)
        sortedActions.forEach(element => {
            log("ACTIONS "+element.toString())
        });
        let sameValueLastIndex = 0
        for (let i=1; i<sortedActions.length; i++){
            if (sortedActions[i].weight < sortedActions[0].weight) break
            sameValueLastIndex = i
        }
        return sortedActions[Math.floor(Math.random() * sameValueLastIndex)]
    }

    private sortActions(unsortedActions: AIAction[]): AIAction[]{
        return unsortedActions.sort((a,b)=> {
            if (a.actionFinishesTurn() && b.actionFinishesTurn()){
                return b.weight - a.weight
            }
            else if (a.actionFinishesTurn()){
                return 1
            }
        })
    }
}

class AIAction{
    unit: Unit
    moveToTile: Tile
    atkUnit: Unit
    weight: number

    constructor(unit: Unit, fromTile: Tile, enemyFaction: Faction){
        this.unit = unit
        this.moveToTile = unit.tile != fromTile? fromTile : null
        this.weight = fromTile.aiWeight

        let maxWeight = Number.NEGATIVE_INFINITY
        let heaviestAtk: Unit = null
        GridManager.getTilesWithinDistance(fromTile, unit.getAttakRange(), false).forEach(tile => {
            let tempWeight = this.weight

            if (tile.object != null){
                let targetUnit = tile.object as Unit
                if (targetUnit && targetUnit.factionData && targetUnit.factionData.faction != unit.factionData.faction){
                    tempWeight += 2
                    let predictedAtk = AttackManager.getAttackInstance(unit, targetUnit)
                    if (predictedAtk.bonusDamage > 0) tempWeight += 2

                    if (predictedAtk.isTargetDead) tempWeight += 5
                    else if (targetUnit.getHP() - predictedAtk.totalDamage < 0.2) tempWeight += 3

                    if (tempWeight > maxWeight){
                        maxWeight = tempWeight
                        heaviestAtk = targetUnit
                    }
                }
            }
            if (tempWeight > maxWeight){
                maxWeight = tempWeight
                heaviestAtk = null
            }
        });

        this.weight = maxWeight
        this.atkUnit = heaviestAtk
    }

    actionFinishesTurn(): boolean{
        return this.atkUnit != null
    }

    toString(){
        let move = this.moveToTile? this.moveToTile.name : "none"
        let atk = this.atkUnit? this.atkUnit.tile.name : "none"
        return "Unit "+ this.unit.factionData.uid +" weight " + this.weight + " move to tile "+ move + " and attack " + atk
    }
}