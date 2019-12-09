'use strict'
document.oncontextmenu = function () {
    return false;
}

var easyGame = {
    boardLength: 4,
    boardHeight: 4,
    mineAmount: 2
};
var intermediateGame = {
    boardLength: 8,
    boardHeight: 8,
    mineAmount: 12
};
var hardGame = {
    boardLength: 12,
    boardHeight: 12,
    mineAmount: 30
};
var customGame = {
    boardLength: undefined,
    boardHeight: undefined,
    mineAmount: undefined
};

var gGameMode = hardGame;
var gBoard;
var nextXlickIsHint = false;
var gSecCount = 0;
var gMinCount = 0;
var gLivesAmount = 3;
var gSafeClickAmount = 3;
var gHintAmount = 3;
var gGameIsOn;
var WIN = true;
var LOSE = false;
var gTimerInterval;
var MINE_IMG = '<img src="img/mine.png" width="20">';
var FLAG_IMG = '<img src="img/flag.png" width="16.8">';
var GAME_ON_IMG = '<img src="img/game on.png" style="width:35px">';
var GAME_WON_IMG = '<img src="img/game won.png">';
var GAME_LOST_IMG = '<img src="img/game lost.png">';
var expandedCellsMap = {};


function initGame() {
    // Making sure the first click will be accepted as a first click
    gGameIsOn = false;
    // Make sure there is no board from past games
    var elTBody = document.querySelector('tbody');
    elTBody.innerHTML = '';
    // Create a basic empty board
    buildEmptyBoard();
    // Put the smiley face
    var elGameState = document.querySelector('.game-state');
    elGameState.innerHTML = GAME_ON_IMG;
    // Hide the replay button
    // var elReplayButton = document.querySelector('.replay-button');
    // elReplayButton.classList.add('hide');
    // Reset the timer
    gMinCount = 0;
    gSecCount = 0;
    var elTimer = document.querySelector('.timer');
    elTimer.innerText = gMinCount + ':' + gSecCount;
    // Reset to 3 safe clicks
    gSafeClickAmount = 3;
    var elSafeClickSpan = document.querySelector('.safe-click-button span');
    elSafeClickSpan.innerText = gSafeClickAmount;
    // Reset to 3 lives
    gLivesAmount = 3;
    var elLivesCountSpan = document.querySelector('.lives-remaining span');
    elLivesCountSpan.innerText = gLivesAmount;
    // Reset to 3 hints
    for (var i = 0; i < 4; i++) {
        var elHint = document.querySelector('.hide');
        // Only if elHint has been found...
        if (elHint) {
            elHint.classList.add('exist');
            elHint.classList.remove('hide');
        }
    }
    // render the model board to the DOM
    printMat(gBoard)
}

function buildEmptyBoard() {
    var newBoard = [];
    for (var i = 0; i < gGameMode.boardLength; i++) {
        var currRow = [];
        newBoard.push(currRow);
        for (var j = 0; j < gGameMode.boardHeight; j++) {
            var currCell = {
                mineNegsCount: 0,
                isShow: false,
                isMine: false,
                isFlagged: false
            };
            newBoard[i].push(currCell);
        }
    }
    gBoard = newBoard;
}

function fillBoard(firstCellLocation) {
    // Create mines
    for (var m = 0; m < gGameMode.mineAmount; m++) {
        randomlyCreateMine(firstCellLocation);
    }
    // Create nums
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j];
            currCell.mineNegsCount = calcMineNegsAmount(i, j);
        }
    }
}

function cellClicked(elCell, iIdx, jIdx) {
    var cellLocation = { i: iIdx, j: jIdx };
    // If this is a hint click
    if (nextXlickIsHint) {
        nextXlickIsHint = false;
        // Change the cursor back to default
        var elCells = document.querySelectorAll('.cell');
        for (var i = 0; i < elCells.length; i++) {
            elCells[i].style.cursor = "default";
        }
        // Show neighbors for a moment and hide them again
        showNegsForMoment(iIdx, jIdx);
        return;
    }
    // If the cell is flagged or is shown, do nothing
    if (gBoard[iIdx][jIdx].isFlagged || gBoard[iIdx][jIdx].isShow) return;
    // Check if this is the first click
    if (!gGameIsOn) {
        gTimerInterval = setInterval(updateTimer, 1000);
        gGameIsOn = !gGameIsOn;
        // renderCell({i: i, j: j});
        gBoard[iIdx][jIdx].isShow = true;
        fillBoard(cellLocation);
        expand(iIdx, jIdx);
        // revealNegs(i, j);
        return;
    }
    // Check if the cell is a mine
    if (gBoard[iIdx][jIdx].isMine) {
        // update the lives count
        gLivesAmount--;
        var elLivesCountSpan = document.querySelector('.lives-remaining span');
        elLivesCountSpan.innerText = gLivesAmount;
        if (gLivesAmount > 0) {
            giveAnotherChance();
        }
        else gameOver(LOSE);
    }
    // cell is not a mine or a flag...
    else {
        // If the cell has some mine neighbors
        if (gBoard[iIdx][jIdx].mineNegsCount !== 0) {
            renderCell(cellLocation);
            gBoard[iIdx][jIdx].isShow = true;
        }
        // If the cell has zero mine neighbors
        else expand(iIdx, jIdx);
        // else revealNegs(i, j);
    }
    // Check if the user won or lost the game
    checkIfWin();
}

