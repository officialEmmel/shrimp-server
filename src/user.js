"use strict";
exports.__esModule = true;
exports.UserManager = exports.User = void 0;
var User = /** @class */ (function () {
    function User(config) {
        this.id = config.id;
        this.token = config.token;
        this.socket = config.socket;
        this.name = config.name;
        this.color = config.color;
        this._privateRooms = [];
        this.online = true;
    }
    return User;
}());
exports.User = User;
var UserManager = /** @class */ (function () {
    function UserManager(io) {
        this.USERS = [];
        this._io = io;
        //setInterval((that) => {console.log(that.USERS.length)}, 1000, this)
    }
    UserManager.prototype._handleConnect = function (socket, id, name, color, token) {
        var _this = this;
        console.log("connecting attempt...");
        //if(!id || !name || !color || !token) {socket.emit('error',{msg:"Invalid Client config"})}
        var user = { id: id, token: token, name: name, color: color, socket: socket };
        if (this.USERS.length == 0) {
            var u_1 = new User(user);
            this.USERS.push(u_1);
            socket.join("public");
            console.log("connected as " + user.name);
            user.socket.emit("registered", { member: this._deprivateUser(u_1) });
            return;
        }
        for (var i = 0; i < this.USERS.length; i++) {
            var reg = this.USERS[i];
            if (user.token == reg.token) {
                reg.name = user.name;
                reg.color = user.color;
                reg.socket = socket;
                reg.online = true;
                for (var i_1 = 0; i_1 < reg._privateRooms.length; i_1++) {
                    var room = reg._privateRooms[i_1];
                    room.setOn(reg);
                }
                console.log("reconnected as " + user.name);
                user.socket.emit("updated", { member: this._deprivateUser(reg) });
                this._updateAll();
                setTimeout(function (that) { _this._updateAll(); }, 500, this);
                return;
            }
        }
        var u = new User(user);
        this.USERS.push(u);
        console.log("connected as " + user.name);
        user.socket.emit("registered", { member: this._deprivateUser(u) });
        this._updateAll();
        setTimeout(function (that) { _this._updateAll(); }, 500, this);
        return;
        // let u = new User(user)
        // this.USERS.push(u)
        // socket.join("public");
        // console.log("connected as " + user.name)
        // user.socket.emit("registered", {member:this._deprivateUser(u)})
    };
    UserManager.prototype._handleDisconnect = function (socket) {
        var i = 0;
        var user = null;
        for (i; i < this.USERS.length; i++) {
            user = this.USERS[i];
            if (user.socket.id == socket.id) {
                console.log("disconnected: " + user.name);
                break;
            }
        }
        if (user == null) {
            console.log("an unregistered user disconnected");
            return;
        }
        user.online = false;
        for (var i_2 = 0; i_2 < user._privateRooms.length; i_2++) {
            var room = user._privateRooms[i_2];
            room.setOff(user);
        }
        //this.USERS.splice(i, 1)
        this._updateAll();
        console.log("set offline");
    };
    UserManager.prototype._deprivateUsers = function () {
        var members = [];
        for (var i = 0; i < this.USERS.length; i++) {
            var element = this.USERS[i];
            members.push({ id: element.id, name: element.name, color: element.color, online: element.online });
        }
        return members;
    };
    UserManager.prototype._deprivateUser = function (user) {
        return {
            id: user.id,
            name: user.name,
            color: user.color,
            online: user.online
        };
    };
    UserManager.prototype._updateAll = function () {
        for (var i = 0; i < this.USERS.length; i++) {
            var u = this.USERS[i];
            this._io.to(u.socket.id).emit("members", { members: this._deprivateUsers() });
        }
        console.log("updated to players");
    };
    UserManager.prototype._updateOne = function (socket) {
        this._io.to(socket.id).emit("members", { members: this._deprivateUsers() });
    };
    UserManager.prototype._getUserByID = function (id) {
        var user = null;
        for (var i = 0; i < this.USERS.length; i++) {
            var reg = this.USERS[i];
            if (reg.id == id) {
                user = reg;
                break;
            }
        }
        return user;
    };
    UserManager.prototype._getUserByToken = function (token) {
        var user = null;
        for (var i = 0; i < this.USERS.length; i++) {
            var reg = this.USERS[i];
            if (reg.token == token) {
                user = reg;
                break;
            }
        }
        return user;
    };
    return UserManager;
}());
exports.UserManager = UserManager;
