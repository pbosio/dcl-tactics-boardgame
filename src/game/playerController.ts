import { TurnManager } from "./turnManager";
import { Tile } from "../grid/tile";
import { Faction } from "../unit/faction";
import { Unit } from "../unit/unit";
import { GridManager } from "../grid/gridManager";
import { MessageManager } from "../messages/messageManager";
import { MoveUnitMessage } from "../messages/moveUnitMessage";
import { BillBoardComponent } from "../modules/billboardComponent";
import { AttackMessage } from "../messages/attackMessage";
import { AttackManager } from "./attackManager";
import { RestMessage } from "../messages/restMessage";
import { HintUI } from "../screens/hintUI";

export class PlayerController implements TurnManager.IOnTurnChangeListener, Tile.IOnClickListener{
    private _playerFaction: Faction

    private _currentBehavior: IPlayerBehavior

    private _selectingUnitBehavior: SelectingUnit
    private _noBehavior: NoneBehavior
    private _moveBehavior: MoveUnitBehavior
    private _attackBehavior: AttackUnitBehavior

    private _actionsDisplayer: Entity

    private _selectedUnit: Unit

    constructor(playerFaction: Faction){
        this._playerFaction = playerFaction

        this._selectingUnitBehavior = new SelectingUnit(playerFaction, (unit)=>this.onUnitSelected(unit))
        this._noBehavior = new NoneBehavior()
        this._moveBehavior = new MoveUnitBehavior((unit,tile)=>this.onMoveUnit(unit, tile), ()=>this.onCancelAction())
        this._attackBehavior = new AttackUnitBehavior((unit,tile)=>this.onAttack(unit, tile), ()=>this.onCancelAction())

        this._currentBehavior = this._selectingUnitBehavior

        const actionMoveMat = new BasicMaterial()
        actionMoveMat.texture = new Texture("images/actions/move.png")
        const actionRestMat = new BasicMaterial()
        actionRestMat.texture = new Texture("images/actions/rest.png")
        const actionAttackMat = new BasicMaterial()
        actionAttackMat.texture = new Texture("images/actions/attack.png")

        const actionDisplayerY = 0.4

        this._actionsDisplayer = new Entity()
        this._actionsDisplayer.addComponent(new BillBoardComponent())
        this._actionsDisplayer.addComponent(new Transform())
        //this._actionsDisplayer.setParent(GridManager.getGrid())

        const actionAttack = new Entity("attackButton")
        actionAttack.setParent(this._actionsDisplayer)
        actionAttack.addComponent(new PlaneShape())
        actionAttack.addComponent(new Transform({position: new Vector3(-0.2,actionDisplayerY,0), scale: new Vector3(0.2,0.2,0.2)}))
        actionAttack.addComponent(actionAttackMat)
        actionAttack.addComponent(new OnClick(event=>{
            this.hideActions()
            this._attackBehavior.start(this._selectedUnit)
            this._currentBehavior = this._attackBehavior
        }))

        const actionMove = new Entity("moveButton")
        actionMove.setParent(this._actionsDisplayer)
        actionMove.addComponent(new PlaneShape())
        actionMove.addComponent(new Transform({position: new Vector3(0,actionDisplayerY,0), scale: new Vector3(0.2,0.2,0.2)}))
        actionMove.addComponent(actionMoveMat)
        actionMove.addComponent(new OnClick(event=>{
            this.hideActions()
            this._moveBehavior.start(this._selectedUnit)
            this._currentBehavior = this._moveBehavior
        }))

        const actionRest = new Entity("restButton")
        actionRest.setParent(this._actionsDisplayer)
        actionRest.addComponent(new PlaneShape())
        actionRest.addComponent(new Transform({position: new Vector3(0.2,actionDisplayerY,0), scale: new Vector3(0.2,0.2,0.2)}))
        actionRest.addComponent(actionRestMat)
        actionRest.addComponent(new OnClick(event=>{
            this.hideActions()
            this._currentBehavior = this._noBehavior
            MessageManager.send(new RestMessage(this._selectedUnit))
        }))

        engine.addEntity(this._actionsDisplayer)

        GridManager.addOnTileListener(this)

        this.hideActions()
        HintUI.ShowHint("Select a UNIT")
    }

    onTileClicked(tile: Tile) {
        this._currentBehavior.onTileClicked(tile)
    }

    onTurnChanged(faction: Faction) {
        if (faction == this._playerFaction){
            this._currentBehavior = this._selectingUnitBehavior
            HintUI.ShowHint("Select a UNIT")
        }
        else{
            this._currentBehavior = this._noBehavior
        }
    }

    private showActions(position: Vector3){
        log("showActions")
        HintUI.ShowHint("Choose an action. Rest or Attack finish your turn")
        /*if (!this._actionsDisplayer.isAddedToEngine()){
            log("showActions engine.addEntity")
            engine.addEntity(this._actionsDisplayer)
        }*/
        this._actionsDisplayer.getComponent(Transform).position = position
    }

