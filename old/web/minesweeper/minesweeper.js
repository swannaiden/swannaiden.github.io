/*
 * Starter Code for A2: Minesweeper
 * CS 11 JS Winter 2021
 *
 * Instructions:
 * Finish implementing all function stubs marked with TODO, and update
 * the function comments with appropriate documentation using JSDoc. Remove any TODOs
 * and comments in this file which are used to guide you through each part when 
 * you are finished.
 * 
 * Make sure to read the spec carefully for hints that will help break down the program
 * into smaller functions and avoid over-complicating your solution!
 */

(function () {
  "use strict";
  // Symbols for flags and mines. Use .textContent
  // to update content of cells when flagged or opened as a mine.
  const FLAG_SYMBOL = "&#9873";
  const MINE_SYMBOL = "&#9881";

  // These are the only module-global variables you should use (unless you add
  // extra features, like a timer). Do not add other global/module-global variables.
  // Remember to access the DOM when you can.
  let isGameOver;
  let moveCount;

  window.addEventListener("load", init);

  /**
   * Initialization for new game on clicking startGame button.
   */
  function init() {
    //event listener for start game button
    document.getElementById("play").addEventListener("click", startGame)
    
  }

  /**
   * Starts the game, building a grid with the selected dimensions.
   */
  function startGame() {

    // reset message board
    showMessage("")
    // reset move count
    moveCount = 0
    // reset game over variable
    isGameOver = false

    // get game constants from input boxes 
    const nrows = document.getElementById("width").value
    const ncols = document.getElementById("height").value
    const nmines = document.getElementById("mines").value

    // reset current board
    let cells = qsa('.row')
    for(let i = 0; i < cells.length; i++) {
      cells[i].remove()
    }

    // if inputs are valid
    if(checkInputs(nrows, ncols, nmines)) {

      // lock inputs as the game has stared
      updateInputs(true)

      //create the board

      //create row divs
      for(let i = 0; i < nrows;i++) {
        let row = document.createElement("div")
        row.classList.add("row")
        document.getElementById("grid").appendChild(row)
      }

      //populate rows with cells
      for(let i = 0;  i < ncols; i++) {
        for(let j = 0; j < nrows; j++) {
          console.log("create cell")
          initializeCell(j,i)
        }
      }
    }
  }

  /**
   * Validates user inputs to make sure they are valid values for a new game.
   * If inputs are invalid, shows a helpful message on the page.
   * 
   * @param {int} nrows 
   * @param {int} ncols 
   * @param {int} nmines 
   * @return {boolean} - false if inputs are invalid, otherwise true. 
   */
  function checkInputs(nrows, ncols, nmines) {
    //check rows
    if (nrows <=  0) {
      showMessage('Invalid Inputs')
      return false
    }
    //check columns
    if(ncols <= 0) {
      showMessage('Invalid Inputs')
      return false
    }
    //check number of mines
    if(nmines <= 0 && nmines >= nrows*ncols) {
      showMessage('Invalid Inputs')
      return false
    }
    return true
  }

  /**
   * Creates a cell for the given row and column position. Each
   * cell is assigned a unique id in the format <row>_<col> 
   * 
   * @param {int} row - row position for new cell
   * @param {int} col - column position for new cell
   * @return {Object} new cell DOM Object (div.cell)
   */
  function initializeCell(row, col) {

    // get list of all row divs 
    let row_div = document.querySelectorAll(".row")
    // create new cell
    let cell = document.createElement("div")
    
    // add to cell classlist and give unique ID
    cell.classList.add("cell")
    cell.id = row+"_"+col

    // add as child to parent row
    row_div[row].appendChild(cell)

    // call makeMove function on click
    cell.addEventListener("click", makeMove);
    
    // call flagcell function on right click
    cell.addEventListener('contextmenu', evt => {
      evt.preventDefault();
      flagCell(cell.id)
    })

    return cell
    
  }

  /**
   * Assign mines after first cell is selected. This ensures that a player cannot
   * select a mine on their first move (an implementation requirement of the game).
   *
   * @param {str} firstID - ID of first cell clicked.
   */
  function randomlyAssignMines(firstID) {

    // create a list of mines
    let mines = []
    // append the firstID so mine cannot be generated on the first cell
    mines.push(firstID)


    // get values of const of board
    let nmines =  document.getElementById('mines').value
    let nrows = document.getElementById("width").value
    let ncols = document.getElementById("height").value

    // generate the mine positions
    let count = 0;
    while(count <= nmines) {

      // get a random location using randomInt function
      let location = document.getElementById(randomInt(nrows)+"_"+randomInt(ncols))
      // if location has already been chosen continue  
      if(mines.includes(location)){
        continue
      }
      else {
        // add location to the list
        mines.push(location)
        count = count + 1
      }
    }
    // for each of the cells chosen add mine class
    for(let i = 2; i < mines.length; i ++) {
      mines[i].classList.add("mine")
    }

  }

  /**
   * Returns number of neighboring mines for cell with given id.
   * 
   * @param {str} cellId - id of cell to find neighbors for, in format: <row>_<col>
   * @return {str[]} - list of neighboring mine ids (at most 8 neighbors).
   */
  function calculateNeighborMineCounts(cellId) {

    // get list of neighbors
    let neighbors = getNeighbors(cellId)
    let nmine = 0


    // loop over each of the cells
    for(let i = 0; i < neighbors.length; i ++) {
      // if the cell has a mine increment the nmine variable
      if(document.getElementById(neighbors[i]).classList.contains("mine")) {
        nmine = nmine + 1
      }
    }
    return nmine;
  }

  /**
   * Processes a move on a cell.
   * 
   * If the cell was already opened, or the game is over, does nothing.
   * If the move is the first move played in the game, marks the cell
   * as opened and assigns initial mines for the game.
   * If the move otherwise causes the game to finish, updates game appropriately.
   * Otherwise, marks the cell as opened and updates neighbors.
   */
  
  function makeMove() {

    // get the cell object which was clicked on
    let cell = this
    
    // if the cell has already been opened
    if(cell.classList.contains('opened')) {
      return
    }

    // assign mines if it is the first move
    if(moveCount == 0 ){
      randomlyAssignMines(cell)
    }
    // if a flagged cell is clicked 
    if(cell.classList.contains('flagged')) {
      cell.classList.remove('flagged')
    }

    // increment the move count variable
    moveCount = moveCount + 1
    // open the cell
    cell.classList.add("opened")
    
    // check if the game is over
    if (checkGameOver(cell)) {
      return
    }
    // call display neighbors function 
    else {
      displayNeighbors(cell)
    }

  }

  /**
   * Updates cell to be "opened" if not already opened, and recursively opens all neighbors of cell
   * if given cell does not have neighboring mines. If the cell has neighboring mines,
   * displays the count of mine neighbors in the cell.
   * 
   * @param {Object} cell - DOM object of selected cell.
   */
  function displayNeighbors(cell) {
    // open cell
    cell.classList.add("opened")

    // if the cell has no neighboring mines recursively call this function
    if(calculateNeighborMineCounts(cell.id) == 0) {
      // get list of neighbors
      let neighbors = getNeighbors(cell.id)
      // use timeout function for 200 ms delay
      setTimeout(function () {

        for(let i = 0; i < neighbors.length; i ++) {
          // for every unopened neighbor recursively call this function
          if(!(document.getElementById(neighbors[i]).classList.contains("opened"))) {
            displayNeighbors(document.getElementById(neighbors[i]))
          }
        }
      }, 200);
    }
    else {
      // update the cell with the number of boarding mines
      if(!cell.classList.contains('mine')){
        cell.textContent = calculateNeighborMineCounts(cell.id)

      }
    }
  }

  /**
   * Checks to see if the game is over after the given cell is selected. 
   * If the selected cell was a mine, the player loses.
   * If the selected cell was otherwise the last non-mine cell to be opened,
   * the player wins.
   * Otherwise, the game is not yet over.
   * 
   * @param {Object} cell - DOM object of selected cell.
   */
  function checkGameOver(cell) {
    // if play clicks on a mine game ends
    if(cell.classList.contains('mine')) {
      document.getElementById('result').textContent = "Game Over! Total Moves: "+ moveCount

    }
    // call game won function
    else if(gameWon()) {
      document.getElementById('result').textContent = "Victory! Total Moves: "+ moveCount
    }
    else {
      return
    }

    // reset the game
    isGameOver = true
    // enable inputs again
    updateInputs(false)
    let cells = document.querySelectorAll('.cell')
    // remove cell event listeners so user can no longer click on board
    for(let i = 0; i < cells.length; i++) {
      cells[i].removeEventListener('click', makeMove)
    }
    
  }

  /**
   * Returns true if the game is won (when all non-mine cells are opened on the board).
   * 
   * @return {boolean} - true if the game is won, otherwise false.
   */
  function gameWon() {

    // get list of all the cells
    let cells = document.querySelectorAll(".cell")


    for(let i = 0; i < cells.length; i++) {
      // for every cell check that every cell which does not have a mine has been opened
      if(!cells[i].classList.contains('mine') && !cells[i].classList.contains('opened')) {
        return false
      }
    }
    return true
  }

  /**
   * Toggles the flag state for this cell if the game is not over and the cell isn't 
   * opened already.
   * 
   * @param {str} id - ID of clicked cell.
   */
  function flagCell(cellId) {
    // get dom object of cell
    let cell = document.getElementById(cellId)
    // do nothing if game is already over
    if(isGameOver) {
      return
    }
    // do nothing if cell is already opened
    else if (cell.classList.contains('opened')) {
      return
    }
    // if already flagged then unflag
    else if (cell.classList.contains('flagged')) {
      cell.classList.remove('flagged')
    }
    // if not yet flagged then flag
    else {
      cell.classList.add('flagged')
    }
  }

  /* ------------------------------ Helper Functions ------------------------------ */
  /**
   * Get list of neighboring cell IDs, used for counting mines in neighboring cells
   *
   * @param {str} cellId ID of selected cell
   */
  function getNeighbors(cellId) {
    let ncols = id("width").value; // ncols = width, nrows = height
    let nrows = id("height").value;
    let cellRow = parseInt(cellId.split("_")[0])
    let cellCol = parseInt(cellId.split("_")[1])
    let neighborIds = []
    for (let row = Math.max(cellRow - 1, 0); row <= Math.min(cellRow + 1, nrows - 1); row++) {
      for (let col = Math.max(cellCol - 1, 0); col <= Math.min(cellCol + 1, ncols - 1); col++) {
        let neighborId = row + "_" + col;
        neighborIds.push(neighborId);
      }
    }
    return neighborIds;
  }

  /**
   * Returns a random int from [0, max).
   * @param {int} max - exclusive max value for random range.
   * @return {int} - random int from [0, max]
   */
  function randomInt(max) {
    // Math.floor causes upperbound to be exclusive
    return Math.floor(Math.random() * (max + 1));
  }

  /**
   * Updates the inputs for game options. If disable is true, disables them
   * for a new game. Otherwise re-enables them for a user to provide new values
   * for a new game.
   * 
   * @param {boolean} disable - whether to disable the inputs and play button.
   */
  function updateInputs(disable) {
    id("width").disabled = disable;
    id("height").disabled = disable;
    id("mines").disabled = disable;
    id("play").disabled = disable;
  }

  /**
   * Show message in result paragraph element on main page
   * @param {string} msg input message
   */
  function showMessage(msg) {
    id("result").textContent = msg;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }
})();
