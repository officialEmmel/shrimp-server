const http = require('http')
const socketio = require('socket.io')

import {UserManager} from "./user"
import {MessageManager,PrivateChatManager} from "./message"

class ChatServer {
    private _server: any;
    _io: any;
    private _userManager: UserManager;
    private _messageManager: MessageManager;
    private _privateChatManager: PrivateChatManager;
    constructor(port: any) {
        this._server = http.createServer();
        this._io = socketio(this._server, {
            cors: {    
            origin: "*",    
            methods: ["GET", "POST"]  }
        })
        this._server.listen(port)
        this._userManager = new UserManager(this._io)
        this._messageManager = new MessageManager(this._io)
        this._privateChatManager = new PrivateChatManager(this._io)

        this._io.on('connection',  (socket: any) =>{
            socket.on('register',  (json: any) => {
                this._userManager._handleConnect(socket, json.id, json.name, json.color, json.token)
            })

            socket.on('private',  (json: any) => {
                console.log("incoming message ", json)
                this._messageManager._handlePrivateMessage(
                    this._privateChatManager,
                    this._userManager,
                    json.message, 
                    json.sender, 
                    json.addressee
                )
            })

            socket.on('get_chat',  (json: any) => {
                console.log("incoming chat request ", json)
                let _sender = this._userManager._getUserByToken(json.sender)
                let _addressee = this._userManager._getUserByID(json.addressee)
                if(_sender == null) {console.log("sender not found, wtf how");return "sender not found, wtf how"}
                if(_addressee == null) {console.log("addressee not found");return "addressee not found"}
                let h = this._privateChatManager._getChatHistory(_sender,_addressee)
                console.log("h",h);
                if(h != null) {socket.emit("history",{messages:h}); return}
                socket.emit("history",{messages:[]})
                return
            })

            socket.on("get_members",()=>{
                this._userManager._updateOne(socket)
            })

            socket.on('disconnect', () => {    
                this._userManager._handleDisconnect(socket)
            });
        })
    }
}

const instance = new ChatServer(process.env.PORT || 3001)