function flagCell(location) {
    var cellSelector = '.' + getClassName(location);
    var elCell = document.querySelector(cellSelector);
    // If cell has already been clicked, do nothing
    if (elCell.classList.contains('show')) return;
    // If cell has already been flagged
    if (gBoard[location.i][location.j].isFlagged) {
        elCell.innerHTML = "";
        gBoard[location.i][location.j].isFlagged = false;
    }
    // flag the cell
    else {
        elCell.innerHTML = FLAG_IMG;
        gBoard[location.i][location.j].isFlagged = true;
        // Check if win
        checkIfWin();
    }
}

function randomlyCreateMine(exept) {
    // Find random cell
    var location = findRandomCel();
    var mineIdxI = location.i;
    var mineIdxJ = location.j;
    // Check if random cell is valid to hold a mine
    var minePosIsValid = true;
    for (var i = exept.i - 1; i <= exept.i + 1; i++) {
        // Skip cells that are outside the board
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = exept.j - 1; j <= exept.j + 1; j++) {
            // Skip cells that are outside the board
            if (j < 0 || j >= gBoard[0].length) continue;
            /* If the potential position for the mine is around the exept cell or
               If the potential position has already been taken by an earlier placed mine
               Re-enter this function until a valid position will be found */
            if ((mineIdxI === i && mineIdxJ === j) || gBoard[i][j].isMine) {
                minePosIsValid = false;
                break;
            }
        }
    }
    if (minePosIsValid) gBoard[mineIdxI][mineIdxJ].isMine = true;
    else randomlyCreateMine(exept);
}

function calcMineNegsAmount(iIdx, jIdx) {
    var count = 0;
    for (var i = iIdx - 1; i <= iIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = jIdx - 1; j <= jIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue;
            var currCell = gBoard[i][j];
            if (currCell.isMine) count++;
        }
    }
    return count;
}

function revealNegs(iIdx, jIdx) {
    for (var i = iIdx - 1; i <= iIdx + 1; i++) {
        // make sure we're not checking a cell outside of the board
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = jIdx - 1; j <= jIdx + 1; j++) {
            // make sure we're not checking a cell outside of the board
            if (j < 0 || j > gBoard[0].length - 1) continue;
            var currCell = gBoard[i][j];
            // If the cell is a mine or is flagged...
            if (currCell.isMine || currCell.isFlagged) continue;
            // Otherwise - cell is'nt flagged or is a mine...
            gBoard[i][j].isShow = true;
            renderCell({ i: i, j: j });
        }
    }
}

function expand(iIdx, jIdx) {
    // Add this cell to the map object
    var propertyName = `${iIdx}-${jIdx}`;
    expandedCellsMap[propertyName] = 1;
    for (var i = iIdx - 1; i <= iIdx + 1; i++) {
        // make sure we're not checking a cell outside of the board
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = jIdx - 1; j <= jIdx + 1; j++) {
            // make sure we're not checking a cell outside of the board
            if (j < 0 || j > gBoard[0].length - 1) continue;
            // Show the cell
            gBoard[i][j].isShow = true;
            renderCell({ i: i, j: j });
            // If the cell has zero mine neighbors, call this function again for it
            if (gBoard[i][j].mineNegsCount === 0 && !expandedCellsMap[`${i}-${j}`]) expand(i, j);
        }
    }
}

function hintClicked() {
    // If the game isn't running, do nothing
    if (!gGameIsOn) return;
    // Make sure next click will be accepted as a hint click
    nextXlickIsHint = true;
    // Change how the cursor looks to indicate that the next click will be a use of the hint
    var elCells = document.querySelectorAll('.cell');
    for (var i = 0; i < elCells.length; i++) {
        elCells[i].style.cursor = "help";
    }
    // Hide one hint
    var elHint = document.querySelector('.exist');
    elHint.classList.remove('exist');
    elHint.classList.add('hide');
}

