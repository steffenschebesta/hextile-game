const gameBoard = document.getElementById('gameBoard');
const cheatModeEl = document.getElementById('cheatMode');
const initialPlaceholder = document.getElementById('initialPlaceholder');
const tilePreview = document.getElementById('tilePreview');
const endTurnButton = document.getElementById('endTurn');
const superCheatButton = document.getElementById('superCheat');
const currentTurnEl = document.getElementById('currentTurn');
const rotateTileRightButton = document.getElementById('rotateTileRight');
const rotateTileLeftButton = document.getElementById('rotateTileLeft');
const player1ScoreEl = document.getElementById('player1Score');
const player2ScoreEl = document.getElementById('player2Score');
const player1El = document.getElementById('player1');
const player2El = document.getElementById('player2');
const tileColors = ['lightblue', 'lightgreen', 'lightsalmon', 'lightyellow', 'lightpink', 'lightgray'];
const startTile = {
  row: 10,
  col: 10,
  numbers: [1, 2, 3, 4, 5, 6]
}
const tileNumberPool = [1, 2, 3, 4, 5, 6];
const targetScore = 101;
let cheatMode = false;
let placedTiles = [];

let currentPlayer = 2; // will be switched to 1 in init
let currentTurn = 0;
let player1Score = 0;
let player2Score = 0;
let currentTile = null;
let currentTileNumbers = [];

function generateTile(numbers, points, row, col) {
  const tile = document.createElement('div');
  tile.className = 'hex';

  if (typeof numbers === 'undefined') {
    numbers = Array.from({ length: 6 }, () => tileNumberPool[Math.floor(Math.random() * tileNumberPool.length)]);
  }

  numbers.forEach((num, index) => {
    const numberEl = document.createElement('div');
    numberEl.className = 'number';
    numberEl.dataset.pos = index + 1;
    numberEl.style.backgroundColor = tileColors[num - 1];
    const digitEl = document.createElement('div');
    digitEl.className = 'digit';
    digitEl.textContent = num;
    numberEl.appendChild(digitEl);
    tile.appendChild(numberEl);
  });

  if (typeof points !== 'undefined') {
    const pointsEl = document.createElement('div');
    pointsEl.className = 'points';
    pointsEl.textContent = points;
    tile.appendChild(pointsEl)
  }

  if (typeof row !== 'undefined') {
    tile.style.gridRow = row;
    if (row % 2 == 1) {
      tile.className = 'hex odd-row';
    }
    else {
      tile.className = 'hex even-row';
    }
  }
  if (typeof col !== 'undefined') {
    tile.style.gridColumn = col;
  }

  return { tile, numbers };
}


function placeTile(row, col, placeholder, tile) {
  const matches = validatePlacement(row, col, currentTileNumbers);
  if (matches.valid) {

    if (typeof tile === 'undefined') {
      tile = generateTile(currentTileNumbers, undefined, row, col).tile;
    }

    placeholder.replaceWith(tile);
    calculateScore(matches.edges, matches.numbers);
    let newTile = {
      row: row,
      col: col,
      numbers: currentTileNumbers
    }

    placedTiles.push(newTile);
    currentTile = null;
    endTurn();
  }
}

function highlightValidPlacements() {

  const directionsEven = [
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ];

  const directionsOdd = [
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
  ];



  placedTiles.forEach(tile => {
    const row = tile.row;
    const col = tile.col;
    let directions = directionsEven;
    if (row % 2 == 1) {
      directions = directionsOdd;
    }

    directions.forEach(dir => {
      const newRow = row + dir.row;
      const newCol = col + dir.col;
      const existing = [...placedTiles].some(t => t.row == newRow && t.col == newCol);

      if (!existing) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder even-row';
        placeholder.style.gridRow = newRow;
        placeholder.style.gridColumn = newCol;
        placeholder.dataset.row = newRow;
        placeholder.dataset.col = newCol;
        if (newRow % 2 == 1) {
          placeholder.className = 'placeholder odd-row';
        }
        placeholder.addEventListener('click', () => placeTile(newRow, newCol, placeholder));
        if (cheatMode) {
          placeholder.addEventListener('mouseenter', () => suggestMove(newRow, newCol, placeholder));
        }
        gameBoard.appendChild(placeholder);
      }
    });
  });
}

function suggestMove(row, col, placeholder) {
  let moveOptions = currentTileNumbers;
  let winnerMove = {};
  let highestScore = 0;
  for (let i = 0; i < 6; i++) {
    let placement = validatePlacement(row, col, moveOptions);
    if (placement.valid) {
      const score = placement.edges * placement.numbers.reduce((a, b) => a + b, 0);
      if (score > highestScore) {
        winnerMove = {
          'placement': validatePlacement(row, col, moveOptions),
          'tileNumbers': moveOptions.flat(),
          'score': score
        };
        highestScore = score;
      }
    }
    moveOptions.unshift(moveOptions.pop());
  }
  if (highestScore > 0) {
    const suggestion = generateTile(winnerMove.tileNumbers, highestScore, row, col);
    let suggestionTile = suggestion.tile;

    suggestionTile.classList.add('suggestion');
    placeholder.replaceWith(suggestionTile);

    suggestionTile.addEventListener('mouseleave', () => {
      suggestionTile.replaceWith(placeholder)
    });
    suggestionTile.addEventListener('click', () => {
      currentTileNumbers = winnerMove.tileNumbers;
      placeTile(row, col, suggestionTile);
    });
  }
}

