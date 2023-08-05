const { GRID_SIZE } = require('./constants');

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity,
}

function initGame() {
  const state = createGameState() //save GameState
  randomFood(state); //createRandom Food
  return state;//return state
}

function createGameState() {
  return {
    players: [{//player 1
      pos: {
        x: 3,
        y: 20,
      },
      vel: {
        x: 1,
        y: 0,
      },
      snake: [
        {x: 1, y: 20},
        {x: 2, y: 20},
        {x: 3, y: 20},
      ],
      points: 0,
      playerOneName: "",

    }, {//player 2
      pos: {
        x: 38,
        y: 20,
      },
      vel: {
        x: -1,
        y: 0,
      },
      snake: [
        {x: 40, y: 20},
        {x: 39, y: 20},
        {x: 38, y: 20},
      ],
      points: 0,
      playerTwoName: ""
    }],
    food: {},
    gridsize: GRID_SIZE,
  };
}

function gameLoop(state) {
  if (!state) {//if state is false/undefined or 0
    return;
  }

  const playerOne = state.players[0];//extract Object Player 1
  const playerTwo = state.players[1];//extract Object Player 2

  playerOne.pos.x += playerOne.vel.x; //update pos
  playerOne.pos.y += playerOne.vel.y;

  playerTwo.pos.x += playerTwo.vel.x; //update pos
  playerTwo.pos.y += playerTwo.vel.y;

  //check if Player 1 is beyond GridSize --> return value is number from the winning Player (2)
  if (playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE) {
    return 2;
  }
//check if Player 1 is beyond GridSize --> return value is number from the winning Player (1)
  if (playerTwo.pos.x < 0 || playerTwo.pos.x > GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y > GRID_SIZE) {
    return 1;
  }

  //check if player 1 has eaten food
  if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
    playerOne.snake.push({ ...playerOne.pos });//create newObject from current Position and push it the last position
    playerOne.pos.x += playerOne.vel.x;//update pos
    playerOne.pos.y += playerOne.vel.y;
    randomFood(state);//create new Food
  }
  	//check if player 2 has eaten food
  if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
    playerTwo.snake.push({ ...playerTwo.pos });//create newObject from current Position and push it the last position
    playerTwo.pos.x += playerTwo.vel.x;//update pos
    playerTwo.pos.y += playerTwo.vel.y;
    randomFood(state);//create new Food
  }


  //check Collision
  if (playerOne.vel.x || playerOne.vel.y) {//check if player 1 is moving 
    for (let cell of playerOne.snake) { //loop through the Player 1 Snake
      if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {//check if player 1 one is collides with itself
        return 2;//if true --> Player 2 is the winner
      }
    }
    /*
    If there is no collision with own body, a new cell with current position of player 1 
    is added to the snake (playerOne.snake.push({ ...playerOne.pos })) and the
     first cell of the snake is removed (playerOne.snake.shift()). This updates the movement of the snake.
    */
    playerOne.snake.push({ ...playerOne.pos });
    playerOne.snake.shift();
  }

  if (playerTwo.vel.x || playerTwo.vel.y) {//check if player 2 is moving 
    for (let cell of playerTwo.snake) { //loop through the Player 2 Snake
      if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {//check if player 2 one is collides with itself
        return 1;
      }
    }
     /*
    If there is no collision with own body, a new cell with current position of player 1 
    is added to the snake (playerOne.snake.push({ ...playerOne.pos })) and the
     first cell of the snake is removed (playerOne.snake.shift()). This updates the movement of the snake.
    */
    playerTwo.snake.push({ ...playerTwo.pos });
    playerTwo.snake.shift();
  }


  //check if player 1 collides with player 2
  if (playerOne.vel.x || playerOne.vel.y) {//check if player 1 is moving 
    for (let cell of playerTwo.snake) {
      if(cell.x === playerOne.pos.x && cell.y === playerOne.pos.y){
        return 2;

      }
    }
  }

  //check if player 2 collides with player 1
  if (playerTwo.vel.x || playerTwo.vel.y) {//check if player 1 is moving 
    for (let cell of playerOne.snake) {
      if(cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y){
        return 1;

      }
    }
  }
  
  return false;
}

function randomFood(state) {
  food = {//new Food Object, x and y are coordinates
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  }

  //check if the food is on spot with the snake from player 1
  for (let cell of state.players[0].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }
    //check if the food is on spot with the snake from player 2
  for (let cell of state.players[1].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }

  state.food = food;//if the food is on an empty position
}

function getUpdatedVelocity(keyCode, velOld) {
  switch (keyCode) {
    case 37: { // left
      if(velOld.x != 1){
        return { x: -1, y: 0 };
      }
    }
    case 40: { // down
      if(velOld.y != 1){
        return { x: 0, y: -1 };
      }
  
    }
    case 39: { // right
      if(velOld.x != -1){
        return { x: 1, y: 0 };
      }
      
    }
    case 38: { // up
      if(velOld.y != -1){
        return { x: 0, y: 1 };
      }
      
    }
  }
}

