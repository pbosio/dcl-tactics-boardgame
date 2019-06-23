import { ParticleSystem } from "../modules/particleSystem";
import { Unit } from "./unit";

export class HitParticle{

    private static _instance: HitParticle = null

    private _particleSystem: ParticleSystem

    private static get instance(): HitParticle{
        if (this._instance == null){
            this._instance = new HitParticle()
        }
        return this._instance
    }

    private constructor(){
        const particleMaterial = new BasicMaterial()
        particleMaterial.texture = new Texture("images/particles/hit.png",{hasAlpha: true})

        const emitter: ParticleSystem.IEmitterConfig = {
            duration: 0,
            loop: false,
            maxParticles: 1,
            particleLifeTime: 0.3,
            particleSpawnInterval: 0,
            sourceSize: Vector3.Zero(),
            startDelay: 0,
            particlesBehavior: new ParticleSystem.BasicParticlesBehavior(particleMaterial, null, null, Vector3.Zero(), null, null, new Vector3(0.4,0.4,0.4))
        }

        this._particleSystem = new ParticleSystem(emitter)
        engine.addSystem(this._particleSystem)
    }

    static show(unit: Unit){
        let scrPos = unit.getGlobalPosition().add(Vector3.Up().scale(0.2))
        let dir = Vector3.Forward().rotate(Camera.instance.rotation)
        this.instance._particleSystem.position = scrPos.subtract(dir.scale(0.2))
        this.instance._particleSystem.start()
    }

}