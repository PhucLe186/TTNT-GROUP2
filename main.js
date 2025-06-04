// Game state
        let currentState = [1,2,3,4,5,6,7,8,0];
        const goalState = [1, 2, 3, 4,5,6,7,8,0];
        let movesCount = 0;
        let startTime = null;
        let gameTimer = null;
        
        
        function initializeGrids() {
            renderGrid('currentGrid', currentState, true);
            renderGrid('goalGrid', goalState, false);
            startGame();
        }

        // Render a puzzle grid
        function renderGrid(gridId, state, interactive = false) {
            const grid = document.getElementById(gridId);
            grid.innerHTML = '';
            
            state.forEach((value, index) => {
                const cell = document.createElement('div');
                cell.className = value === 0 ? 'puzzle-cell empty' : 'puzzle-cell';
                cell.textContent = value === 0 ? '' : value;
                
                if (interactive && value !== 0) {
                    cell.onclick = () => moveCell(index);
                }
                
                grid.appendChild(cell);
            });
        }

        // Move a cell in the current state
        function moveCell(index) {
            const emptyIndex = currentState.indexOf(0);
            const row1 = Math.floor(index / 3);
            const col1 = index % 3;
            const row2 = Math.floor(emptyIndex / 3);
            const col2 = emptyIndex % 3;
            
            // Check if the move is valid (adjacent cells)
            if (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1) {
                [currentState[index], currentState[emptyIndex]] = [currentState[emptyIndex], currentState[index]];
                renderGrid('currentGrid', currentState, true);
                
                movesCount++;
                document.getElementById('movesCount').textContent = movesCount;
                
                // Check if puzzle is solved
                if (isPuzzleSolved()) {
                    endGame(true);
                }
            }
        }

       
        function isPuzzleSolved() {
            return currentState.join(',') === goalState.join(',');
        }

        
        function shufflePuzzle() {
            let shuffled = [...goalState];
             endGame(false, []);
             document.getElementById('solutionSection').style.display = 'none';
            
           
            for (let i = 0; i < 100; i++) {
                const emptyIndex = shuffled.indexOf(0);
                const possibleMoves = [];
                
                const row = Math.floor(emptyIndex / 3);
                const col = emptyIndex % 3;
                
                
                if (row > 0) possibleMoves.push(emptyIndex - 3); // Up
                if (row < 2) possibleMoves.push(emptyIndex + 3); // Down
                if (col > 0) possibleMoves.push(emptyIndex - 1); // Left
                if (col < 2) possibleMoves.push(emptyIndex + 1); // Right
                
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                [shuffled[emptyIndex], shuffled[randomMove]] = [shuffled[randomMove], shuffled[emptyIndex]];
            }
            
            currentState = shuffled;
            renderGrid('currentGrid', currentState, true);
            document.getElementById('status').textContent = 'Puzzle mới đã được tạo! Hãy bắt đầu chơi.';
            document.getElementById('status').className = 'status info';
            startGame();
        }

        function resetPuzzle() {
            endGame(false, []);
           document.getElementById('solutionSection').style.display = 'none';
            currentState = [1,2,3,4,5,6,7,8,0];
            renderGrid('currentGrid', currentState, true);
            document.getElementById('status').textContent = 'Puzzle đã được đặt lại!';
            document.getElementById('status').className = 'status info';
            startGame();
        }

       
        async function checkSolved() {
            const resultDiv = document.getElementById('status');

            try {
                resultDiv.textContent = '🧠 Đang gửi đến server để giải...';
                resultDiv.className = 'status info';

                const response = await fetch('http://localhost:5000/solve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ start: currentState, heuristic: 2 }) // bạn có thể đổi heuristic
                });

                const data = await response.json();

                if (data.error) {
                    resultDiv.textContent = '❌ Lỗi: ' + data.error;
                    resultDiv.className = 'status error';
                } else if (data.solution) {
                    resultDiv.textContent = '🤖 Đang thực thi lời giải, vui lòng đợi...';
                    resultDiv.className = 'status info';

                    const solution = data.solution;
                    let index = 0;
                    const interval = setInterval(() => {
                        const step = data.solution[index];
                        currentState = [...step];
                        renderGrid('currentGrid', currentState, false); 
                        index++;

                        document.getElementById('movesCount').textContent = index;
                        if (index >= data.solution.length) {
                            clearInterval(interval);
                            resultDiv.textContent = `🎉 Đã hoàn thành!`;
                            document.getElementById('movesCount').textContent =`${data.steps}`
                            resultDiv.className = 'status success';
                            
                            endGame(true, solution);
                        }
                    }, 500);
                } else {
                    resultDiv.textContent = '❌ Không tìm thấy lời giải.';
                    resultDiv.className = 'status error';
                }
            } catch (e) {
                resultDiv.textContent = '⚠️ Không thể kết nối đến server Flask!';
                resultDiv.className = 'status error';
            }
        }


        // Start game timer and reset stats
        function startGame() {
            movesCount = 0;
            startTime = Date.now();
            
            document.getElementById('movesCount').textContent = '0';
            document.getElementById('gameStatus').textContent = 'Đang chơi';
            
            // Clear existing timer
            if (gameTimer) clearInterval(gameTimer);
            
            // Start new timer
            gameTimer = setInterval(updateTimer, 1000);
        }

        // Update game timer
        function updateTimer() {
            if (startTime) {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('timeElapsed').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        
        function endGame(solved = false, solution=[]) {
            if (gameTimer) {
                clearInterval(gameTimer);
                gameTimer = null;
            }
            
            if (solved) {
                document.getElementById('gameStatus').textContent = 'Hoàn thành! 🎉';
                 const step = document.createElement('button');
                step.className = 'btn secondary';
                step.textContent = '🔍 Xem các bước';
                step.onclick = function() {
                    
                    displaySolution(solution);
                };
                 const statusDiv = document.getElementById('status');
                document.getElementById('status').className = 'status success';
                 statusDiv.appendChild(step);
            } else {
                document.getElementById('gameStatus').textContent = 'Đã dừng';
            }
        }
        function displaySolution(path) {
            const container = document.getElementById('stepsContainer');
            container.innerHTML = '';
            
            path.forEach((state, index) => {
                if (index > 0) {
                    const arrow = document.createElement('div');
                    arrow.className = 'arrow';
                    arrow.textContent = '→';
                    container.appendChild(arrow);
                }
                
                const step = document.createElement('div');
                step.className = 'step';
                
                state.forEach(value => {
                    const cell = document.createElement('div');
                    cell.className = value === 0 ? 'step-cell empty' : 'step-cell';
                    cell.textContent = value === 0 ? '' : value;
                    step.appendChild(cell);
                });
                
                container.appendChild(step);
            });
            
            document.getElementById('solutionSection').style.display = 'block';
        }

        // Initialize the application
        initializeGrids();