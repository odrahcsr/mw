
const diceTypes = [4, 6, 8, 10, 12, 20];
let player1Dice = [];
let player2Dice = [];
let currentPlayer = 1;
let gameStarted = false;

function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function startGame() {
    player1Dice = diceTypes.map(s => ({ sides: s, value: rollDie(s), used: false }));
    player2Dice = diceTypes.map(s => ({ sides: s, value: rollDie(s), used: false }));
    gameStarted = true;
    currentPlayer = decideFirstPlayer();
    renderDice();
    updateBattleInfo(`Game started! Player ${currentPlayer} begins.`);
}

function decideFirstPlayer() {
    const p1Sum = player1Dice.reduce((sum, d) => sum + d.value, 0);
    const p2Sum = player2Dice.reduce((sum, d) => sum + d.value, 0);
    return p1Sum <= p2Sum ? 1 : 2;
}

function renderDice() {
    const render = (containerId, dice) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        dice.forEach((die, idx) => {
            const div = document.createElement('div');
            div.className = 'die';
            if (die.used) {
                div.style.backgroundColor = '#bbb';
                div.style.opacity = 0.5;
            }
            div.textContent = die.value;
            div.onclick = () => attemptCapture(idx);
            container.appendChild(div);
        });
    };
    render('player1-dice', player1Dice);
    render('player2-dice', player2Dice);
}

function attemptCapture(index) {
    if (!gameStarted) return;
    const [attacker, defender] = currentPlayer === 1 ? [player1Dice, player2Dice] : [player2Dice, player1Dice];
    const opponentIndex = index;
    const opponentDie = defender[opponentIndex];
    if (!opponentDie || opponentDie.used) return;

    const attackerDice = attacker.filter(d => !d.used && d.value >= opponentDie.value);
    if (attackerDice.length > 0) {
        attackerDice[0].used = true;
        opponentDie.used = true;
        rerollDie(attackerDice[0]);
        endTurn();
        return;
    }

    const availableDice = attacker.filter(d => !d.used);
    const values = availableDice.map(d => d.value);
    const combinations = getCombinations(values);
    for (const combo of combinations) {
        const expressions = generateExpressions(combo);
        for (const expr of expressions) {
            try {
                if (Math.abs(eval(expr) - opponentDie.value) < 1e-6) {
                    combo.forEach(v => {
                        const die = attacker.find(d => d.value === v && !d.used);
                        if (die) {
                            die.used = true;
                            rerollDie(die);
                        }
                    });
                    opponentDie.used = true;
                    endTurn();
                    return;
                }
            } catch {}
        }
    }

    updateBattleInfo(`Player ${currentPlayer} can't capture. Turn passed.`);
    currentPlayer = 3 - currentPlayer;
}

function rerollDie(die) {
    die.value = rollDie(die.sides);
    die.used = false;
}

function endTurn() {
    if (checkWin()) return;
    currentPlayer = 3 - currentPlayer;
    updateBattleInfo(`Player ${currentPlayer}'s turn`);
    renderDice();
}

function checkWin() {
    const p1Left = player2Dice.every(d => d.used);
    const p2Left = player1Dice.every(d => d.used);
    if (p1Left) {
        updateBattleInfo('Player 1 wins!');
        gameStarted = false;
        return true;
    }
    if (p2Left) {
        updateBattleInfo('Player 2 wins!');
        gameStarted = false;
        return true;
    }
    return false;
}

function updateBattleInfo(msg) {
    document.getElementById('battle-info').textContent = msg;
}

function getCombinations(arr) {
    const results = [];
    const recurse = (start, combo) => {
        if (combo.length > 1) results.push(combo);
        for (let i = start; i < arr.length; i++) {
            recurse(i + 1, combo.concat(arr[i]));
        }
    };
    recurse(0, []);
    return results;
}

function generateExpressions(nums) {
    if (nums.length === 1) return [nums[0].toString()];
    const results = [];
    for (let i = 1; i < nums.length; i++) {
        const left = nums.slice(0, i);
        const right = nums.slice(i);
        const leftExprs = generateExpressions(left);
        const rightExprs = generateExpressions(right);
        for (const l of leftExprs) {
            for (const r of rightExprs) {
                results.push(`(${l}+${r})`, `(${l}-${r})`, `(${l}*${r})`, `(${l}/${r})`);
            }
        }
    }
    return results;
}
