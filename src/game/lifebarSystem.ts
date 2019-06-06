import { Unit } from "../unit/unit";
import { Faction } from "../unit/faction";
import { BillBoardComponent } from "../modules/billboardComponent";
import { AttackManager } from "./attackManager";

export class LifeBarSystem implements ISystem, Unit.IUnitListener{

    private _lifeBars: LifeBar[] = []

    constructor(){
        let units = Faction.getAllUnits()
        units.forEach(unit => {
            this._lifeBars.push(new LifeBar(unit))
        });
    }

    update(){
        this._lifeBars.forEach(lifebar => {
            lifebar.update()
        });
    }

    onDead(unit: Unit){
        for(let i=0; i<this._lifeBars.length; i++){
            if (this._lifeBars[i].isOwner(unit)){
                this._lifeBars[i].remove()
                this._lifeBars.splice(i,1)
                break
            }
        }
    }

    onHit(attackInstance: AttackManager.AttackInstance){
        for(let i=0; i<this._lifeBars.length; i++){
            if (this._lifeBars[i].isOwner(attackInstance.target)){
                this._lifeBars[i].setLifeRatio((attackInstance.target.getHP() - attackInstance.totalDamage)/attackInstance.target.getFullHP())
                break
            }
        }       
    }

}

class LifeBar{
    private _owner: Unit
    private _barRootEntity: Entity
    private _barRootT: Transform
    private _barFillT: Transform

    private _barInitialSizeX: number
    private _barInitialX: number

    private static _barBgMaterial: BasicMaterial = null
    private static _barFillMaterial: BasicMaterial = null

    constructor(owner: Unit){
        this._owner = owner

        const lifebarSize = new Vector3(0.2,0.05,0.2)
        const lifebarOffset = new Vector3(0,0,-0.2)

        if (LifeBar._barBgMaterial == null){
            LifeBar._barBgMaterial = new BasicMaterial()
            LifeBar._barBgMaterial.texture =  new Texture("images/lifebarBg.jpg")
        }
        if (LifeBar._barFillMaterial == null){
            LifeBar._barFillMaterial = new BasicMaterial()
            LifeBar._barFillMaterial.texture =  new Texture("images/lifebarFill.jpg")
        }

        this._barRootEntity = new Entity()
        this._barRootT = new Transform()
        this._barRootEntity.addComponent(this._barRootT)
        this._barRootEntity.addComponent(new BillBoardComponent())
        engine.addEntity(this._barRootEntity)

        let barBgEntity = new Entity()
        barBgEntity.addComponent(LifeBar._barBgMaterial)
        barBgEntity.addComponent(new Transform({position: lifebarOffset, scale: lifebarSize}))
        barBgEntity.addComponent(new PlaneShape())
        barBgEntity.setParent(this._barRootEntity)

        this._barFillT = new Transform({position: lifebarOffset.add(new Vector3(0,0,-0.001)), scale: lifebarSize.subtract(new Vector3(0.01,0.01,0.01))})
        let barFillEntity = new Entity()
        barFillEntity.addComponent(LifeBar._barFillMaterial)
        barFillEntity.addComponent(this._barFillT)
        barFillEntity.addComponent(new PlaneShape())
        barFillEntity.setParent(this._barRootEntity)

        this._barInitialSizeX = this._barFillT.scale.x
        this._barInitialX = this._barFillT.position.x
    }

    isOwner(unit: Unit){
        return this._owner == unit
    }

    setLifeRatio(ratio: number){
        ratio = Scalar.Clamp(ratio,0,1)
        this._barFillT.scale = new Vector3(this._barInitialSizeX * ratio, this._barFillT.scale.y, this._barFillT.scale.z)
        let newPos = this._barFillT.position
        newPos.x = this._barInitialX - (this._barInitialSizeX - this._barInitialSizeX * ratio) * 0.5
        this._barFillT.position = newPos
    }

    update(){
        this._barRootT.position = this._owner.getGlobalPosition()
    }

    remove(){
        engine.removeEntity(this._barRootEntity)
    }
}