function validatePlacement(row, col, tileNumbers) {
  const directionsOdd = [
    { row: -1, col: 1, posIndex: 0 },
    { row: 0, col: 1, posIndex: 1 },
    { row: 1, col: 1, posIndex: 2 },
    { row: 1, col: 0, posIndex: 3 },
    { row: 0, col: -1, posIndex: 4 },
    { row: -1, col: 0, posIndex: 5 },
  ];
  const directionsEven = [
    { row: -1, col: 0, posIndex: 0 },
    { row: 0, col: 1, posIndex: 1 },
    { row: 1, col: 0, posIndex: 2 },
    { row: 1, col: -1, posIndex: 3 },
    { row: 0, col: -1, posIndex: 4 },
    { row: -1, col: -1, posIndex: 5 },
  ];

  let directions = row % 2 == 1 ? directionsOdd : directionsEven;

  const correspondingEdges = [3, 4, 5, 0, 1, 2];

  let neighborTiles = [];
  let matchingEdges = 0;
  let matchingEdgesNumbers = [];

  placedTiles.forEach((placedTile) => {
    directions.forEach((direction) => {
      if ((placedTile.row + direction.row) == row &&
        (placedTile.col + direction.col) == col) {
        let matchingTile = {
          'tile': placedTile,
          'edgeIndex': direction.posIndex
        }
        neighborTiles.push(matchingTile);
      }
    });

  });

  neighborTiles.forEach((neighborTile) => {
    if (tileNumbers[correspondingEdges[neighborTile.edgeIndex]] == neighborTile.tile.numbers[neighborTile.edgeIndex]) {
      matchingEdges++;
      matchingEdgesNumbers.push(tileNumbers[correspondingEdges[neighborTile.edgeIndex]]);
    }
  });

  let isValid = neighborTiles.length == matchingEdges;
  if (neighborTiles.length == 0 && matchingEdges == 0){ // First tile
    matchingEdgesNumbers = currentTileNumbers;
  }
  return { 'valid': isValid, 'edges': matchingEdges, 'numbers': matchingEdgesNumbers };
}

function calculateScore(matchingEdges, matchingEdgesNumbers) {
  const score = matchingEdges * matchingEdgesNumbers.reduce((a, b) => a + b, 0);
  if (currentPlayer === 1) {
    player1Score += score;
    player1ScoreEl.textContent = player1Score + ` (+${score})`;
  } else {
    player2Score += score;
    player2ScoreEl.textContent = player2Score + ` (+${score})`;
  }
}

function endTurn() {
  const placeholders = document.querySelectorAll('.placeholder');
  placeholders.forEach(placeholder => placeholder.remove());
  const suggestions = document.querySelectorAll('.suggestion');
  suggestions.forEach(suggestion => suggestion.remove());
  tilePreview.innerHTML = '';
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  if (currentPlayer === 1) {
    player1El.classList.add('active');
    player2El.classList.remove('active');
  }
  else {
    player2El.classList.add('active');
    player1El.classList.remove('active');
  }
  if (player1Score >= targetScore || player2Score >= targetScore) {
    let winner = player1Score >= targetScore ? 'Player 1' : 'Player 2';
    alert(`${winner} wins in ${currentTurn} turns!`);
  }
  else {
    drawTile();
    if (currentPlayer === 1) {
      currentTurn++;
      currentTurnEl.innerText = currentTurn;
    }
  } 
}

function rotateTileRight() {
  if (!currentTile) return;
  currentTileNumbers.unshift(currentTileNumbers.pop());
  const numberElements = currentTile.querySelectorAll('.number');
  numberElements.forEach((el, i) => {
    const digitEl = document.createElement('div');
    digitEl.className = 'digit';
    digitEl.textContent = currentTileNumbers[i];
    el.firstChild.remove()
    el.style.backgroundColor = tileColors[currentTileNumbers[i] - 1];
    el.appendChild(digitEl);
  });
}

function rotateTileLeft() {
  if (!currentTile) return;
  currentTileNumbers.push(currentTileNumbers.shift());
  const numberElements = currentTile.querySelectorAll('.number');
  numberElements.forEach((el, i) => {
    const digitEl = document.createElement('div');
    digitEl.className = 'digit';
    digitEl.textContent = currentTileNumbers[i];
    el.firstChild.remove()
    el.style.backgroundColor = tileColors[currentTileNumbers[i] - 1];
    el.appendChild(digitEl);
  });
}

function init() { 
  currentTileNumbers = startTile.numbers;
  let firstTile = generateTile(currentTileNumbers, undefined, startTile.row, startTile.col).tile;
  placeTile(startTile.row, startTile.col, initialPlaceholder, firstTile);
}

function drawTile(){
  if (currentTile) return;

  const { tile, numbers } = generateTile();
  currentTile = tile;
  currentTileNumbers = numbers;
  highlightValidPlacements();
  tilePreview.appendChild(tile);
}

endTurnButton.addEventListener('click', () => {
  if (currentTile) {
    
    currentTile = null;
  }
  endTurn();
});

superCheatButton.addEventListener('click', () => {
  const ph = document.querySelectorAll('.placeholder');
  ph.forEach(function(p){
    suggestMove(parseInt(p.dataset.row), parseInt(p.dataset.col), p);
  });
});

rotateTileRightButton.addEventListener('click', rotateTileRight);
rotateTileLeftButton.addEventListener('click', rotateTileLeft);
cheatModeEl.addEventListener('change', (event) => {
  cheatMode = event.target.checked;
});



init();