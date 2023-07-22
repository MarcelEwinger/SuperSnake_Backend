const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server, { cors: { origin: '*'} });
const PORT = process.env.PORT || 3000;

const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE, MAX_PLAYERS_PER_ROOM } = require('./constants');
const { makeid } = require('./utils');


app.get('/', (_req, res) =>{
  res.write(`<h1>Socket IO Start on Port : ${PORT}</h1>`)
  res.end();
})

server.listen(PORT, ()=>{
  console.log('Listing on*:3000')
})



const state = {};
const clientRooms = {};

io.on('connection', client => {
  console.log('Client connected: ' + client.id)

  client.on("disconnect", () => {
    console.log('Client disconnected ' + client.id); // undefined
  });

  client.on('NEW_GAME', () =>{
    newGame(client);
  });

  client.on('JOIN_GAME', (roomName)=>{
    console.log('Join Game roomName ' + roomName)
    joinGame(roomName, client, io);
  });

  client.on('MOVEMENT', (keyCode) =>{
    handleMovement(keyCode, client)
  });


});

function startGame(roomName){
  const interval = setInterval(() =>{//intervall
    const winner = gameLoop(state[roomName]);//save winner
    if (!winner) {//no winner
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(interval);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('UPDATE_GAME_STATE', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('GAME_OVER', JSON.stringify({ winner }));
}


function handleMovement(keyCode, client){
  const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    //only for the web dummy
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode); //get vel
    if (vel) {//true
      state[roomName].players[client.number - 1].vel = vel;//update
    }
    
    

}

function newGame(client){
  let roomName = makeid();//generate roomID
  console.log('New Room:'  + roomName)
  clientRooms[client.id] = roomName;//The roomName is assigned to the clientRooms object.
  client.emit('ROOM_NAME', roomName);//send client the roomName
  console.log('Emit Room :'  + roomName)
  state[roomName] = initGame();//The game state for the generated roomName is initialized

  client.join(roomName);//client joins room
  console.log('Client joins room:')
  client.number = 1;//client is player1
  console.log('Client Player number:' + client.number)
  client.emit('INIT', 1);
}





function joinGame(roomName, client, io){
  //const room = io.sockets.adapter.rooms[roomName];//get roomName
  console.log(io.sockets.adapter.rooms.get(roomName));
  const numClients = io.sockets.adapter.rooms.get(roomName)

  /*
  let allUsers;//decleare new let
    if (room) {//if room is true
      allUsers = room.sockets; //get the sockets in the room 
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;//length of object
    }
    */

    if (numClients === 0) {//if the code was not right
      client.emit('UNKNOWN_CODE');
      console.log('Error UNKNOWN CODE ' + room)
      return;
    } else if (numClients > 1) {//if the room has 2 players
      client.emit('TOO_MANY_PLAYERS');
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);//The roomName is assigned to the clientRooms object.
    client.number = 2;//client is player2
    client.emit('INIT', 2);
    
    startGame(roomName);//startGame
  }