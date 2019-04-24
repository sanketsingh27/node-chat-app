const path = require('path')
const express = require('express')
const http = require("http")
const socketio = require('socket.io')
const Filter = require('bad-words')
const {addUser,
    removeUser,
    getUser,
    getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
 
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

const { generateMessage,generateLocation } = require('./utils/messages')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket) =>{
    
    socket.on('join',({username, room},callback) => {
        const {error, user} = addUser({
            id: socket.id,
            username,
            room
        })

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage(user.username,'Welcome'))
        socket.broadcast.to(room).emit('message',generateMessage(user.username,`${user.username} has joined`))
        
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
        // io.to.emit , socket.broadcast.to.emit
    })

    socket.on('newMsg',(msg,callback)=>{
        const filter = new Filter();
        const user = getUser(socket.id)

        if(filter.isProfane(msg)){
            return callback('Profinity was found')
        }

        io.to(user.room).emit('message',generateMessage(user.username,msg))
        callback()
    })

    //location sharing latitude,longitude 
    socket.on('locationMessage',(position,callback)=>{
        const user = getUser(socket.id)
        
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback('location was shared by server ')
    })

    //disconnect event 
    socket.on('disconnect',()=> {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage(user.username,`${user.username} has left the room..`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})