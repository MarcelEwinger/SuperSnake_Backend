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
const { Console } = require('console');


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



let state = {};
let clientRooms = [];

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
    searchForEmptyRoom(client, playerName, io)
  });
  

  client.on('MOVEMENT', (keyCode) =>{
    handleMovement(keyCode, client)
  });

});

function deleteRoom(roomName){
  console.log("DeleteRoom Room is in Array")
  clientRooms = clientRooms.filter((obj) => obj.name !== roomName)
  console.log("DeleteRoom Room: " + clientRooms[roomName])
  
  if(state[roomName]){
    console.log("DeleteRoom State: " + state[roomName])
    delete state[roomName]
  }
}

function startGame(roomName, client){
  const interval = setInterval(() =>{//intervall
    const winner = gameLoop(state[roomName]);//save winner
    if (!winner) {//no winner
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      clearInterval(interval);
      deleteRoom(client.room);

      
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
  io.sockets.in(room).emit('GAME_OVER', JSON.stringify({ winner }));


      
    
}


function handleMovement(keyCode, client){
  //const roomName = clientRooms[client.id];
  const roomName = clientRooms.find(element => element.name === client.room)
  console.log("HandleMovement: " + roomName);
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
      state[client.room].players[client.number - 1].vel = vel;//update
    }
    
    

}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function newGame(client, playerName){
  let roomName = makeid();//generate roomID
  console.log('New Room:'  + roomName)

  const newRoom ={//create newRoom Object
    name: roomName,
    playersCount: 1
  }

  clientRooms.push(newRoom)//add newRoomObject into clientRooms Array

  client.emit('ROOM_NAME', roomName);//send client the roomName


  const room = clientRooms.find(element => element.name === roomName)//find Room with specific roomName
  console.log('Clientroom :'  + room.name)
  console.log('ClientroomPlayers :'  + room.playersCount)
  
  state[roomName] = initGame();//The game state for the generated roomName is initialized
  state[roomName].players[0].playerOneName = playerName//set the playerName for PlayerOne
  client.join(roomName);//client joins room

  console.log('Client joins room')

  client.number = 1;//client is player1
  client.playerName = playerName;
  client.room = roomName

  console.log('Client Player number:' + client.number)
  console.log('Client Player Name:' + client.playerName)
  client.emit('INIT', 1);
}



function searchForEmptyRoom(client, playerName, io){
  if(clientRooms.length === 0){//array is empty
    newGame(client, playerName)
    console.log("searchForEmptyRoom NewGame")
    
  }else{//min one Room is in array
    const foundRoom = clientRooms.find(room => room.playersCount === 1);
      if(foundRoom){
        console.log("searchForEmptyRoom PlayersCount === 1: " + foundRoom)
        joinGame(playerName, client, io, foundRoom.name)
        
      }else{
        newGame(client, playerName)
        console.log("searchForEmptyRoom PlayersCount === 0:")
      }
  }
}


function joinGame(playerName, client, io, roomName){
  console.log(io.sockets.adapter.rooms.get(roomName));
  const numClients = io.sockets.adapter.rooms.get(roomName)
  console.log("Method: joinGame // numClients: " + numClients)
  const findClientRooms = clientRooms.findIndex(item => item.name === roomName)
  clientRooms[findClientRooms].playersCount = 2


    if (numClients === 0) {//if the code was not right
      client.emit('UNKNOWN_CODE');
      console.log('Error UNKNOWN CODE ' + room)
      return;
    } else if (numClients > 1) {//if the room has 2 players
      client.emit('TOO_MANY_PLAYERS');
      return;
    }

    

    client.join(roomName);//The roomName is assigned to the clientRooms object.
    client.emit('ROOM_NAME', roomName);
    console.log("Player 2 joins room")
    
    client.number = 2;//client is player2
    client.playerName = playerName;
    client.room = roomName
    console.log('Client Player number:' + client.number)
    console.log('Client Player Name:' + client.playerName)

    state[roomName].players[1].playerTwoName = playerName//set the playerName for PlayerOne
    console.log("JoinGame Method PlayerOneName: " + state[roomName].players[0].playerOneName)
    console.log("JoinGame Method PlayerTwpeName: " + state[roomName].players[1].playerTwoName)
    io.to(roomName).emit("PLAYER_ONE_NAME", state[roomName].players[0].playerOneName)
    io.to(roomName).emit("PLAYER_TWO_NAME", state[roomName].players[1].playerTwoName)
    client.emit('INIT', 2);
    
    startGame(roomName, client);//startGame
  }