

/* Fonction qui va appeler startGame lorsque la fenêtre sera démarée ou rechargée. */
window.onload = window.onresize = function () { startGame(); };

window.onbeforeunload = returnToIndex;

function returnToIndex() { return "Are you sure you want to Quit?"; }

/**-------------------------------/
    ==========================    /
    | Les variables globales |    /
    ==========================    /
 -------------------------------**/

let canvas, C, rect, paused, key_pause, gameEnded, cellSize, timer, first_turn = true;
let NUM_CELLS_HORIZONTAL, NUM_CELLS_VERTICAL, grid, CELL_EMPTY, player1_CELL_OCCUPIED;
let player2_CELL_OCCUPIED, player1, player2;
let init_time_interval, modal, modal_content, modal_end;
let time_interval = 100;
let mouse_startX = 0, mouse_startY = 0, mouse_x = 0, mouse_y = 0, isMoving = false;
let x0, y0, initX, initY_p1, initY_p2;
let dropMenu, colorMenu;
let popUp_opened = false;
let winner;

/** +-----------------------------------------------------------------------+ **/

/**--------------------/
 ==============        /
 | Start Game |        /
 ==============        /
 --------------------**/

function startGame() {
    canvas = document.getElementById("myCanvas");
    C = canvas.getContext("2d");
    rect = canvas.getBoundingClientRect();
    paused = false;
    key_pause = false;
    gameEnded = false;
    if (first_turn) { firstTurnVars(); }
    else {
		timer.reset(init_time_interval);
		reset();
    }
    x0 = (canvas.width - NUM_CELLS_HORIZONTAL * cellSize) / 2;
    y0 = (canvas.height - NUM_CELLS_VERTICAL * cellSize) / 2;
    time_interval = 100;
    grid[player1.lightCycle_x][player1.lightCycle_y] = player1_CELL_OCCUPIED;
    grid[player2.lightCycle_x][player2.lightCycle_y] = player2_CELL_OCCUPIED;
    document.getElementById("player1_name").innerHTML = player1.name;
    document.getElementById("player2_name").innerHTML = player2.name;
    document.getElementById("player1_score").innerHTML = player1.score;
    document.getElementById("player2_score").innerHTML = player2.score;
    document.onkeydown = keyDownHandler;
    document.onmouseup = directMouse;
}

/*  variables qui seront initialisées pour une seule fois lors du premier tour au
    premier jeu seulement. */
function firstTurnVars() {
    cellSize = 5; // each cell in the grid is a square of this size, in pixels
    CELL_EMPTY = 0;
    player1_CELL_OCCUPIED = 1;
    player2_CELL_OCCUPIED = 2;
    NUM_CELLS_HORIZONTAL = canvas.width / cellSize;
    NUM_CELLS_VERTICAL = canvas.height / cellSize;
    grid = create2DArray(NUM_CELLS_HORIZONTAL, NUM_CELLS_VERTICAL);
    initX = NUM_CELLS_HORIZONTAL / 2;
    initY_p1 = NUM_CELLS_VERTICAL - 2;
    initY_p2 = 2;
    first_turn = false;
    dropMenu = document.getElementById("myDropdown");
    colorMenu = document.getElementById("colorDropdown");
    modal_content = document.getElementById("content");
    modal = document.getElementById("fullscreen-container");
    modal_end = document.getElementById("end_game");
    player1 = new Player(true);
    player2 = new Player(false);
    if(timer != null) { timer.reset(init_time_interval); }
    else {
        timer = new Timer(function () {
            advance();
        }, time_interval /*milliseconds*/);
    }
}

/** +-----------------------------------------------------------------------+ **/

/**------------------/
 ============        /
 | New Game |        /
 ============        /
 ------------------**/

function newGame(isReset, isEnded) {
	togglePause();
	if(isReset) {
		document.getElementById("p-message").innerHTML =
			"ARE YOU SURE YOU WANT TO RESET?";
	} else {
		document.getElementById("p-message").innerHTML =
			"DO YOU WANT TO PLAY A NEW GAME?";
	}
	replaceTokens(modal, "hide", "show");
	popUp_opened = true;
    if (!modal_content.classList.contains('show_message')) {
        modal_content.classList.toggle("show_message");
    }
    let confirm = document.getElementById('second_btn');
    confirm.onclick = () => {
		replaceTokens(modal, "show", "hide");
		popUp_opened = false;
        if(isEnded) { incrementScore(); }
        if(isReset) { first_turn = true; }
        startGame();
    };
}

/** +-----------------------------------------------------------------------+ **/

/**----------------------------/
 ======================        /
 | Fonctions de Pause |        /
 ======================        /
 -----------------------------**/
