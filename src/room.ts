// import {uuid} from "./helper"
// import {User} from "./user"
// class PrivateRoom {
//     _clients: User[];
//     _chat: { messages: never[]; };
//     _id: string;
//     _type: any;
//     constructor(user1: User, user2: User, socket:any,type: string){
//        this._clients = [];
//        this._id = (type=="private")?"":"room_"+uuid()
//        this._chat = {
//            messages: []
//        }
//        this._type = type;
//     }
//     _join(user: User): void {
//         this._clients.push(user);
//     }
// }
// class RoomManager {
//     _io: any;
//     ROOMS: Room[];
//     constructor(io: any){
//         this._io = io;
//         this.ROOMS = [];
//     }

//     _getRoomByID(id: string): any {
//         let r = null
//         for (let i = 0; i < this.ROOMS.length; i++) {
//             const room = this.ROOMS[i];
//             if(room._id === id) {
//                 r = room
//             }
//         }
//         return r
//     }

//     _createPrivateRoom(user1, user2): any {
//         let r = new Room(this._io,"private")
//         this.ROOMS.push(r)
//         return true
//     }

//     _userIsInRoom(room: Room, user: User): boolean {
//         for (let i = 0; i < this.ROOMS.length; i++) {
//             const r = this.ROOMS[i];
//             for (let i2 = 0; i2 < r._clients.length; i2++) {
//                 const client = r._clients[i2];
//                 if(client.id == user.id){
//                     return true
//                 }
//             }
//         }
//         return false
//     }

//     _joinRoom(room: Room, user: User) {
//         switch(room._type) {
//             case "private":
//                 if(room._clients.length > 2) {"room full"}
//                 if(this._userIsInRoom(room,user)) {"user already in room"}
//             default:
//                 return "inavlid type"
//         }
//     }
// }