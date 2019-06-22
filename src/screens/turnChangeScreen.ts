import { StateMachine } from "../modules/stateMachine";
import { HintUI } from "./hintUI";

export class TurnChangeScreen{

    private static _instance: TurnChangeScreen = null

    private _bannerState: StateMachine.State
    private _textState: ShowTextState

    private _bannerStateMachine: StateMachine
    private _textStateMachine: StateMachine

    private constructor(canvas: UICanvas){
        let banner = new UIContainerRect(canvas)
        banner.vAlign = 'center'
        banner.hAlign = 'left'
        banner.height = "25%"
        banner.width = "100%"
        banner.color = Color4.Red()

        let text = new UIText(canvas)
        text.hTextAlign = "center"
        text.vTextAlign = "center"
        text.fontSize = 60
        text.outlineWidth = 0.1
        text.outlineColor = Color4.Black()
        text.color = Color4.White()
        text.value = "Player's Turn"

        banner.visible = false
        text.visible = false

        this._bannerState = new WaitBannerState(2)
        this._textState = new ShowTextState(3, 6,text)

        this._bannerState.nextState = new ShowBannerState(1, banner)
        this._bannerState.nextState.nextState = new WaitBannerState(3)
        this._bannerState.nextState.nextState.nextState = new HideBannerState(1, banner)

        this._bannerStateMachine = new StateMachine()
        engine.addSystem(this._bannerStateMachine)

        this._textStateMachine = new StateMachine()
        engine.addSystem(this._textStateMachine)
    }

    static Create(canvas: UICanvas){
        if (this._instance == null){
            this._instance = new TurnChangeScreen(canvas)
        }
    }

    static Show(text: string, onFinish:()=>void){
        if (this._instance){
            this._instance._textState.setText(text)

            this._instance._bannerStateMachine.setState(this._instance._bannerState)
            this._instance._textStateMachine.setState(this._instance._textState)

            this._instance._bannerStateMachine.setFinishCallback(onFinish)
            HintUI.ShowHint("")
        }
    }

}

class ShowBannerState extends StateMachine.State
{
    private _speed: number
    private _currentFill: number
    private _banner: UIContainerRect

    constructor(time: number, banner: UIContainerRect){
        super()
        this._speed = 100/time
        this._banner = banner
    }

    onStart(){
        this._currentFill = 0
        this._banner.hAlign = "left"
        this._banner.width = "0%"
        this._banner.visible = true
    }

    onUpdate(dt: number): boolean{
        this._currentFill += this._speed * dt
        this._banner.width = this._currentFill.toString() + "%"
        return this._currentFill < 100
    }
}

class WaitBannerState extends StateMachine.State{
    private _elapsedTime: number
    private _waitTime: number

    constructor(waitTime: number){
        super()
        this._waitTime = waitTime
    }

    onStart(){
        this._elapsedTime = 0
    }

    onUpdate(dt: number){
        this._elapsedTime += dt
        return this._elapsedTime < this._waitTime
    }

}

class HideBannerState extends StateMachine.State
{
    private _speed: number
    private _currentFill: number
    private _banner: UIContainerRect

    constructor(time: number, banner: UIContainerRect){
        super()
        this._speed = 100/time
        this._banner = banner
    }

    onStart(){
        this._currentFill = 100
        this._banner.hAlign = "right"
        this._banner.width = "100%"
    }

    onUpdate(dt: number): boolean{
        this._currentFill = Scalar.Clamp(this._currentFill - this._speed * dt,0,100)
        this._banner.width = this._currentFill.toString() + "%"
        return this._currentFill != 0
    }

    onEnd(){
        this._banner.visible = false
    }
}

class ShowTextState extends StateMachine.State
{
    private _text: UIText
    private _idleTime: number
    private _currentTime: number
    private _fullTime: number

    constructor(idleTime: number, time: number, text: UIText){
        super()
        this._idleTime = idleTime
        this._text = text
        this._fullTime = time
    }

    setText(text: string){
        this._text.value = text
    }

    onStart(){
        this._text.visible = false
        this._currentTime = 0
    }

    onUpdate(dt: number): boolean{
        this._currentTime += dt
        if (this._currentTime >= this._idleTime && !this._text.visible){
            this._text.visible = true
        }
        
        return this._currentTime <= this._fullTime
    }

    onEnd(){
        this._text.visible = false
    }
}