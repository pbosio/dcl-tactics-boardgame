import { Tile } from "../grid/tile";
import { Faction } from "./faction";
import { TurnManager } from "../game/turnManager";
import { FollowPathComponent, RotateTransformComponent } from "../modules/transfromSystem";
import { BillBoardComponent } from "../modules/billboardComponent";
import { StateMachine } from "../modules/stateMachine";
import { AttackManager } from "../game/attackManager";

export class Unit extends Entity implements Tile.ITileableObject{

    private static _listeners: Unit.IUnitListener[] = []
    static addListener(listener: Unit.IUnitListener){
        this._listeners.push(listener)
    }

    private _transform: Transform
    private _properties: Unit.UnitProperties
    private _currentHP: number
    private _lifeBarSystem: LifeBar
    private _stateMachine: StateMachine

    private _attackStates: UnitATKBaseState[] = []

    tile: Tile;
    factionData: Unit.FactionData

    constructor(shape: Shape, properties: Unit.UnitProperties){
        super()

        this._transform = new Transform()
        this._properties = properties
        this.addComponent(this._transform)
        this.addComponent(shape)
        this.addComponent(new OnClick(event=>{
            if (this.tile){
                this.tile.selectTile()
            }
        }))

        this._lifeBarSystem = new LifeBar(this)
        engine.addSystem(this._lifeBarSystem)

        this._stateMachine = new StateMachine()
        engine.addSystem(this._stateMachine)

        this._attackStates.push(new StateStartAttack())
        this._attackStates.push(new StateRotateTowardsEnemy())
        this._attackStates.push(new StateAttackEnemy())
        this._attackStates.push(new StateEndAttack())
        
        for (let i=0; i<this._attackStates.length-1;i++){
            this._attackStates[i].nextState = this._attackStates[i+1]
        }
    }

    getTransform(): Transform {
        return this._transform
    }

    getGlobalPosition(): Vector3{
        return Unit.getEntityGlobalPosition(this)
    }

    private static getEntityGlobalPosition(entity: IEntity) : Vector3{
        if (entity.hasComponent(Transform)){
            if (entity.getParent() != null){
                let parent = entity.getParent()
                if (parent.hasComponent(Transform)){
                    return this.getEntityGlobalPosition(parent).add(entity.getComponent(Transform).position.rotate(parent.getComponent(Transform).rotation))
                }
            }
            return entity.getComponent(Transform).position
        }
        return Vector3.Zero()
    }

    getEntity(): IEntity{
        return this
    }

    getMoveRange(): number{
        return this._properties.moveRange
    }

    getAttakRange(): number{
        return this._properties.attackRange
    }

    getFullHP(): number{
        return this._properties.health
    }

    getHP(): number{
        return this._currentHP
    }

    getUnitType(): number{
        return this._properties.unitType
    }

    getMoveSpeed(): number{
        return 1
    }

    getDamage(): number{
        return 1
    }

    move(tilePath: Tile[]){
        Unit._listeners.forEach(listener => {
            if (listener.onMoveStart)listener.onMoveStart(this, tilePath[tilePath.length-1])
        });

        TurnManager.startAction()

        let path: Vector3[] = []
        for (let i=0; i<tilePath.length; i++){
            path.push(tilePath[i].transform.position)
        }

        this._transform.lookAt(new Vector3(this.tile.transform.position.x, this._transform.position.y, this.tile.transform.position.z))

        this.tile.object = null
        this.addComponent(new FollowPathComponent(path,path.length/this.getMoveSpeed(), ()=>{
                let targetTile = tilePath[tilePath.length-1]
                targetTile.object = this
                this.tile = targetTile
                TurnManager.endAction()
            },
            (currentPosition, nextPosition)=>{
                this._transform.lookAt(new Vector3(nextPosition.x, this._transform.position.y, nextPosition.z))
            }))
    }

    attack(attackInstance: AttackManager.AttackInstance){
        Unit._listeners.forEach(listener => {
            if (listener.onAttackStart)listener.onAttackStart(attackInstance)
        });

        this._attackStates.forEach(state => {
            state.setAttackInstance(attackInstance)
        });
        this._stateMachine.setState(this._attackStates[0])
    }

    hit(attackInstance: AttackManager.AttackInstance){
        Unit._listeners.forEach(listener => {
            if (listener.onHit)listener.onHit(attackInstance)
        });
    }

