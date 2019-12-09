function printMat(mat) {
  var strHTML = '';
  for (var i = 0; i < mat.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < mat[0].length; j++) {
      // var currCell = mat[i][j];
      var className = `cell${i}-${j} cell`;

      strHTML += `<td class="${className}" onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="flagCell({i: ${i}, j: ${j}})"> <span> </span></td>`;
    }
    strHTML += '</tr>';
  }
  var elContainer = document.querySelector('tbody');
  elContainer.innerHTML += strHTML;
}

function updateTimer() {
  gSecCount++;
  if (gSecCount === 60) {
    gSecCount = 0;
    gMinCount++;
  }
  var strHTML = `${gMinCount}:${gSecCount}`;
  var elTimer = document.querySelector('.timer');
  elTimer.innerText = strHTML;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getClassName(location) {
  var cellClass = `cell${location.i}-${location.j}`;
  return cellClass;
}

function renderCell(location) {
  var currCell = gBoard[location.i][location.j];
  var cellSelector = '.' + getClassName(location);
  var elCell = document.querySelector(cellSelector);
  elCell.classList.add('show');
  // If the cell is a mine
  if (currCell.isMine) elCell.innerHTML = MINE_IMG;
  // if the cell is'nt a mine, but has more than zero mine neighbors
  else if (currCell.mineNegsCount !== 0) elCell.innerText = currCell.mineNegsCount;
}

function findRandomCel() {
  var mineIdxI = getRandomInt(0, gBoard.length - 1);
  var mineIdxJ = getRandomInt(0, gBoard[0].length - 1);
  var location = { i: mineIdxI, j: mineIdxJ };
  return location;
}