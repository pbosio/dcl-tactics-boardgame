export class GameOverScreen{

    private static  _instance: GameOverScreen = null

    private _container: UIContainerRect
    private _titleText: UIText
    private _turnsText: UIText

    private constructor (canvas: UICanvas, resetCallback: ()=> void){
        this._container = new UIContainerRect(canvas)
        this._container.color = Color4.Yellow()
        this._container.width = "25%"
        this._container.height = "70%"

        const titleText = new UIText(this._container)
        titleText.value = "YOU WIN!"
        titleText.vAlign = "top"
        titleText.hAlign = "centers"
        titleText.vTextAlign = "top"
        titleText.hTextAlign = "centers"
        titleText.fontSize = 30
        titleText.paddingTop = 5
        titleText.color = Color4.Black()
        this._titleText = titleText

        const turnsText = new UIText(this._container)
        turnsText.value = "Turns played: 0"
        turnsText.vAlign = "top"
        turnsText.hAlign = "left"
        turnsText.vTextAlign = "top"
        turnsText.hTextAlign = "left"
        turnsText.paddingTop = 60
        turnsText.paddingLeft = 5
        turnsText.fontSize = 20
        turnsText.color = Color4.Black()
        this._turnsText = turnsText

        const buttonImage = new UIImage(this._container,null)
        buttonImage.vAlign = "bottom"
        buttonImage.hAlign = "center"
        buttonImage.width = "50%"
        buttonImage.height = "10%"
        buttonImage.paddingBottom = 5
        
        const buttonText = new UIText(buttonImage)
        buttonText.vTextAlign = "center"
        buttonText.hTextAlign = "center"
        buttonText.fontSize = 20
        buttonText.value = "RESTART"
        buttonText.isPointerBlocker = false
        buttonText.color = Color4.Black()

        buttonImage.onClick = new OnClick(event=>{
            this._container.visible = false
            if (resetCallback) resetCallback()
        })

        this._container.visible = false
    }

    static Create(canvas: UICanvas, resetCallback: ()=> void): GameOverScreen{
        if (this._instance == null){
            this._instance = new GameOverScreen(canvas,resetCallback)
        }
        return this._instance
    }

    static Show(localWin: boolean, turns: number){
        if (this._instance){
            this._instance._titleText.value = localWin? "YOU WIN!" : "LOOSER!"
            this._instance._turnsText.value = "Turns played: "+turns
            this._instance._container.visible = true
        }
    }

}