    private hideActions(){
        log("hideActions")
        HintUI.ShowHint("")
        /*if (this._actionsDisplayer.isAddedToEngine()){
            log("hideActions engine.removeEntity")
            engine.removeEntity(this._actionsDisplayer)
        }*/
        this._actionsDisplayer.getComponent(Transform).position.y = -1
    }

    private onUnitSelected(unit: Unit){
        log("onUnitSelected " + unit)
        this._selectedUnit = unit
        if (unit){
            this.showActions(unit.getGlobalPosition())
        }
        else{
            this.hideActions()
            HintUI.ShowHint("Select a UNIT")
        }
    }

    private onMoveUnit(unit: Unit, tile: Tile){
        GridManager.clearPaintedTiles()
        this._currentBehavior = this._selectingUnitBehavior
        MessageManager.send(new MoveUnitMessage(unit.tile, tile))
    }

    private onAttack(srcUnit: Unit, atkTile: Tile){
        GridManager.clearPaintedTiles()
        this._currentBehavior = this._noBehavior
        MessageManager.send(new AttackMessage(srcUnit, AttackManager.getAttackInstance(srcUnit, atkTile.object as Unit)))
    }

    private onCancelAction(){
        log("onCancelAction")
        if (this._selectedUnit){
            this.showActions(this._selectedUnit.getGlobalPosition())
        }
        else{
            HintUI.ShowHint("Select a UNIT")
        }
        this._currentBehavior = this._selectingUnitBehavior
        GridManager.clearPaintedTiles()
    }
}

interface IPlayerBehavior{
    onTileClicked(tile: Tile)
}

class NoneBehavior implements IPlayerBehavior{
    onTileClicked(tile: Tile) {
        log("NoneBehavior onTileClicked")
    }
}

class SelectingUnit implements IPlayerBehavior{
    private _playerFaction: Faction
    private _onUnitSelected: (Unit)=>void

    constructor(playerFaction: Faction, onUnitSelected: (Unit)=>void){
        this._playerFaction = playerFaction
        this._onUnitSelected = onUnitSelected
    }

    onTileClicked(tile: Tile) {
        log("SelectingUnit onTileClicked " + TurnManager.canPerfromAction() + " " + tile.object != null)
        if (TurnManager.canPerfromAction() && tile.object != null){
            if (tile.object instanceof Unit){
                if (tile.object.factionData.faction == this._playerFaction){
                    this._onUnitSelected(tile.object)
                    return
                }
            }
        }
        this._onUnitSelected(null)
    }
}

class MoveUnitBehavior implements IPlayerBehavior{
    private _tiles: Tile[]
    private _selectedUnit: Unit
    private _onMoveCallback: (Unit, Tile)=>void
    private _onCancelAction: ()=>void

    constructor(onMoveCallback: (Unit, Tile)=>void, onCancelAction: ()=>void){
        this._onCancelAction = onCancelAction
        this._onMoveCallback = onMoveCallback
    }

    start(selectedUnit: Unit){
        this._tiles = GridManager.getAndPaintTilesForMove(selectedUnit.tile, selectedUnit.getMoveRange())
        this._selectedUnit = selectedUnit
        HintUI.ShowHint("Select a TILE to move to it")
    }

    onTileClicked(tile: Tile) {
        log("MoveUnitBehavior onTileClicked " + TurnManager.canPerfromAction() + " " + (this._tiles.indexOf(tile) != -1))
        if (TurnManager.canPerfromAction() && this._tiles.indexOf(tile) != -1){
            this._onMoveCallback(this._selectedUnit, tile)
        }
        else{
            this._onCancelAction()
        }
    }
}

class AttackUnitBehavior implements IPlayerBehavior{
    private _tiles: Tile[]
    private _selectedUnit: Unit
    private _onAttackCallback: (Unit, Tile)=>void
    private _onCancelAction: ()=>void

    constructor(onAttackCallback: (Unit, Tile)=>void, onCancelAction: ()=>void){
        this._onCancelAction = onCancelAction
        this._onAttackCallback = onAttackCallback
    }

    start(selectedUnit: Unit){
        this._tiles = GridManager.getAndPaintTilesForAttack(selectedUnit.tile, selectedUnit.getAttakRange())
        this._selectedUnit = selectedUnit
        HintUI.ShowHint("Select an ENEMY within range to attack")
    }

    onTileClicked(tile: Tile) {
        log("AttackUnitBehavior onTileClicked " + TurnManager.canPerfromAction() + " " + (this._tiles.indexOf(tile) != -1))
        if (TurnManager.canPerfromAction() && this._tiles.indexOf(tile) != -1){
            this._onAttackCallback(this._selectedUnit, tile)
        }
        else{
            this._onCancelAction()
        }
    }
}