/* Fonction pour détecter si escape est déjà utilisé ou non. */
function pauseKey() { key_pause = !key_pause; }

/* Fonction pour géler le jeu. */
function togglePause() { paused = !paused; }

/* Fonction pour géler le jeu et afficher le settings ou color menu. */
function pauseFunction(pause_bool, color_bool) {
    togglePause();
    if (pause_bool) { dropMenu.classList.toggle("show"); }
    else {
        if (color_bool) { colorMenu.classList.toggle("palette"); }
    }
}

/** +-----------------------------------------------------------------------+ **/

/**----------------------------/
 ======================        /
 | Fonction principal |        /
 ======================        /
 -----------------------------**/

/* La fonction de advance est la fonction initiale puisque c'est elle qui appelle
   la fonction redraw pour redessiner la grille, elle vérifie si un des deux joueurs
   est mort ou non, elle change la vitesse du jeu et elle appelle pour recommencer
   un nouveau jeu si le jeu courant est terminé. */
function advance() {
    if (!paused && !key_pause) {
        if (player1.lightCycle_alive && player2.lightCycle_alive) {
            let new1_x = player1.lightCycle_x + player1.lightCycle_vx,
                new1_y = player1.lightCycle_y + player1.lightCycle_vy,
                new2_x = player2.lightCycle_x + player2.lightCycle_vx,
                new2_y = player2.lightCycle_y + player2.lightCycle_vy;
            // Check for collision with grid boundaries and with trail
            verifyPlayer(player1, new1_x, new1_y, player1_CELL_OCCUPIED);
            verifyPlayer(player2, new2_x, new2_y, player2_CELL_OCCUPIED);
            redraw();
        }
    }

    if (gameEnded) {
        if (!player1.lightCycle_alive && !player2.lightCycle_alive) {
            winner = null;
        } else {
            if (player1.lightCycle_alive) { winner = player1; }
            else { winner = player2; }
        }
        togglePause();
        newGame(false, true);
    } else { timer.reset(time_interval -= 0.1); }
}

/* Une fonction qui vérifie que les deux joueurs sont toujours vivants ou non. */
function verifyPlayer(curr_player, new_x, new_y, player_CELL_OCCUPIED) {
    if (new_x < 0 || new_x >= NUM_CELLS_HORIZONTAL
        || new_y < 0 || new_y >= NUM_CELLS_VERTICAL
        || grid[new_x][new_y] === player1_CELL_OCCUPIED
        || grid[new_x][new_y] === player2_CELL_OCCUPIED) {
        curr_player.lightCycle_alive = false;
        if (curr_player === player2) {
            var last_x = player1.lightCycle_x + player1.lightCycle_vx;
            var last_y = player1.lightCycle_y + player1.lightCycle_vy;
            verifyPlayer(player1, last_x, last_y, player1_CELL_OCCUPIED);
        }
        gameEnded = true;
    } else {
        grid[new_x][new_y] = player_CELL_OCCUPIED;
        curr_player.lightCycle_x = new_x;
        curr_player.lightCycle_y = new_y;
    }
}

/** +-----------------------------------------------------------------------+ **/

/**---------------------------------/
 ===========================        /
 | Fonctions de changement |        /
 ===========================        /
 ---------------------------------**/

/* Fonction pour changer la vitesse du jeu. */
function changeInterval(isPositive) {
    if (isPositive) { timer.reset(time_interval -= 20); }
    else { timer.reset(time_interval += 20); }
}

/* Fonction pour changer les couleurs. */
function changeColor() {
    if (document.getElementById('player1').checked) {
        player1.lightCycle_color =
			document.getElementById("player1_color").valueOf().value;
    } else {
        player2.lightCycle_color =
			document.getElementById("player2_color").valueOf().value;
    }
}

/** +-----------------------------------------------------------------------+ **/

/**--------------------------------------------------/
 ============================================        /
 | Fonctions pour gérer scores et vainqueur |        /
 ============================================        /
 --------------------------------------------------**/

function detectWinner() {
	if(gameEnded) {
		incrementScore();
		if (player1.score > 0 || player2.score > 0) {
			if (player1.score > player2.score) {
				document.getElementById("gameOver_message").innerHTML =
					"The winner is : Player1!";
			} else {
				if (player2.score > player1.score) {
					document.getElementById("gameOver_message").innerHTML =
						"The winner is : Player2!";
				} else {
					document.getElementById("gameOver_message").innerHTML =
						"Game Draw!";
				}
			}
		} else {
			document.getElementById("gameOver_message").innerHTML =
				"Game Draw!Score is null!";
		}
		endGame();
	} else { returnToGame(); }
}

