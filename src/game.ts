import { Grid } from "./grid/grid";
import { GridManager } from "./grid/gridManager";
import { Unit } from "./unit/unit";
import { Faction } from "./unit/faction";
import { TurnManager } from "./game/turnManager";
import { PlayerController } from "./game/playerController";
import { TransformSystem } from "./modules/transfromSystem";
import { BillBoardComponentSystem } from "./modules/billboardComponent";
import { AttackManager } from "./game/attackManager";
import { TextPopup } from "./game/textPopup";
import { LifeBarSystem } from "./game/lifebarSystem";
import { AIController } from "./game/aiController";
import { TurnChangeScreen } from "./screens/turnChangeScreen";
import { HintUI } from "./screens/hintUI";
import { ArrowProjectile } from "./unit/projectileArrow";
import { GameOverScreen } from "./screens/gameoverScreen";


//*********************************
//Create Grid & Grid Manager
//*********************************
const grid = new Grid(8,8,0.2,0.01)
grid.transform.position = new Vector3(8,0,8)
engine.addEntity(grid)

const gridConfig = new GridManager.Config()
gridConfig.tileMaterialDefault = new Material()
gridConfig.tileMaterialWalkeable = new Material()
gridConfig.tileMaterialHostile = new Material()

gridConfig.tileMaterialDefault.albedoTexture = new Texture("images/tile/default.jpg")
gridConfig.tileMaterialWalkeable.albedoTexture = new Texture("images/tile/walkeable.jpg")
gridConfig.tileMaterialHostile.albedoTexture = new Texture("images/tile/hostile.jpg")

const gridManager = new GridManager(grid,gridConfig)

//*********************************
//Projectiles' Behavior
//*********************************
const arrowBehavior = new ArrowProjectile(new GLTFShape("models/arrow.glb"), new Vector3(0.5,0.5,0.5), grid)

//*********************************
//Define Unit Types & Bonuses
//*********************************
enum UnitTypes {CHIVALRY, PIKES, ARCHERS, INFANTRY}
AttackManager.addBonus(UnitTypes.CHIVALRY, UnitTypes.ARCHERS, 0.8)
AttackManager.addBonus(UnitTypes.PIKES, UnitTypes.CHIVALRY, 0.7)
AttackManager.addBonus(UnitTypes.ARCHERS, UnitTypes.CHIVALRY, 0.3)
AttackManager.addBonus(UnitTypes.INFANTRY, UnitTypes.ARCHERS, 0.1)
AttackManager.addBonus(UnitTypes.ARCHERS, UnitTypes.INFANTRY, -0.6)

const unitStatsChivalry = {attackRange: 1, moveRange: 4, health: 6, unitType: UnitTypes.CHIVALRY}
const unitStatsSoldier = {attackRange: 1, moveRange: 1, health: 10, unitType: UnitTypes.INFANTRY}
const unitStatsPike = {attackRange: 2, moveRange: 2, health: 4, unitType: UnitTypes.PIKES}
const unitStatsArcher = {attackRange: 8, moveRange: 2, health: 2, unitType: UnitTypes.ARCHERS, projectile: arrowBehavior}
//const unitStatsArcher = {attackRange: 5, moveRange: 2, health: 2, unitType: UnitTypes.ARCHERS, projectile: arrowBehavior}

//*********************************
//Load Units' Meshes
//*********************************
const knightShape_white = new GLTFShape("models/knight_white.glb")
const knightShape_black = new GLTFShape("models/knight_black.glb")
const archerShape_white = new GLTFShape("models/archer_white.glb")
const archerShape_black = new GLTFShape("models/archer_black.glb")
const pikeShape_white = new GLTFShape("models/pike_white.glb")
const pikeShape_black = new GLTFShape("models/pike_black.glb")
const soldierShape_white = new GLTFShape("models/soldier_white.glb")
const soldierShape_black = new GLTFShape("models/soldier_black.glb")

//*********************************
//Create Units
//*********************************
const horsePlayer = new Unit(knightShape_white, unitStatsChivalry)
const soldierPlayer = new Unit(soldierShape_white, unitStatsSoldier)
const pikePlayer = new Unit(pikeShape_white, unitStatsPike)
const archerPlayer = new Unit(archerShape_white, unitStatsArcher)

const horseAI = new Unit(knightShape_black, unitStatsChivalry)
const soldierAI = new Unit(soldierShape_black, unitStatsSoldier)
const pikeAI = new Unit(pikeShape_black, unitStatsPike)
const archerAI = new Unit(archerShape_black, unitStatsArcher)

GridManager.addToGrid(horsePlayer, GridManager.getTileByIndex(0,2))
GridManager.addToGrid(soldierPlayer, GridManager.getTileByIndex(0,3))
GridManager.addToGrid(pikePlayer, GridManager.getTileByIndex(0,4))
GridManager.addToGrid(archerPlayer, GridManager.getTileByIndex(0,5))

GridManager.addToGrid(horseAI, GridManager.getTileByIndex(7,2))
GridManager.addToGrid(soldierAI, GridManager.getTileByIndex(7,3))
GridManager.addToGrid(pikeAI, GridManager.getTileByIndex(7,4))
GridManager.addToGrid(archerAI, GridManager.getTileByIndex(7,5))

//*********************************
//Create Factions & Controllers
//*********************************
const factionPlayer = new Faction("Player")
const factionAI = new Faction("AI")

factionPlayer.addUnit(horsePlayer)
factionPlayer.addUnit(soldierPlayer)
factionPlayer.addUnit(pikePlayer)
factionPlayer.addUnit(archerPlayer)

factionAI.addUnit(horseAI)
factionAI.addUnit(soldierAI)
factionAI.addUnit(pikeAI)
factionAI.addUnit(archerAI)

TurnManager.addFaction(factionPlayer)
TurnManager.addFaction(factionAI)

const playerController = new PlayerController(factionPlayer)
TurnManager.addListener(playerController)

const aiController = new AIController(factionAI, factionPlayer)
TurnManager.addListener(aiController)
Unit.addListener(aiController)


//*********************************
//UI∫
//*********************************
const gameCanvas = new UICanvas()
gameCanvas.visible = true

TurnChangeScreen.Create(gameCanvas)
HintUI.Create(gameCanvas)
GameOverScreen.Create(gameCanvas, null)

//*********************************
//Create Systems
//*********************************
const textPopup = new TextPopup()
Unit.addListener(textPopup)

const transformSystem = new TransformSystem()
engine.addSystem(transformSystem)

const billboardSystem = new BillBoardComponentSystem()
engine.addSystem(billboardSystem)

const lifebarSystem = new LifeBarSystem()
Unit.addListener(lifebarSystem)
engine.addSystem(lifebarSystem)
