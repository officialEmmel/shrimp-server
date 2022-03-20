
interface UserConfig {
    id: string,
    token: string,
    socket: any,
    name: string,
    color: string
}

export class User {
    _privateRooms: any[];
    online: boolean;
    id: string;
    token: string;
    socket: any;
    name: string;
    color: string;
    constructor(config: UserConfig) {
        this.id = config.id
        this.token = config.token
        this.socket = config.socket
        this.name = config.name
        this.color = config.color
        this._privateRooms = []
        this.online = true;
    }
}

export class UserManager {
    USERS: User[];
    private _io: any;
    constructor(io: any){
        this.USERS = []
        this._io = io
        setInterval((that) => {console.log(that.USERS.length)}, 1000, this)
    }

    _handleConnect(socket: any,id: any, name: any, color: any, token: any) {
        console.log("connecting attempt...")
        //if(!id || !name || !color || !token) {socket.emit('error',{msg:"Invalid Client config"})}
        let user: UserConfig = {id: id, token:token, name: name, color: color, socket: socket}
        if(this.USERS.length == 0) {
            let u = new User(user)
            this.USERS.push(u)
            socket.join("public");
            console.log("connected as " + user.name)
            user.socket.emit("registered", {member:this._deprivateUser(u)})
            return 
        }
        for (let i = 0; i < this.USERS.length; i++) {
            const reg = this.USERS[i];
            if(user.token == reg.token) {
                reg.name = user.name
                reg.color = user.color
                reg.socket = socket
                reg.online = true
                for (let i = 0; i < reg._privateRooms.length; i++) {
                    const room = reg._privateRooms[i];
                    room.setOn(reg)
                }
                console.log("reconnected as " + user.name)
                user.socket.emit("updated", {member:this._deprivateUser(reg)})

                this._updateAll()
                setTimeout((that) => {this._updateAll()}, 500, this)

                return;
            }  
        }
        let u = new User(user)
        this.USERS.push(u)
        console.log("connected as " + user.name)
        user.socket.emit("registered", {member:this._deprivateUser(u)})

        this._updateAll()
        setTimeout((that) => {this._updateAll()}, 500, this)

        return
        
        // let u = new User(user)
        // this.USERS.push(u)
        // socket.join("public");
        // console.log("connected as " + user.name)
        // user.socket.emit("registered", {member:this._deprivateUser(u)})
    }

    _handleDisconnect(socket: any) {
        let i = 0
        let user = null
        for (i; i < this.USERS.length; i++) {
            user = this.USERS[i];
            if(user.socket.id == socket.id) {
                console.log("disconnected: " + user.name)
                break;
            }
        }
        if(user == null) {console.log("an unregistered user disconnected"); return}
        user.online = false
        for (let i = 0; i < user._privateRooms.length; i++) {
            const room = user._privateRooms[i];
            room.setOff(user)
        }
        //this.USERS.splice(i, 1)
        this._updateAll()
        console.log("set offline");
        
    }

    _deprivateUsers(){
        let members = []
        for (let i = 0; i < this.USERS.length; i++) {
            const element = this.USERS[i];
            members.push({id:element.id,name:element.name,color:element.color,online:element.online})
        }
        return members 
    }

    _deprivateUser(user: User){
        return {
            id: user.id,
            name: user.name,
            color: user.color,
            online: user.online
        }
    }

    _updateAll(){
        for (let i = 0; i < this.USERS.length; i++) {
            const u = this.USERS[i];
            this._io.to(u.socket.id).emit("members",{members:this._deprivateUsers()})
        }
        console.log("updated to players");
    }

    _updateOne(socket: any){
        this._io.to(socket.id).emit("members",{members:this._deprivateUsers()})
    }

    _getUserByID(id: string){
        let user = null
        for (let i = 0; i < this.USERS.length; i++) {
            const reg = this.USERS[i];
            
            if(reg.id == id){user = reg; break}
        }
        return user
    }

    _getUserByToken(token: string){
        let user = null
        for (let i = 0; i < this.USERS.length; i++) {
            const reg = this.USERS[i];
            
            if(reg.token == token){user = reg; break}
        }
        return user
    }
}