function incrementScore() {
	if(winner === player1) { player1.score++; }
	else {
		if(winner === player2) { player2.score++; }
	}
}

/** +-----------------------------------------------------------------------+ **/

/**-----------------------------------------------------------/
 =====================================================        /
 | Fonctions de retour(jeu,main menu ou nouveau jeu) |        /
 =====================================================        /
 -----------------------------------------------------------**/

/* Fonction pour resumer le jeu courant. */
function returnToGame() {
    togglePause();
    replaceTokens(modal, "show", "hide");
}

/* Fonction pour terminer le jeu. */
function endGame() {
	replaceTokens(modal, "show", "hide");
	replaceTokens(modal_end, "hide_message", "show_message");
}

/* Fonction responsable d'afficher ou faire disparaître les meuns. */
function replaceTokens(element, oldTok, newTok) {
    element.classList.replace(oldTok, newTok);
}

/** +-----------------------------------------------------------------------+ **/

/**----------------------------/
    ======================     /
    | Fonctions de reset |     /
    ======================     /
 ----------------------------**/

/* Des fonctions pour remettre les variables et la grille à leurs états initiaux. */

function reset() {
    player1.lightCycle_x = initX;
    player2.lightCycle_x = initX;
    player1.lightCycle_y = initY_p1;
    player2.lightCycle_y = initY_p2;
    player1.lightCycle_vx = 0;
    player1.lightCycle_vy = -1;
    player2.lightCycle_vx = 0;
    player2.lightCycle_vy = 1;
    player1.lightCycle_alive = true;
    player2.lightCycle_alive = true;
    reset_grid();
}


function reset_grid() {
    for (let i = 0; i < NUM_CELLS_HORIZONTAL; ++i) {
        for (let j = 0; j < NUM_CELLS_VERTICAL; ++j) {
            grid[i][j] = CELL_EMPTY;
        }
    }
}

/** +-----------------------------------------------------------------------+ **/

/**--------------------------------/
    ==========================     /
    | Fonctions de dessinage |     /
    ==========================     /
 --------------------------------**/

// Creates a 2D array filled with zeros
function create2DArray(numColumns, numRows) {
    let array = [];
    for (let c = 0; c < numColumns; c++) {
        array.push([]); // adds an empty 1D array at the end of "array"
        for (let r = 0; r < numRows; r++) {
            array[c].push(0); // add zero at end of the 1D array "array[c]"
        }
    }
    return array;
}

/* Fonction pour redessiner la grille. */
function redraw() {
    C.fillStyle = "#000000";
    C.clearRect(0, 0, canvas.width, canvas.height);
    C.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < NUM_CELLS_HORIZONTAL; ++i) {
        for (let j = 0; j < NUM_CELLS_VERTICAL; ++j) {
            if (grid[i][j] === player1_CELL_OCCUPIED) {
                C.fillStyle = player1.lightCycle_color;
                C.fillRect(x0 + i * cellSize + 1, y0 + j * cellSize + 1,
                    cellSize - 2, cellSize - 2);
            } else {
                if (grid[i][j] === player2_CELL_OCCUPIED) {
                    C.fillStyle = player2.lightCycle_color;
                    C.fillRect(x0 + i * cellSize + 1, y0 + j * cellSize + 1,
                        cellSize - 2, cellSize - 2);
                }
            }
        }
    }
    detectPlayerDeath();
}

/* Fonction pour savoir si un des joueurs ou les deux sont morts ou non. */
function detectPlayerDeath() {
    if (player2.lightCycle_alive && player1.lightCycle_alive) {
        fillCases(player1.lightCycle_color, player2.lightCycle_color);
    } else {
        if (player2.lightCycle_alive) {
            fillCases("#ffffff", player2.lightCycle_color);
        } else {
            if (player1.lightCycle_alive) {
                fillCases(player1.lightCycle_color, "#ffffff");
            } else {
                fillCases("#ffffff", "#ffffff");
            }
        }
    }
}

/* Fonction pour remplir les cases avec les couleurs passées en paramètre. */
function fillCases(p1_color, p2_color) {
    C.fillStyle = p1_color;
    C.fillRect(x0 + player1.lightCycle_x * cellSize,
        y0 + player1.lightCycle_y * cellSize, cellSize, cellSize);
    C.fillStyle = p2_color;
    C.fillRect(x0 + player2.lightCycle_x * cellSize,
        y0 + player2.lightCycle_y * cellSize, cellSize, cellSize);
}

/** +-----------------------------------------------------------------------+ **/

/**-------------------/
    ============     /
    | Handlers |     /
    ============     /
 ------------------**/

