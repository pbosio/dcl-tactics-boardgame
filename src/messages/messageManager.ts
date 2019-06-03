/**
 * the only purpose of this class is to be able to add multiplayer later (if there is time)
 */
export class MessageManager{
    static send(message: MessageManager.IMessage){
        message.execute()
    }

    private constructor(){}
}

export namespace MessageManager{
    export interface IMessage{
        execute()
    }
}