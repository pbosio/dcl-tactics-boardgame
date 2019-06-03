import { Tile } from "./tile";

export class Grid extends Entity{
    private _width: number
    private _length: number
    private _tileSize: number
    private _tileSpacing: number
    private _transform: Transform

    tileList: Tile[] = []

    get transform(){return this._transform}
    get width(){return this._width}
    get length(){return this._length}
    get tileSize(){return this._tileSize}
    get tileSpacing(){return this._tileSpacing}

    constructor(width: number, length: number, tileSize: number, tileSpacing: number){
        super("grid")
        this._transform = new Transform()
        this.addComponent(this._transform)
        this.createGrid(width, length, tileSize, tileSpacing)
    }

    private createGrid(width: number, length: number, tileSize: number, tileSpacing: number){
        this._width = width
        this._length = length
        this._tileSize = tileSize
        this._tileSpacing = tileSpacing

        for (let i=0; i<width; i++){
            for (let j=0; j<length; j++){
                let tile: Tile = new Tile(i,j,tileSize)
                tile.transform.position = new Vector3(i*(tileSize+tileSpacing),0,j*(tileSize+tileSpacing))
                tile.setParent(this)
                this.tileList.push(tile)
            }
        }

    }

}