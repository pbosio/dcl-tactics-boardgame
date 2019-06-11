export class Tile extends Entity{
    private _transform: Transform
    private _indexX: number
    private _indexZ: number
    private onClickListeners: Tile.IOnClickListener[] = []

    get transform(): Transform {return this._transform}
    get indexX(){return this._indexX}
    get indexZ(){return this._indexZ}

    object: Tile.ITileableObject = null
    aStar: Tile.TileAStar
    distance: number
    aiWeight: number
    debugText: TextShape

    constructor(x:number, z:number, tileSize: number){
        super("tile"+x+"-"+z)
        this._indexX = x
        this._indexZ = z
        this._transform = new Transform()
        this._transform.scale = new Vector3(tileSize,tileSize,1)
        this._transform.rotation = Quaternion.Euler(90,0,0)
        this.addComponent(this._transform)
        this.addComponent(new PlaneShape())
        this.addComponent(new OnClick(()=>{
            this.selectTile()
        }))
        const dbgEnt = new Entity()
        dbgEnt.setParent(this)
        this.debugText = new TextShape("0")
        dbgEnt.addComponent(this.debugText)
    }

    addOnClickListener(listener: Tile.IOnClickListener){
        this.onClickListeners.push(listener)
    }

    setMaterial(material: Material){
        this.addComponentOrReplace(material)
    }

    getNeighbourList(walkableOnly: boolean=false): Tile[]{
        return this.aStar.getNeighbourList(walkableOnly)
    }

    selectTile(){
        this.onClickListeners.forEach(listener => {
            listener.onTileClicked(this)
        });
    }
}

export namespace Tile{
    export interface ITileableObject{
        tile: Tile
        getTransform(): Transform
        getEntity(): IEntity
    }

    export interface IOnClickListener{
        onTileClicked(tile: Tile)
    }

    export class TileAStar{
        tile: Tile
        parent: Tile
        neighbourList: Tile[]
        scoreG: number = 0
        scoreH: number = 0
        scoreF: number = 0
        tempScoreG: number = 0

		listState: TileAStar._AStarListState = TileAStar._AStarListState.Unassigned

        constructor(tile: Tile){
            this.tile = tile
        }
        
        getNeighbourList(walkableOnly: boolean=false): Tile[]{ 
			let newList: Tile[] = []
			if(walkableOnly){
				for(let i=0; i<this.neighbourList.length; i++){
					if(this.neighbourList[i].object==null) newList.push(this.neighbourList[i])
				}
			}
			else{
				for(let i=0; i<this.neighbourList.length; i++) newList.push(this.neighbourList[i])
			}
			return newList
        }
        
        processWalkableNeighbour(targetTile: Tile): void{
			for(let i=0; i<this.neighbourList.length; i++){
				let neighbour: Tile.TileAStar = this.neighbourList[i].aStar
				if((neighbour.tile.object==null) || neighbour.tile==targetTile){
					if(neighbour.listState==TileAStar._AStarListState.Unassigned){
                        neighbour.scoreG = this.scoreG
                        neighbour.scoreH = Vector3.DistanceSquared(neighbour.tile.transform.position, targetTile.transform.position)
                        neighbour.updateScoreF()
						neighbour.parent=this.tile
					}
					else if(neighbour.listState==TileAStar._AStarListState.Open){
                        this.tempScoreG = this.scoreG
                        if (neighbour.scoreG>this.tempScoreG){
							neighbour.parent=this.tile
                            neighbour.scoreG=this.tempScoreG
                            neighbour.updateScoreF()
						}
					}
				}
			}
        }
        
        processAllNeighbour(targetTile: Tile): void{
			for(let i=0; i<this.neighbourList.length; i++){
				let neighbour: Tile.TileAStar = this.neighbourList[i].aStar
                if(neighbour.listState==TileAStar._AStarListState.Unassigned){
                    neighbour.scoreG = this.scoreG
                    neighbour.scoreH = Vector3.DistanceSquared(neighbour.tile.transform.position, targetTile.transform.position)
                    neighbour.updateScoreF()
                    neighbour.parent=this.tile
                }
                else if(neighbour.listState==TileAStar._AStarListState.Open){
                    this.tempScoreG = this.scoreG
                    if (neighbour.scoreG>this.tempScoreG){
                        neighbour.parent=this.tile
                        neighbour.scoreG=this.tempScoreG
                        neighbour.updateScoreF()
                    }
                }
			}
        }

        updateScoreF(): void{ this.scoreF=this.scoreG+this.scoreH }
    }

    export namespace TileAStar{
        export enum _AStarListState{Unassigned, Open, Close}
    }
}