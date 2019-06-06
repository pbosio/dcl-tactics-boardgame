import { Tile } from "../grid/tile";
import { Faction } from "./faction";
import { TurnManager } from "../game/turnManager";
import { FollowPathComponent, RotateTransformComponent } from "../modules/transfromSystem";
import { StateMachine } from "../modules/stateMachine";
import { AttackManager } from "../game/attackManager";
import { TimerSystem } from "../modules/timerSystem";

const ANIM_IDLE = "idle"
const ANIM_ATK = "attack"
const ANIM_HIT = "hit"
const ANIM_DEAD = "dead"
const ANIM_WALK = "walk"
const ANIM_LENGTH = 2

export class Unit extends Entity implements Tile.ITileableObject{

    private static _listeners: Unit.IUnitListener[] = []
    static addListener(listener: Unit.IUnitListener){
        this._listeners.push(listener)
    }

    private _transform: Transform
    private _animator: Animator

    private _properties: Unit.UnitProperties
    private _currentHP: number
    private _stateMachine: StateMachine

    private _attackStates: UnitATKBaseState[] = []

    tile: Tile;
    factionData: Unit.FactionData

    constructor(shape: Shape, properties: Unit.UnitProperties, scale?: Vector3){
        super()

        this._properties = properties

        this._transform = new Transform()
        this._animator = new Animator()

        this.addComponent(this._transform)
        this.addComponent(shape)
        this.addComponent(new OnClick(event=>{
            if (this.tile){
                this.tile.selectTile()
            }
        }))

        if (scale){
            this._transform.scale = scale
        }

        this._stateMachine = new StateMachine()
        engine.addSystem(this._stateMachine)

        this._attackStates.push(new StateStartAttack())
        this._attackStates.push(new StateRotateTowardsEnemy())
        this._attackStates.push(new StateAttackEnemy(properties.projectile))
        this._attackStates.push(new StateEndAttack())
        
        for (let i=0; i<this._attackStates.length-1;i++){
            this._attackStates[i].nextState = this._attackStates[i+1]
        }

        this._currentHP = properties.health

        this._animator.addClip(new AnimationState(ANIM_IDLE,{looping: true}))
        this._animator.addClip(new AnimationState(ANIM_WALK,{looping: true}))
        this._animator.addClip(new AnimationState(ANIM_ATK))
        this._animator.addClip(new AnimationState(ANIM_HIT))
        this._animator.addClip(new AnimationState(ANIM_DEAD))

        this.playIdle()
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

    playIdle(){
        this._animator.getClip(ANIM_IDLE).play()
    }

    playWalk(){
        this._animator.getClip(ANIM_WALK).play()
    }

    playAttack(){
        this._animator.getClip(ANIM_ATK).play()
        TimerSystem.instance.createTimer(ANIM_LENGTH,()=> this.playIdle()) 
    }

    playHit(){
        this._animator.getClip(ANIM_HIT).play()
        TimerSystem.instance.createTimer(ANIM_LENGTH,()=> this.playIdle()) 
    }

    playDead(){
        this._animator.getClip(ANIM_DEAD).play()
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

        this.playWalk()

        this._transform.lookAt(new Vector3(path[1].x, this._transform.position.y, path[1].z))

        this.tile.object = null
        this.tile = null
        this.addComponent(new FollowPathComponent(path,path.length/this.getMoveSpeed(), ()=>{
                let targetTile = tilePath[tilePath.length-1]
                targetTile.object = this
                this.tile = targetTile
                this.playIdle()
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
        this._currentHP -= attackInstance.totalDamage
        if(this._currentHP <= 0){
            this.kill()
        }
        else{
            this.playHit()
        }
    }

    kill(){
        Unit._listeners.forEach(listener => {
            if (listener.onDead)listener.onDead(this)
        });

        this.tile.object = null
        this.tile = null

        this.playDead()
        TimerSystem.instance.createTimer(ANIM_LENGTH,()=>{
            this.removeUnit()
        })
    }

    private removeUnit(){
        this.factionData.faction.removeUnit(this)
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
        projectile?: IProjectileBehavior
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
        let rot = Quaternion.LookRotation(this._targetUnit.getTransform().position.subtract(this._currentUnit.getTransform().position))
        this._currentUnit.addComponent(new RotateTransformComponent(this._currentUnit.getTransform().rotation, rot,
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
        this._currentUnit.playAttack()
    }

    onUpdate(dt: number): boolean{
        this._time += dt
        
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
            else if (!this._hasAttacked){
                this._hasAttacked = true
                this._targetUnit.hit(this._attkInstance)
            }
            return !(this._time >= this._animDuration && this._projectile.hasFinished())
        }
        else {
            if (this._time >= this._hitTime && !this._hasAttacked){
                this._hasAttacked = true
                this._targetUnit.hit(this._attkInstance)
            }
            return this._time < this._animDuration
        }
    }
}

class StateEndAttack extends UnitATKBaseState{
    onStart(){
        TurnManager.endAction()
    }
}