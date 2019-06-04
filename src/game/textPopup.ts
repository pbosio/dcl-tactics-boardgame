import { Unit } from "../unit/unit";
import { AttackManager } from "./attackManager";
import { StateMachine } from "../modules/stateMachine";
import { MoveTransformComponent, TransformSystem } from "../modules/transfromSystem";
import { BillBoardComponent } from "../modules/billboardComponent";

export class TextPopup implements Unit.IUnitListener{

    private _availableTexts: PopupableText[] = []
    private _stateMachine: StateMachine
    private _lastState: StatePopupText

    constructor(){
        this._stateMachine = new StateMachine()
        engine.addSystem(this._stateMachine)
    }

    onHit(attackInstance: AttackManager.AttackInstance){
        if (attackInstance.bonusDamage > 0.5) this.showText("Super-Effective!",attackInstance.target.getGlobalPosition())       
        else if (attackInstance.bonusDamage > 0) this.showText("Effective!",attackInstance.target.getGlobalPosition())       
        else if (attackInstance.bonusDamage < 0.5) this.showText("Super-Weak!",attackInstance.target.getGlobalPosition())
        else if (attackInstance.bonusDamage < 0) this.showText("Weak!",attackInstance.target.getGlobalPosition())
        this.showText(attackInstance.totalDamage +" DMG",attackInstance.target.getGlobalPosition())
    }

    showText(value: string, position: Vector3){
        let text = this._availableTexts.pop()
        if (text == null){
            text = new PopupableText()
            text.addComponent(new BillBoardComponent())
        }
        text.transform.position = position
        text.shape.value = value

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
        this.shape.fontSize = 5
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
        this._text.addComponent(new MoveTransformComponent(this._text.transform.position, 
            this._text.transform.position.add(new Vector3(0,0.5,0)), time,()=>{
                this._stateRunning = false
                this._onFinishCallback(this._text)
            },TransformSystem.Interpolation.EASEOUTQUAD))
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