function showNegsForMoment(iIdx, jIdx) {
    // Loop through neighbors
    for (var i = iIdx - 1; i <= iIdx + 1; i++) {
        // make sure we're not checking a cell outside of the board
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = jIdx - 1; j <= jIdx + 1; j++) {
            // make sure we're not checking a cell outside of the board
            if (j < 0 || j > gBoard[0].length - 1) continue;
            // show neighbors for a moment and then hide them again
            renderCell({i: i, j: j});
            setTimeout(coverCell, 2000, {i: i, j: j});
        }
    }
}

function coverCell(location) {
    var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
    // Remove 'show' class
    elCell.classList.remove('show');
    elCell.innerText = '';
}

function checkIfWin() {
    // Check if the user won the game
    var isWin = true;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j];
            // console.log(i, j, 'isMine;', currCell.isMine, 'isShow:', currCell.isShow);
            // If there still is a mine cell that hasn't been flagged
            if (currCell.isMine && !currCell.isFlagged) {
                isWin = false;
            }
            // If there is a non-mine cell that hasn't been clicked
            if (!currCell.isMine && !currCell.isShow) {
                isWin = false;
            }
        }
    }
    if (isWin) gameOver(WIN);
}

function showSafeClick() {
    // If there are no safe clicks left, do nothing
    if (gSafeClickAmount === 0) return;
    // Find a random cell
    var location = findRandomCel();
    var safeClickIdxI = location.i;
    var safeClickIdxJ = location.j;
    var randCell = gBoard[safeClickIdxI][safeClickIdxJ];
    // Check if the cell is fits the safe-click criteria
    var locationIsValid = true;
    // If the cell is already shown
    if (randCell.isShow) locationIsValid = false;
    // If the cell is a mine
    if (randCell.isMine) locationIsValid = false;


    // If the location is valid, mark that cell for 3 seconds
    if (!locationIsValid) {
        showSafeClick();
        // If the location is valid, mark that cell for 3 seconds
    } else {
        var className = getClassName(location);
        var elCell = document.querySelector(`.${className}`);
        elCell.classList.add('safe-click-mark');
        setTimeout(() => elCell.classList.remove('safe-click-mark'), 3000);
        // Extract 1 safe click
        gSafeClickAmount--;
        // Update the safe click button
        var elSafeClickSpan = document.querySelector('.safe-click-button span');
        elSafeClickSpan.innerText = gSafeClickAmount;
    }
}

function giveAnotherChance() {
    // Make the entire background blink
    var elBody = document.querySelector('body');
    elBody.classList.add('another-chance');
    setTimeout(() => {
        elBody.classList.remove('another-chance');
        // Make the lives count section blink
        var elLivesCount = document.querySelector('.lives-remaining');
        elLivesCount.classList.add('another-chance');
        setTimeout(() => elLivesCount.classList.remove('another-chance'), 500)
    }, 250);

}

function gameOver(type) {
    // End the game
    gGameIsOn = !gGameIsOn;
    // stop timer
    clearInterval(gTimerInterval);
    // Disable clicking on cells
    for (var i = 0; i < gBoard.length; i++) {
        // make sure we're not checking a cell outside of the board
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = 0; j < gBoard[0].length; j++) {
            // make sure we're not checking a cell outside of the board
            if (j < 0 || j > gBoard[0].length - 1) continue;
            var currCell = gBoard[i][j];
            currCell.isShow = true;
        }
    }
    // Lost
    if (!type) {
        console.log('You Lost');
        // show all mines
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                if (gBoard[i][j].isMine) {
                    renderCell({ i: i, j: j });
                }
            }
        }
        // Change the smiley face
        var elGameState = document.querySelector('.game-state');
        elGameState.innerHTML = GAME_LOST_IMG;
    }
    // Won
    if (type) {
        console.log('You Won');
        // Change the smiley face
        var elGameState = document.querySelector('.game-state');
        elGameState.innerHTML = GAME_WON_IMG;
    }
}

function customButtonClicked() {
    // Display elements
    var elRowCount = document.getElementById('rowCount');
    elRowCount.type = Text;
    var elColCount = document.getElementById('colCount');
    elColCount.type = Text;
    var elMineAmount = document.getElementById('mineAmount');
    elMineAmount.type = Text;
    var elGoButton = document.querySelector('.go');
    elGoButton.style.display = 'inline';
}

function CreateCustom() {
    var elRowCount = document.getElementById('rowCount');
    customGame.boardLength = elRowCount.value;
    var elColCount = document.getElementById('colCount');
    customGame.boardHeight = elColCount.value;
    var elMineAmount = document.getElementById('mineAmount');
    customGame.mineAmount = elMineAmount.value;
    gGameMode = customGame;
    // Hide all the elements
    elRowCount.type = 'hidden';
    elColCount.type = 'hidden';
    elMineAmount.type = 'hidden';
    var elGoButton = document.querySelector('.go');
    elGoButton.style.display = 'none';
    // Initialize the game
    initGame();
}


// And if and if and if...
// And if the safta had galgalim...