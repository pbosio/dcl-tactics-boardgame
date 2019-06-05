import { Tile } from "./tile";
import { Grid } from "./grid";
import { Unit } from "../unit/unit";

export class GridManager implements Tile.IOnClickListener{
    private grid: Grid
    private config: GridManager.Config
    private _onTileClickedListeners: Tile.IOnClickListener[] = []
    private _paintedTiles: Tile[] = []

    private static _instance: GridManager

    constructor(grid: Grid, config: GridManager.Config){
        GridManager._instance = this
        this.grid = grid
        this.config = config

        for (let i=0; i<grid.tileList.length; i++){
            let tile: Tile = grid.tileList[i]
            tile.setMaterial(this.config.tileMaterialDefault)
            tile.addOnClickListener(this)

            tile.aStar = new Tile.TileAStar(tile)
            
            let neighbourList:Tile[] = []

            let n: Tile = GridManager.getTileByIndex(tile.indexX, tile.indexZ+1)
            if (n) neighbourList.push(n)
            n = GridManager.getTileByIndex(tile.indexX, tile.indexZ-1)
            if (n) neighbourList.push(n)
            n = GridManager.getTileByIndex(tile.indexX+1, tile.indexZ)
            if (n) neighbourList.push(n)
            n = GridManager.getTileByIndex(tile.indexX-1, tile.indexZ)
            if (n) neighbourList.push(n)
            
            tile.aStar.neighbourList = neighbourList
        }
    }

    static getGrid(): Grid{
        if (this._instance)
            return this._instance.grid
        return null
    }

    onTileClicked(tile: Tile) {
        this._onTileClickedListeners.forEach(listener => {
            listener.onTileClicked(tile)
        });
    }

    static addOnTileListener(listener: Tile.IOnClickListener){
        if (this._instance)
            this._instance._onTileClickedListeners.push(listener)
    }

    static addToGrid(object: Tile.ITileableObject, targetTile: Tile){
        if (this._instance){
            GridManager.setInTile(object, targetTile)
            object.getEntity().setParent(this._instance.grid)
        }
    }

    static setInTile(object: Tile.ITileableObject, targetTile: Tile){
        targetTile.object = object
        object.tile = targetTile
        object.getTransform().position = targetTile.transform.position
    }

    static getTileByIndex(column: number, row: number): Tile{
        if (this._instance){
            let tileID: number = column * this._instance.grid.length + row

            if(tileID<0 || tileID>=this._instance.grid.tileList.length) return null

            return this._instance.grid.tileList[tileID]
        }
        return null
    }

    static getAndPaintTilesForMove(srcTile: Tile, dist: number): Tile[]{
        if (this._instance){
            let tiles = this.getTilesWithinDistance(srcTile, dist, true)
            tiles.forEach(tile => {
                tile.setMaterial(this._instance.config.tileMaterialWalkeable)
            });
            this._instance._paintedTiles = tiles
            return tiles
        }
        return null
    }

    static getAndPaintTilesForAttack(srcTile: Tile, dist: number): Tile[]{
        if (this._instance){
            let ret: Tile[] = []
            let tiles = this.getTilesWithinDistance(srcTile, dist, false)
            tiles.forEach(tile => {
                let containEnemy = tile.object && tile.object instanceof Unit && tile.object.factionData.faction != (srcTile.object as Unit).factionData.faction
                if (containEnemy){
                    ret.push(tile)
                    tile.setMaterial(this._instance.config.tileMaterialHostile)
                }
                else{
                    tile.setMaterial(this._instance.config.tileMaterialWalkeable)
                }
            });
            this._instance._paintedTiles = tiles
            return ret
        }
        return null
    }

    static clearPaintedTiles(){
        if (this._instance){
            this._instance._paintedTiles.forEach(tile => {
                tile.setMaterial(this._instance.config.tileMaterialDefault)
            });
        }
    }

    static getPath(originTile: Tile, destTile: Tile, onlyWalkeable: boolean = true): Tile[]{
        return GridAStar.searchWalkableTile(originTile, destTile, onlyWalkeable)
    }

    static getTilesWithinDistance(srcTile: Tile, dist: number, walkableOnly: boolean = false): Tile[]{
        let neighbourList: Tile[] = srcTile.getNeighbourList(walkableOnly)
			
        let closeList: Tile[]=[]
        let openList: Tile[]= []
        let newOpenList: Tile[]= []
        
        for(let m=0; m<neighbourList.length; m++){
            let neighbour: Tile=neighbourList[m]
            if (newOpenList.indexOf(neighbour) == -1) {
                let distance = 1
                neighbour.distance = distance

                if (distance <= dist){
                    newOpenList.push(neighbour)
                }
            }
        }

        for(let i=0; i<dist; i++){
            openList = newOpenList
            newOpenList =[]
            
            for(let n=0; n<openList.length; n++){
                neighbourList=openList[n].getNeighbourList(walkableOnly)
                for(let m=0; m<neighbourList.length; m++){
                    let neighbour: Tile = neighbourList[m]
                    if (closeList.indexOf(neighbour) == -1 && openList.indexOf(neighbour) == -1 && newOpenList.indexOf(neighbour) == -1){
                        let distance =  1
                        
                        if ((openList[n].distance + distance) <= dist) {
                            neighbour.distance = openList[n].distance + distance
                            newOpenList.push(neighbour)
                        }
                    }
                }
            }
            
            for(let n=0; n<openList.length; n++){
                let tile: Tile = openList[n]
                if(tile!=srcTile && closeList.indexOf(tile) == -1){
                    let rangeCost = GridAStar.getDistance(srcTile, tile, walkableOnly)
                    if (rangeCost != -1 && rangeCost <= dist)
                        closeList.push(tile)
                }
            }
        }
        
        return closeList
    }

}

