const express = require('express')// Define an Express app instance and import the Express framework
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server, { cors: { origin: '*'} });
const PORT = process.env.PORT || 3000;

const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE, MAX_PLAYERS_PER_ROOM } = require('./constants');
const { makeid } = require('./utils');


// Define a route for the HTTP endpoint '/'
// Use an anonymous function as the request handler
app.get('/', (_req, res) =>{
  // Write an HTML heading into the response with the value of 'PORT' as a variable
  res.write(`<h1>Socket IO Start on Port : ${PORT}</h1>`)
  // End the HTTP response to send it to the client
  res.end();
})

// When the server starts listening, the following callback function will be executed
server.listen(PORT, ()=>{
  console.log('Listing on*:3000')
})



const state = {};
const clientRooms = [];

/*
Whenever a client connects to the server, the provided callback function will be executed,
and the 'client' object representing the newly connected client will be passed as an argument.
*/
io.on('connection', client => {
  console.log('Client connected: ' + client.id)
  
  client.on("disconnect", () => {
    console.log('Client disconnected ' + client.id); // undefined
  });

  
  client.on('NEW_GAME', (playerName) =>{
    newGame(client, playerName);
  });
  
  /*
  client.on('JOIN_GAME', (playerName)=>{
    console.log('Join Game' + playerName)
    joinGame(playerName, client, io);
  });
  */

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

function newGame(client, playerName){
  let roomName = makeid();//generate roomID
  console.log('New Room:'  + roomName)
  //clientRooms[client.id] = roomName;//The roomName is assigned to the clientRooms object.

  const newRoom ={//create newRoom Object
    name: roomName,
    playersCount: 1
  }

  clientRooms.push(newRoom)//add newRoomObject into clientRooms Array

  client.emit('ROOM_NAME', roomName);//send client the roomName
  console.log('Clientroom :'  + clientRooms.find(element => element.name === roomName))
  
  state[roomName] = initGame();//The game state for the generated roomName is initialized
  state[roomName].players[0].playerOneName = playerName//set the playerName for PlayerOne
  client.join(roomName);//client joins room
  console.log('Client joins room:')
  client.number = 1;//client is player1
  client.playerName = playerName;
  console.log('Client Player number:' + client.number)
  console.log('Client Player Name:' + client.playerName)
  client.emit('INIT', 1);
}


function searchForEmptyRoom(){

}




/** */
function joinGame(playerName, client, io){
  console.log(io.sockets.adapter.rooms.get(roomName));
  const numClients = io.sockets.adapter.rooms.get(roomName)


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