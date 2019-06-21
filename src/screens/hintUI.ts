export class HintUI {

    private static _instance: HintUI = null
    private static _queued: string = "Select a UNIT"

    private _hintText: UIText

    static Create(canvas: UICanvas): HintUI{
        if (this._instance == null){
            this._instance = new HintUI(canvas)
        }
        return this._instance
    }

    static ShowHint(hint: string){
        if (this._instance != null){
            this._instance._hintText.value = hint
        }
        else{
            this._queued = hint
        }
    }

    private constructor(canvas: UICanvas){
        this._hintText = new UIText(canvas)
        this._hintText.vAlign = "bottom"
        this._hintText.hAlign = "center"
        this._hintText.vTextAlign = "bottom"
        this._hintText.hTextAlign = "center"        
        this._hintText.fontSize = 20
        this._hintText.value = HintUI._queued
    }
}