    kill(){
        Unit._listeners.forEach(listener => {
            if (listener.onDead)listener.onDead(this)
        });

        this.factionData.faction.removeUnit(this)
        engine.removeSystem(this._lifeBarSystem)
        engine.removeSystem(this._stateMachine)
        engine.removeEntity(this)
    }
}

export namespace Unit{
    export class FactionData{
        uid: number
        faction: Faction
    }

    export class UnitProperties{
        moveRange: number
        attackRange: number
        health: number
        unitType: number
    }

    export interface IProjectileBehavior{
        onStart(attaker: Unit, target: Unit)
        onUpdate(dt: number)
        hasFinished(): boolean
        startDelay(): number
    }

    export interface IUnitListener{
        onAttackStart?(attackInstance: AttackManager.AttackInstance)
        onHit?(attackInstance: AttackManager.AttackInstance)
        onDead?(unit: Unit)
        onMoveStart?(unit: Unit, tile: Tile)
    }
}

class LifeBar implements ISystem{
    private _unit: Unit

    private _barRoot: Entity
    private _barBg: Entity

    constructor(unit: Unit){
        this._unit = unit

        this._barRoot = new Entity()
        this._barRoot.setParent(unit)
        this._barRoot.addComponent(new BillBoardComponent())
        this._barRoot.addComponent(new Transform())

        const bgMaterial = new Material()
        bgMaterial.disableLighting = true
        bgMaterial.albedoColor = Color3.Black()

        this._barBg = new Entity()
        this._barBg.setParent(this._barRoot)
        this._barBg.addComponent(bgMaterial)
        this._barBg.addComponent(new PlaneShape())
        this._barBg.addComponent(new Transform({position:new Vector3(0,0,-1), scale: new Vector3(1.5,0.2,1.5)}))
    }

    update(){
        //TODO: update lifebar
    }

    deactivate(){
        //TODO: remove lifebar?
    }
}

class UnitATKBaseState implements StateMachine.State{
    nextState: StateMachine.State;    

    protected _currentUnit: Unit
    protected _targetUnit: Unit
    protected _attkInstance: AttackManager.AttackInstance = null

    setAttackInstance(attkInstance: AttackManager.AttackInstance){
        this._attkInstance = attkInstance
        this._targetUnit = attkInstance.target
        this._currentUnit = attkInstance.attacker
    }

    onStart(): void {
    }
    onUpdate(dt: number): boolean {
        return false
    }
    onEnd(): void {
    }
    onKill(): void {
    }
    onHandleEvent(event: StateMachine.IStateEvent): void {
    }
}

class StateStartAttack extends UnitATKBaseState{
    onStart(){
        TurnManager.startAction()
    }
}

class StateRotateTowardsEnemy extends UnitATKBaseState{
    private readonly _rotationSpd = 1
    private _stateRunning = false

    onStart(){
        this._stateRunning = true
        this._currentUnit.addComponent(new RotateTransformComponent(this._currentUnit.getTransform().rotation, this._targetUnit.getTransform().rotation,
            this._rotationSpd, ()=>this._stateRunning = false))
    }

    onUpdate(): boolean{
        return this._stateRunning
    }
}

class StateAttackEnemy extends UnitATKBaseState{
    private readonly _animDuration = 1
    private readonly _hitTime = 0.5

    private _projectile: Unit.IProjectileBehavior = null
    private _time: number

    private _hasAttacked: boolean
    private _projectileStarted: boolean

    constructor(projectile?: Unit.IProjectileBehavior){
        super()
        this._projectile = projectile
    }

    onStart(){
        this._time = 0
        this._hasAttacked = false
        this._projectileStarted = false
        //TODO: start animation
    }

    onUpdate(dt: number): boolean{
        this._time += dt

        if (this._time >= this._hitTime && !this._hasAttacked){
            this._hasAttacked = true
            this._targetUnit.hit(this._attkInstance)
        }
        if (this._projectile){
            if (!this._projectileStarted){
                if (this._time >= this._projectile.startDelay()){
                    this._projectileStarted = true
                    this._projectile.onStart(this._currentUnit, this._targetUnit)
                }
            }
            else if (!this._projectile.hasFinished()){
                this._projectile.onUpdate(dt)
            }
            return !(this._time >= this._animDuration && this._projectile.hasFinished())
        }
        else return this._time < this._animDuration
    }
}

class StateEndAttack extends UnitATKBaseState{
    onStart(){
        TurnManager.endAction()
    }
}