export namespace GridManager{
    export class Config{
        tileMaterialDefault: Material
        tileMaterialWalkeable: Material
        tileMaterialHostile: Material
    }
}

class GridAStar{
    static getDistance(srcTile: Tile, targetTile: Tile, onlyWalkable: boolean = true): number{
        let closeList: Tile[] = []
        let openList: Tile[] = []
        
        let currentTile: Tile = srcTile
        
        let currentLowestF = Number.MAX_VALUE
        let id=0
        let i=0
        
        while(true){
            if(currentTile==targetTile) break
            
            closeList.push(currentTile)
            currentTile.aStar.listState=Tile.TileAStar._AStarListState.Close
            
            if (onlyWalkable){
                currentTile.aStar.processWalkableNeighbour(targetTile)
            }
            else{
                currentTile.aStar.processAllNeighbour(targetTile)
            }

            let neighbours = currentTile.aStar.getNeighbourList()
            for (let n =0; n<neighbours.length; n++){
                let neighbour = neighbours[n]
                if (onlyWalkable && neighbour.object != null && neighbour != targetTile) continue
                if (neighbour.aStar.listState == Tile.TileAStar._AStarListState.Unassigned) {
                    neighbour.aStar.listState = Tile.TileAStar._AStarListState.Open
                    openList.push(neighbour)
                }
            }

            
            currentTile=null;
            
            currentLowestF=Number.MAX_VALUE
            id=0
            for (i=0; i<openList.length; i++) {
                if (openList[i].aStar.scoreF<=currentLowestF){
                    currentLowestF=openList[i].aStar.scoreF
                    currentTile = openList[i]
                    id =i
                }
            }

            if (currentTile == null) {
                GridAStar.resetGraph(targetTile, openList, closeList)
                return -1
            }
            
            openList.splice(id,1);
        }
        
        
        let counter=0
        while(currentTile!=null){
            let nextTile = currentTile.aStar.parent
            if (nextTile != null) {
                counter += 1
            }
            currentTile=nextTile
        }

        GridAStar.resetGraph(targetTile, openList, closeList)
        return counter;
    }

    static resetGraph(hTile: Tile, oList: Tile[], cList: Tile[]){
        hTile.aStar.listState=Tile.TileAStar._AStarListState.Unassigned
        hTile.aStar.parent=null
        
        oList.forEach(tile => {
            tile.aStar.listState=Tile.TileAStar._AStarListState.Unassigned
            tile.aStar.parent=null
        });

        cList.forEach(tile => {
            tile.aStar.listState=Tile.TileAStar._AStarListState.Unassigned
            tile.aStar.parent=null
        });
    }

    static searchWalkableTile(originTile: Tile, destTile: Tile, onlyWalkeable: boolean = true): Tile[] {
        let closeList: Tile[] = []
        let openList: Tile[] = []
        
        let currentTile = originTile
        
        let currentLowestF = Number.MAX_VALUE
        let id=0
        let i=0
        
        while(true){
            if(currentTile==destTile) break
            closeList.push(currentTile)
            currentTile.aStar.listState = Tile.TileAStar._AStarListState.Close;
            
            if (onlyWalkeable){
                currentTile.aStar.processWalkableNeighbour(destTile)
            }
            else{
                currentTile.aStar.processAllNeighbour(destTile)
            }

            currentTile.aStar.getNeighbourList(onlyWalkeable).forEach(neighbour => {
                if(neighbour.aStar.listState==Tile.TileAStar._AStarListState.Unassigned || neighbour==destTile){
                    neighbour.aStar.listState=Tile.TileAStar._AStarListState.Open
                    openList.push(neighbour)
                }                
            });

            currentTile = null
            
            
            currentLowestF = Number.MAX_VALUE
            id=0;
            for(i=0; i<openList.length; i++){
                if(openList[i].aStar.scoreF<currentLowestF){
                    currentLowestF=openList[i].aStar.scoreF
                    currentTile=openList[i]
                    id=i
                }
            }
            
            if(currentTile==null) {
                break
            }

            openList.splice(id,1)
        }
        
        if(currentTile == null){
            let tileSize = GridManager.getGrid().tileSize + GridManager.getGrid().tileSpacing * 0.5
            currentLowestF =  Number.MAX_VALUE
            for(i=0; i<closeList.length; i++){
                let dist = Vector3.DistanceSquared(destTile.transform.position, closeList[i].transform.position)
                if(dist < currentLowestF){
                    currentLowestF = dist
                    currentTile = closeList[i]
                    if(dist < tileSize * 1.5) break
                }
            }
        }
        
        let path: Tile[] = []
        while(currentTile!=null){
            if(currentTile==originTile || currentTile==currentTile.aStar.parent) break
            path.push(currentTile)
            currentTile=currentTile.aStar.parent
        }
        
        path = GridAStar.invertTileArray(path)
        
        GridAStar.resetGraph(destTile, openList, closeList)
        
        return path;
    }

    static invertTileArray(p: Tile[]): Tile[]{
        let pInverted: Tile[] = []
        for(let i=0; i<p.length; i++){
            pInverted.push(p[p.length-(i+1)]);
        }
        return pInverted;
    }
}