import { Unit } from "../unit/unit";
import { AttackManager } from "./attackManager";
import { StateMachine } from "../modules/stateMachine";
import { MoveTransformComponent, TransformSystem, ScaleTransformComponent } from "../modules/transfromSystem";
import { BillBoardComponent, billboardTransform } from "../modules/billboardComponent";

const textOffsetY = 0.4

export class TextPopup implements Unit.IUnitListener{

    private _availableTexts: PopupableText[] = []
    private _stateMachine: StateMachine
    private _lastState: StatePopupText

    private readonly _numbersMultiplier = 10

    constructor(){
        this._stateMachine = new StateMachine()
        engine.addSystem(this._stateMachine)
    }

    onHit(attackInstance: AttackManager.AttackInstance){
        const dmgColor = Color3.Red()

        if (attackInstance.bonusDamage > 0.5) this.showText("Super-Effective!",attackInstance.target.getGlobalPosition().add(Vector3.Up().scale(textOffsetY)),dmgColor)       
        else if (attackInstance.bonusDamage > 0.2) this.showText("Effective!",attackInstance.target.getGlobalPosition().add(Vector3.Up().scale(textOffsetY)),dmgColor)       
        else if (attackInstance.bonusDamage < -0.5) this.showText("Super-Weak!",attackInstance.target.getGlobalPosition().add(Vector3.Up().scale(textOffsetY)),dmgColor)
        else if (attackInstance.bonusDamage < -0.2) this.showText("Weak!",attackInstance.target.getGlobalPosition().add(Vector3.Up().scale(textOffsetY)),dmgColor)

        this.showText((attackInstance.totalDamage * this._numbersMultiplier).toFixed(0) +" DMG",
            attackInstance.target.getGlobalPosition().add(Vector3.Up().scale(textOffsetY)),dmgColor)
    }

    onRest(unit: Unit, hpRecovered: number){
        if ((hpRecovered * this._numbersMultiplier) >= 1){
            this.showText("REST: +" + (hpRecovered * this._numbersMultiplier).toFixed(0) + " HP",
                unit.getGlobalPosition().add(Vector3.Up().scale(textOffsetY)),Color3.Green())
        }
    }

    showText(value: string, position: Vector3, color: Color3 = Color3.White()){
        let text = this._availableTexts.pop()
        if (text == null){
            text = new PopupableText()
            text.addComponent(new BillBoardComponent())
        }
        
        text.shape.value = value
        text.shape.color = color

        text.transform.position = position
        billboardTransform(text.transform)

        let showTextState = new StatePopupText(text, (txtData)=> this.onTextPopupFinished(txtData))

        if (this._stateMachine.state){
            let waitState = new StateWait(1, this._lastState)
            waitState.nextState = showTextState
            this._lastState.nextState = waitState
        }
        else{
            this._stateMachine.setState(showTextState)
        }
        this._lastState = showTextState
    }

    private onTextPopupFinished(text: PopupableText){
        engine.removeEntity(text)
        this._availableTexts.push(text)
    }
}

class PopupableText extends Entity{
    shape: TextShape
    transform: Transform

    constructor(){
        super()
        this.transform = new Transform()
        this.shape = new TextShape()
        this.shape.fontSize = 2
        this.addComponent(this.shape)
        this.addComponent(this.transform)
    }
}

class StatePopupText extends StateMachine.State{
    private _time: number
    private _stateRunning: boolean = false
    private _text: PopupableText
    private _onFinishCallback: (TextData)=> void

    get time(): number {return this._time}

    constructor(textData: PopupableText, onFinishCallback: (TextData)=> void){
        super()
        this._text = textData
        this._time = 0
        this._onFinishCallback = onFinishCallback
    }

    onStart(){
        const time = 1
        engine.addEntity(this._text)

        this._text.addComponentOrReplace(new MoveTransformComponent(this._text.transform.position, 
            this._text.transform.position.add(new Vector3(0,0.3,0)), time,()=>{
                this._stateRunning = false
                this._onFinishCallback(this._text)
            },TransformSystem.Interpolation.EASEOUTQUAD))
        
        this._text.addComponentOrReplace(new ScaleTransformComponent(new Vector3(0.1,0.1,0.1),Vector3.One(),time*0.5, null, TransformSystem.Interpolation.EASEQUAD))
    }

    onUpdate(dt: number): boolean{
        this._time += dt
        return this._stateRunning
    }
}

class StateWait extends StateMachine.State{
    private _waitTime: number
    private _time: number
    private _prevState: StatePopupText

    constructor(waitTime:number, prevState: StatePopupText){
        super()
        this._prevState = prevState
        this._time = 0
        this._waitTime = waitTime
    }

    onStart(){
        this._waitTime = Scalar.Clamp(this._waitTime - this._prevState.time, 0, Number.MAX_VALUE)
    }

    onUpdate(dt: number): boolean{
        this._time += dt
        return this._time < this._waitTime
    }
}