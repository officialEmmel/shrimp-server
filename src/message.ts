import {User} from './user'

interface Message {
    sender_name: string,
    sender_id: string,
    message: string, 
    timestamp: number
}

export class PrivateChat {
    clientA: User;
    clientB: User;
    history:  Message[];
    lastMessage: number;
    private _io: any;
    timedOut: boolean;
    timedOutCount: number;
    constructor(io: any, clientA: User, clientB: User){
        
        this.clientA = clientA;
        this.clientB = clientB;
        this.clientA._privateRooms.push(this)
        this.clientB._privateRooms.push(this)
        this.timedOut = false;
        this.timedOutCount = 0;
        this._io = io;
        this.lastMessage = Date.now();
        this.history = []
        console.log("room created | clientA: " + this.clientA.name + " clientB: " + this.clientB.name);
    }
    setOff(user: User){
        if(user == this.clientA) {
            this.sendAll("chat_off",{client:this.clientA.id, status: this.clientB.online})
        }
        else if(user == this.clientB) {
            this.sendAll("chat_off",{client:this.clientA.id, status: this.clientB.online})
        }
        else {}

        if(!this.clientA.online && !this.clientB.online) {
            console.log("added room to timout list");          
            this.timedOut = true
        }
    }

    setOn(user: User){
        if(user == this.clientA) {
            this.timedOut = false;
            this.sendAll("chat_on",{client:this.clientA.id, status: this.clientB.online})
        }
        else if(user == this.clientB) {
            this.timedOut = false;
            this.sendAll("chat_on",{client:this.clientA.id, status: this.clientB.online})
        }
        else {}
    }
    
    sendMessage(sender: User, addressee: User, message: Message): void {
        this.sendAll("message",message)
        this.history.push(message)
    }
    sendAll(event: any, message: any){
        this._io.to(this.clientA.socket.id).emit(event, message)
        this._io.to(this.clientB.socket.id).emit(event, message)
        console.log("emitted message")
    }

}

export class PrivateChatManager {
    private _io: any;
    CHATS: PrivateChat[];
    TIMEOUT: number;
    constructor(io: any){
        this._io = io
        this.CHATS = []
        this.TIMEOUT = 1;
        setInterval((that)=>{
            for (let i = 0; i < that.CHATS.length; i++) {
                const chat = that.CHATS[i];
                if(chat.timedOut){
                    if(chat.timedOutCount >= that.TIMEOUT) {
                        console.log("destroyed room due timedOut");
                        for (let i = 0; i < chat.clientA._privateRooms.length; i++) {
                            const a = chat.clientA._privateRooms[i];
                            if(a == chat) {chat.clientA._privateRooms.splice(i,1)}
                        }
                        for (let i = 0; i < chat.clientB._privateRooms.length; i++) {
                            const b = chat.clientB._privateRooms[i];
                            if(b == chat) {chat.clientB._privateRooms.splice(i,1)}
                        }
                        that.CHATS.splice(i, 1)
                    } else {
                        chat.timedOutCount += 1
                    }
                }
            }
        },60000,this)
    }
    _haveAPrivateChat(sender: User, addressee: User): boolean{
        for (let i = 0; i < this.CHATS.length; i++) {
            const chat = this.CHATS[i];
            if(chat.clientA.token == sender.token || chat.clientB.token == sender.token) {
                if(chat.clientA.id == addressee.id || chat.clientB.id == addressee.id){
                    return true
                }
            }
        }
        return false
    }
    _createPrivateChat(sender: User, addressee: User) {
        if(!this._haveAPrivateChat(sender, addressee)) {
            let chat = new PrivateChat(this._io,sender, addressee)
            this.CHATS.push(chat)
        }
    }
    _getPrivateChat(sender: User, addressee: User) {
        let privchat = null
        for (let i = 0; i < this.CHATS.length; i++) {
            const chat = this.CHATS[i];
            if(chat.clientA.token == sender.token || chat.clientB.token == sender.token) {
                if(chat.clientA.id == addressee.id || chat.clientB.id == addressee.id){
                    privchat = chat
                    break
                }
            }
        }
        return privchat
    }

    _getChatHistory(sender: User, addressee: User) {
        let c = this._getPrivateChat(sender,addressee)
        if(c != null) {
            return c.history
        }else{ return null}
    }

    _getChatWithUser(user: User) {
        let privchat = null
        for (let i = 0; i < this.CHATS.length; i++) {
            const chat = this.CHATS[i];
            if(chat.clientA.token == user.token || chat.clientB.token == user.token) {
                privchat = chat 
            }
        }
        return privchat
    }
}

export class MessageManager {
    private _io: any;
    constructor(io: any){
        this._io = io;
    }
    _handlePrivateMessage(rmanager:any,umanager: any,message: string, sender: any, addressee: any) {
        let _sender = umanager._getUserByToken(sender)
        let _addressee = umanager._getUserByID(addressee)
        if(_sender == null) {return "sender not found, wtf how"}
        if(_addressee == null) {return "addressee not found"}
        
        if(!rmanager._haveAPrivateChat(_sender,_addressee)) {
            console.log("no room found. creating one...")
            rmanager._createPrivateChat(_sender,_addressee)
        }

        let m: Message = {
            sender_name: _sender.name,
            sender_id: _sender.id, 
            message: message,
            timestamp: Date.now()
        }

        let _chat = rmanager._getPrivateChat(_sender,_addressee)
        console.log("room found")
        _chat.sendMessage(_sender,_addressee,m)
    }
}