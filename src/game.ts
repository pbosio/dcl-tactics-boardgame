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

enum UnitTypes {CHIVALRY, PIKES, ARCHERS, INFANTRY}
AttackManager.addBonus(UnitTypes.CHIVALRY, UnitTypes.ARCHERS, 0.8)
AttackManager.addBonus(UnitTypes.PIKES, UnitTypes.CHIVALRY, 0.7)
AttackManager.addBonus(UnitTypes.ARCHERS, UnitTypes.CHIVALRY, 0.3)
AttackManager.addBonus(UnitTypes.INFANTRY, UnitTypes.ARCHERS, 0.1)
AttackManager.addBonus(UnitTypes.ARCHERS, UnitTypes.INFANTRY, -0.6)

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

const knightShape_white = new GLTFShape("models/knight_white.glb")
const knightShape_black = new GLTFShape("models/knight_black.glb")
const archerShape_white = new GLTFShape("models/archer_white.glb")
const archerShape_black = new GLTFShape("models/archer_black.glb")
const pikeShape_white = new GLTFShape("models/pike_white.glb")
const pikeShape_black = new GLTFShape("models/pike_black.glb")
const soldierShape_white = new GLTFShape("models/soldier_white.glb")
const soldierShape_black = new GLTFShape("models/soldier_black.glb")

const unit1 = new Unit(knightShape_white, {attackRange: 1, moveRange: 2, health: 1, unitType: UnitTypes.ARCHERS})
const unit2 = new Unit(pikeShape_black, {attackRange: 1, moveRange: 3, health: 1, unitType: UnitTypes.INFANTRY})

const factionPlayer = new Faction("player")
const factionAI = new Faction("AI")

factionPlayer.addUnit(unit1)
factionAI.addUnit(unit2)

TurnManager.addFaction(factionPlayer)
TurnManager.addFaction(factionAI)

GridManager.addToGrid(unit1, GridManager.getTileByIndex(4,2))
GridManager.addToGrid(unit2, GridManager.getTileByIndex(3,2))

const playerController = new PlayerController(factionPlayer)
TurnManager.addListener(playerController)

const textPopup = new TextPopup()
Unit.addListener(textPopup)

const transformSystem = new TransformSystem()
engine.addSystem(transformSystem)

const billboardSystem = new BillBoardComponentSystem()
engine.addSystem(billboardSystem)