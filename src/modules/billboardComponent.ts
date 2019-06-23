export class BillBoardComponentSystem implements ISystem{
    update(){
        let group = engine.getComponentGroup(BillBoardComponent, Transform)

        group.entities.forEach(entity => {
            billboardTransform(entity.getComponent(Transform))
        });
    }
}

export function billboardTransform(transform: Transform){
    let target = transform.position.add(Vector3.Forward().rotate(Camera.instance.rotation));
    let up = Vector3.Up().rotate(Camera.instance.rotation);
    transform.lookAt(target, up);
}

@Component("billBoardComponent")
export class BillBoardComponent{

}
