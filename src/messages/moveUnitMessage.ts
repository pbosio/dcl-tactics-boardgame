import { MessageManager } from "./messageManager";
import { Tile } from "../grid/tile";
import { GridManager } from "../grid/gridManager";
import { Unit } from "../unit/unit";

export class MoveUnitMessage implements MessageManager.IMessage{
    private _fromTile: Tile
    private _toTile: Tile

    constructor(fromTile: Tile, toTile: Tile){
        this._fromTile = fromTile
        this._toTile = toTile
    }

    execute() {
        if (this._fromTile.object && this._fromTile.object instanceof Unit){
            log("MoveUnitMessage from "+this._fromTile.name+" to "+this._toTile.name)
            let path = GridManager.getPath(this._fromTile, this._toTile)
            path.splice(0,0,this._fromTile)
            this._fromTile.object.move(path)
        }
    }
}