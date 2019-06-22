import { Unit } from "./unit";
import { Grid } from "../grid/grid";

export class ArrowProjectile implements Unit.IProjectileBehavior{
    private _entity: Entity
    private _entityTransform: Transform
    private _hasFinish: boolean = true
    private _tileSize: number

    private _initialPosition: Vector3
    private _distance: number
    private _xzDir: Vector3
    private _speed: number
    private _hOffset: number

    constructor(shape: Shape, scale: Vector3, grid: Grid){
        this._entity = new Entity()
        this._entityTransform = new Transform({scale:scale})
        this._entity.addComponent(shape)
        this._entity.addComponent(this._entityTransform)
        this._entity.setParent(grid)

        engine.addEntity(this._entity)

        this._tileSize = grid.tileSize
        this.hideProjectile()
    }

    private hideProjectile(){
        this._entityTransform.position.y = -1
    }

    onStart(attaker: Unit, target: Unit) {
        let speed = attaker.getAttakRange() * this._tileSize * 0.5

        let srcPosition = attaker.getTransform().position.add(Vector3.Up().scale(0.3))
        let tgtPosition = target.getTransform().position.add(Vector3.Up().scale(0.3))

        let offset = tgtPosition.subtract(srcPosition)
        let dir = offset.normalizeToNew()
        let dist = offset.length()

        this._distance = dist
        this._initialPosition = srcPosition
        this._xzDir = new Vector3(dir.x, 0 ,dir.z)
        this._speed = speed
        this._hOffset = 0

        this._hasFinish = false
    }    
    onUpdate(dt: number) {
        this._hOffset += this._speed * dt

        let prevPos = new Vector3(this._entityTransform.position.x, this._entityTransform.position.y, this._entityTransform.position.z)

        this._entityTransform.position.x = this._initialPosition.x + this._xzDir.x * this._hOffset
        this._entityTransform.position.z = this._initialPosition.z + this._xzDir.z * this._hOffset
        this._entityTransform.position.y = this._initialPosition.y + (-this._hOffset*this._hOffset + this._hOffset * this._distance)

        this._hasFinish = this._hOffset >= this._distance

        this._entityTransform.lookAt(this._entityTransform.position.scale(2).subtract(prevPos))
      
        if (this._hasFinish){
            this.hideProjectile()
        }
    }

    hasFinished(): boolean {
        return this._hasFinish
    }
    startDelay(): number {
        return 0.5
    }
}