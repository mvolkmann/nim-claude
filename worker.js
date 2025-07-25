export default {
  async fetch(request, env, ctx) {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nim Game</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
    <style>
      body {
        background-color: #f0f0f0;
        font-family: Arial, sans-serif;
        margin: 0 auto;
        max-width: 50rem;
        padding: 1.5rem;
      }

      .column-controls {
        align-items: center;
        display: flex;
        gap: 0.5rem;
      }

      .column-controls button {
        background-color: #dc3545;
        border: none;
        border-radius: 0.5rem;
        color: white;
        cursor: pointer;
        padding: 0.5rem 1rem;
      }

      .column-controls button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      .column-controls button:hover {
        background-color: #c82333;
      }

      .column-controls input {
        border: 0.125rem solid #ddd;
        border-radius: 0.5rem;
        padding: 0.5rem;
        width: 4rem;
      }

      .computer-thinking {
        color: #ffc107;
      }

      .current-player {
        color: #007bff;
      }

      .game-board {
        display: none;
      }

      .game-container {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        padding: 2rem;
      }

      .game-status {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 1.5rem 0;
        text-align: center;
      }

      h1 {
        color: #333;
        margin-bottom: 2rem;
        text-align: center;
      }

      .item {
        background-color: #28a745;
        border: 0.125rem solid #155724;
        border-radius: 50%;
        cursor: pointer;
        height: 2rem;
        transition: all 0.2s;
        width: 2rem;
      }

      .item:hover {
        background-color: #dc3545;
        border-color: #721c24;
        transform: scale(1.1);
      }

      .item.clickable:hover {
        background-color: #dc3545;
        border-color: #721c24;
        box-shadow: 0 0.125rem 0.5rem rgba(220, 53, 69, 0.3);
        transform: scale(1.1);
      }

      .item.selected {
        background-color: #ffc107;
        border-color: #856404;
      }

      .items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1.5rem 0;
      }

      .restart-btn {
        background-color: #28a745;
        border: none;
        border-radius: 0.5rem;
        color: white;
        cursor: pointer;
        display: block;
        font-size: 1rem;
        margin: 1.5rem auto;
        padding: 0.5rem 1.5rem;
      }

      .restart-btn:hover {
        background-color: #218838;
      }

      .setup {
        margin-bottom: 2rem;
        text-align: center;
      }

      .setup button {
        background-color: #007bff;
        border: none;
        border-radius: 0.5rem;
        color: white;
        cursor: pointer;
        font-size: 1rem;
        margin: 0 0.5rem;
        padding: 0.5rem 1.5rem;
      }

      .setup button:hover {
        background-color: #0056b3;
      }

      .winner {
        color: #28a745;
        font-size: 1.5rem;
      }
    </style>
  </head>
  <body>
    <div class="game-container">
      <h1>Nim Game</h1>

      <div class="setup" id="setup">
        <p>Choose who goes first:</p>
        <button onclick="startGame('human')">Human First</button>
        <button onclick="startGame('computer')">Computer First</button>
      </div>

      <div class="game-board" id="gameBoard">
        <div class="game-status" id="gameStatus">
          <span class="current-player">Your turn</span>
        </div>
        <div class="items" id="items0"></div>
        <div class="items" id="items1"></div>
        <div class="items" id="items2"></div>
        <button class="restart-btn" onclick="restartGame()">New Game</button>
      </div>
    </div>

    <script>
      let gameState = {
        columns: [3, 5, 7],
        computerMove: false,
        gameOver: false,
      };

      // Cache DOM elements.
      const elements = {
        setup: document.getElementById("setup"),
        gameBoard: document.getElementById("gameBoard"),
        gameStatus: document.getElementById("gameStatus"),
        statusSpan: document.getElementById("gameStatus").querySelector("span"),
        items: [
          document.getElementById("items0"),
          document.getElementById("items1"),
          document.getElementById("items2"),
        ],
      };

      function calculateOptimalMove() {
        function nimSum(columns) {
          return columns.reduce((sum, count) => sum ^ count, 0);
        }

        const currentNimSum = nimSum(gameState.columns);

        // Endgame strategy: when only one pile has multiple items
        const nonEmptyPiles = gameState.columns.filter((count) => count > 0);
        const pilesWithMultiple = gameState.columns.filter(
          (count) => count > 1
        );

        if (nonEmptyPiles.length > 1 && pilesWithMultiple.length === 1) {
          // Count piles with exactly 1 item
          const pilesWithOne = nonEmptyPiles.filter((count) => count === 1).length;
          
          // Find the pile with multiple items
          for (let i = 0; i < 3; i++) {
            if (gameState.columns[i] > 1) {
              // If there's an odd number of piles with 1 item, take all from the multi-pile
              // If there's an even number of piles with 1 item, leave 1 in the multi-pile
              return { 
                column: i, 
                count: pilesWithOne % 2 === 1 ? gameState.columns[i] : gameState.columns[i] - 1 
              };
            }
          }
        }

        // Standard nim strategy: make nim-sum zero.
        if (currentNimSum !== 0) {
          for (let column = 0; column < 3; column++) {
            if (gameState.columns[column] === 0) continue;

            // Calculate what this pile should be to make nim-sum zero.
            const target = gameState.columns[column] ^ currentNimSum;

            // If target is less than current pile size, we can make this move.
            if (target < gameState.columns[column]) {
              return { column, count: gameState.columns[column] - target };
            }
          }
        }

        // If nim-sum is already 0 or no optimal move exists, make a safe move.
        for (let i = 0; i < 3; i++) {
          if (gameState.columns[i] > 0) {
            return { column: i, count: 1 };
          }
        }

        return { column: 0, count: 0 };
      }

      function checkGameOver() {
        return gameState.columns.every((count) => count === 0);
      }

      function computerMove() {
        if (gameState.gameOver) return;

        const move = calculateOptimalMove();
        gameState.columns[move.column] -= move.count;

        if (checkGameOver()) {
          gameState.gameOver = true;
          updateDisplay();
          return;
        }

        gameState.computerMove = false;
        updateDisplay();
      }

      function handleItemClick(event) {
        if (gameState.gameOver || gameState.computerMove) return;

        const columnIndex = parseInt(event.target.dataset.column);
        const position = parseInt(event.target.dataset.position);

        // Remove clicked item and all items to its right.
        const removeCount = gameState.columns[columnIndex] - position;
        gameState.columns[columnIndex] = position;

        if (checkGameOver()) {
          gameState.gameOver = true;
          updateDisplay();
          return;
        }

        gameState.computerMove = true;
        updateDisplay();
        setTimeout(computerMove, 1000);
      }

      function restartGame() {
        gameState = {
          columns: [3, 5, 7],
          computerMove: false,
          gameOver: false,
        };

        elements.setup.style.display = "block";
        elements.gameBoard.style.display = "none";
      }

      function startGame(firstPlayer) {
        gameState.computerMove = firstPlayer === "computer";
        gameState.gameOver = false;
        gameState.columns = [3, 5, 7];

        elements.setup.style.display = "none";
        elements.gameBoard.style.display = "block";

        updateDisplay();

        if (firstPlayer === "computer") {
          setTimeout(computerMove, 1000);
        }
      }

      function updateDisplay() {
        for (let i = 0; i < 3; i++) {
          const itemsContainer = elements.items[i];
          const targetCount = gameState.columns[i];
          const currentCount = itemsContainer.children.length;

          // Remove excess items from the end (these were clicked/removed).
          while (itemsContainer.children.length > targetCount) {
            itemsContainer.removeChild(itemsContainer.lastChild);
          }

          // Add missing items (shouldn't happen in normal gameplay but handles initialization).
          for (let j = currentCount; j < targetCount; j++) {
            const item = document.createElement("div");
            item.className = "item";
            item.dataset.column = i;
            item.dataset.position = j;
            itemsContainer.appendChild(item);
          }

          // Update all remaining items' position data and interaction state.
          for (let j = 0; j < targetCount; j++) {
            const item = itemsContainer.children[j];
            item.dataset.position = j;

            // Update classes and styles based on current game state.
            const isClickable = !gameState.computerMove && !gameState.gameOver;

            if (isClickable) {
              if (!item.classList.contains("clickable")) {
                item.classList.add("clickable");
                item.addEventListener("click", handleItemClick);
              }
              item.style.cursor = "pointer";
            } else {
              if (item.classList.contains("clickable")) {
                item.classList.remove("clickable");
                // Remove event listener by replacing with clone.
                const newItem = item.cloneNode(true);
                newItem.classList.remove("clickable");
                newItem.style.cursor = "default";
                item.parentNode.replaceChild(newItem, item);
              } else {
                item.style.cursor = "default";
              }
            }
          }
        }

        updateGameStatus();
      }

      function updateGameStatus() {
        const spanElement = elements.statusSpan;

        if (gameState.gameOver) {
          const winner = gameState.computerMove ? "Human" : "Computer";
          spanElement.className = "winner";
          
          if (winner === "Human") {
            spanElement.textContent = \`Game Over! \${winner} wins!\`;
            fireConfetti();
          } else {
            spanElement.textContent = \`Game Over! \${winner} wins! 😢\`;
          }
        } else if (!gameState.computerMove) {
          spanElement.className = "current-player";
          spanElement.textContent = "Your turn";
        } else {
          spanElement.className = "computer-thinking";
          spanElement.textContent = "Computer is thinking...";
        }
      }

      function fireConfetti() {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    </script>
  </body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  },
};