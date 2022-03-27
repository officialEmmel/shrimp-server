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

            socket.on("offer",(dt:any)=>{
                console.log("redirecting signal " + dt.sgn + " to " + dt.to.id + " from " + dt.from.id)
                this._io.to(this._userManager._getUserByID(dt.to.id)?.socket.id).emit("offer",dt)
            })

            
            socket.on("accept",(dt:any)=>{
                console.log("redirecting accept " + dt.sgn + " to " + dt.to + " from " + dt.from)
                this._io.to(this._userManager._getUserByID(dt.to.id)?.socket.id).emit("accept",dt)
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

