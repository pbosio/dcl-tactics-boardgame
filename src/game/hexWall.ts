export class HexWall implements ISystem{

    private _material: Material
    private _center: Vector3
    private _radius: number

    constructor (center: Vector3, radius: number, faces: number, material: Material){
        this._material = material
        this._center = center
        this._radius = radius

        const angle = 360/faces
        const wallscale =  radius * 2 * Math.tan(angle * 0.5 * Math.PI / 180)

        for (let i=0; i<faces; i++){
            let dirVec = new Vector3(0,0,1)
            let wallPos = center.add(dirVec.rotate(Quaternion.Euler(0,angle*i,0)).scale(radius))
            wallPos.y = wallscale * 0.5
            let wallRot = Quaternion.Euler(0,angle*i,0)
            this.createWall(wallPos, wallRot, new Vector3(wallscale, wallscale, 1), material)
        }
    }

    private _wallShapesTemp: PlaneShape[] = []
    private _visibleTemp: boolean = false
    update(){
        let alpha = 1 - (Vector3.DistanceSquared(Camera.instance.position, this._center) / (this._radius * this._radius)*1.2)
        if (alpha > 0.8) alpha = 1
        else alpha = Scalar.Clamp(alpha,0,1)
        // this._material.alpha = alpha

        //temp alpha not working!
        if (alpha > 0.5 && !this._visibleTemp){
            this._visibleTemp = true
            this._wallShapesTemp.forEach(wall => {
                wall.visible = true
            });
        }
        else if (alpha <= 0.5 && this._visibleTemp){
            this._visibleTemp = false
            this._wallShapesTemp.forEach(wall => {
                wall.visible = false
            }); 
        }
    }

    private createWall(position: Vector3, rotation: Quaternion, scale: Vector3, material: Material){
        let entity = new Entity()
        entity.addComponent(new Transform({position: position, rotation: rotation, scale: scale}))
        entity.addComponent(new PlaneShape())
        entity.addComponent(material)
        engine.addEntity(entity)

        this._wallShapesTemp.push(entity.getComponent(PlaneShape))
        entity.getComponent(PlaneShape).visible = false
    }

}