/**
    ====================
    | keyboard handler |
    ====================
 **/

/* Fonction des mouvements du clavier. */
function keyDownHandler(e) {

    let curr_player, curr_code = e.keyCode;

    if (curr_code === 38 || curr_code === 40 || curr_code === 37 || curr_code === 39) {
        curr_player = player1;
    } else {
        if (curr_code === 68 || curr_code === 65 || curr_code === 83 || curr_code === 87) {
            curr_player = player2;
        }
    }

    if ((!paused && !key_pause) || curr_code === 27 || curr_code === 80 || curr_code === 32) {
        switch (curr_code) {
            case 38:	// UP
            case 87:
                curr_player.lightCycle_vx = 0;
                curr_player.lightCycle_vy = -1;
                break;
            case 40:	// DOWN
            case 83:
                curr_player.lightCycle_vx = 0;
                curr_player.lightCycle_vy = 1;
                break;
            case 37:	// LEFT
            case 65:
                curr_player.lightCycle_vx = -1;
                curr_player.lightCycle_vy = 0;
                break;
            case 39:	// RIGHT
            case 68:
                curr_player.lightCycle_vx = 1;
                curr_player.lightCycle_vy = 0;
                break;
            case 27:
                if(popUp_opened) { returnToGame(); }
                else{
                    pauseKey();
                    pauseFunction(true, false);
                }
                break;
            case 80:
                if(!key_pause) {
                    pauseFunction(false, false);
                } else {
                    if(!paused) {
                        pauseFunction(false, false);
                    }
                }
                break;
            case 189:
                changeInterval(false);
                break;
            case 187:
                changeInterval(true);
                break;
            default:
        }
    }
}


/**
    =================
    | Mouse handler |
    =================
 **/

/* Fonction des mouvements de la souris. */
function directMouse() {
    getCoords();
    if(Math.abs(mouse_x) > Math.abs(mouse_y)) {
        if(mouse_x > 0) {
            player1.lightCycle_vx = 1;
            player1.lightCycle_vy = 0;
        }
        else {
            player1.lightCycle_vx = -1;
            player1.lightCycle_vy = 0;
        }
    } else {
        if(mouse_y > 0) {
            player1.lightCycle_vx = 0;
            player1.lightCycle_vy = 1;
        } else {
            player1.lightCycle_vx = 0;
            player1.lightCycle_vy = -1;
        }
    }
}

/* Fonction pour calculer delta x et delta y.  */
function getCoords() {
    // Add the event listeners for mousedown, mousemove, and mouseup
    canvas.addEventListener('mousedown', e => {
        mouse_startX = e.clientX - rect.left;
        mouse_startY = e.clientY - rect.top;
        isMoving = true;
    });

    canvas.addEventListener('mousemove', e => {
        if (isMoving === true) {
            mouse_x = e.clientX - mouse_startX;
            mouse_y = e.clientY - mouse_startY;
        }
    });

    window.addEventListener('mouseup', e => {
        if (isMoving === true) {
            mouse_x = 0;
            mouse_y = 0;
            isMoving = false;
        }
    });
}

/** +-----------------------------------------------------------------------+ **/

/**--------------------------------/
    =========================     /
    | Objets constructables |     /
    =========================     /
 *-------------------------------**/

/** Constructeurs **/

/* Va créer des objets de type Player qui seront les joueurs du jeu. */
function Player(first) {
    // Current position and direction of light cycle 1
    this.lightCycle_x = initX;
    this.lightCycle_vx = 0; // positive for right
    this.lightCycle_alive = true;
    this.score = 0;
    if (first) {
        this.name = "Player1";
        this.lightCycle_y = initY_p1;
        this.lightCycle_vy = -1; // positive for down
        this.lightCycle_color = "#00ffff";
        document.getElementById("player1_color").valueOf().value = this.lightCycle_color;
    } else {
        this.name = "Player2";
        this.lightCycle_y = initY_p2;
        this.lightCycle_vy = 1;
        this.lightCycle_color = "#ff0000";
        document.getElementById("player2_color").valueOf().value = this.lightCycle_color;
    }
}

/* Va créer des objets de type timer dont les méthodes reset, stop et start seront utilisées. */
function Timer(fn, t) {
    var timerObj = setInterval(fn, t);

    this.stop = function () {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    };

    // start timer using current settings (if it's not already running)
    this.start = function () {
        if (!timerObj) {
            this.stop();
            timerObj = setInterval(fn, t);
        }
        return this;
    };

    // start with new or original interval, stop current interval
    this.reset = function (newT = t) {
        t = newT;
        return this.stop().start();
    }
}

/** +-----------------------------------------------------------------------+ **/
