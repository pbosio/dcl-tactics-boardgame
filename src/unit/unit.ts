import { Tile } from "../grid/tile";
import { Faction } from "./faction";
import { TurnManager } from "../game/turnManager";
import { FollowPathComponent, RotateTransformComponent } from "../modules/transfromSystem";
import { StateMachine } from "../modules/stateMachine";
import { AttackManager } from "../game/attackManager";
import { TimerSystem } from "../modules/timerSystem";
import { TextPopup } from "../game/textPopup";
import { HitParticle } from "./hitParticle";

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
    private _currentMoveRange: number

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
        this._currentMoveRange = properties.moveRange

        this._animator.addClip(new AnimationState(ANIM_IDLE,{looping: true}))
        this._animator.addClip(new AnimationState(ANIM_WALK,{looping: true}))
        this._animator.addClip(new AnimationState(ANIM_ATK))
        this._animator.addClip(new AnimationState(ANIM_HIT))
        this._animator.addClip(new AnimationState(ANIM_DEAD))

        this.playIdle()
    }

    reset(){
        if (this.tile) this.tile.object = null
        this.tile = null
        this._currentHP = this._properties.health
        this._currentMoveRange = this._properties.moveRange
        this.playIdle()
    }

    getTransform(): Transform {
        return this._transform
    }

    getGlobalPosition(): Vector3{
        return Unit.getEntityWorldPosition(this)
    }

    private static getEntityWorldPosition(entity: IEntity): Vector3{
        let entityPosition = entity.hasComponent(Transform)? entity.getComponent(Transform).position : Vector3.Zero()

        if (entity.getParent() != null){
            let parentEntity = entity.getParent()
            let parentRotation = parentEntity.hasComponent(Transform)? parentEntity.getComponent(Transform).rotation : Quaternion.Identity
            return this.getEntityWorldPosition(parentEntity).add(entityPosition.rotate(parentRotation))
        }
        return entityPosition
    }

    getEntity(): IEntity{
        return this
    }

    getMoveRange(): number{
        return this._currentMoveRange
    }

    getFullMoveRange(): number{
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
        return 3
    }

    getDamage(): number{
        return 1
    }

    getAtkIgnoresPath(): boolean{
        //No time to fix this so it well be always true
        //return this._properties.attackIgnorePath
        return true
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
        this._currentMoveRange = Scalar.Clamp(this._currentMoveRange - tilePath.length+1, 0, this.getFullMoveRange())

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
                Unit._listeners.forEach(listener => {
                    if (listener.onMoveEnd)listener.onMoveEnd(this, targetTile)
                });
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
        HitParticle.show(this)
        this._currentHP -= attackInstance.totalDamage
        if(this._currentHP <= 0){
            this.kill()
        }
        else{
            this.playHit()
        }
    }

    rest(){
        TurnManager.startAction()
        const addHP = this.getFullHP() * 0.1
        const prevHP = this.getHP()
        this._currentHP = Scalar.Clamp(this._currentHP + addHP, 0, this.getFullHP())
        Unit._listeners.forEach(listener => {
            if (listener.onRest)listener.onRest(this, this.getHP() - prevHP)
        });
        TurnManager.endTurn()
        log("unit rest end turn")
    }

    kill(){
        Unit._listeners.forEach(listener => {
            if (listener.onDead)listener.onDead(this)
        });

        this.tile.object = null
        this.tile = null
        this.factionData.faction.removeUnit(this)

        this.playDead()
        TimerSystem.instance.createTimer(ANIM_LENGTH,()=>{
            this.removeUnit()
        })
    }

    resetTurn(){
        this._currentMoveRange = this.getFullMoveRange()
    }

    private removeUnit(){
        //engine.removeSystem(this._stateMachine)
        //engine.removeEntity(this)        
        this._transform.position = new Vector3(2,-2,2)
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
        attackIgnorePath?: boolean = true //No time to fix this. So we will ignore it
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
        onMoveEnd?(unit: Unit, tile: Tile)
        onRest?(unit: Unit, hpRecovered: number)
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
            return !(this._time >= this._animDuration && this._projectile.hasFinished() && this._hasAttacked)
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
        TurnManager.endTurn()
        log("unit attacked end turn")
    }
}