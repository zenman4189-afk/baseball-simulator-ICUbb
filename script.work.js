const container = document.getElementById("playerContainer");

function addPlayer(){

    const div = document.createElement("div");

    div.className = "player-form";

    div.innerHTML = `

    <input placeholder="名前" class="name">

    <input type="number" step="0.01" placeholder="単打数" class="single">

    <input type="number" step="0.01" placeholder="二塁打数" class="double">

    <input type="number" step="0.01" placeholder="三塁打数" class="triple">

    <input type="number" step="0.01" placeholder="本塁打数" class="hr">

    <input type="number" step="0.01" placeholder="四死球数" class="walk">

    <input type="number" step="0.01" placeholder="三振数" class="strikeout">

    <input type="number" placeholder="打席数" class="pa">
    `;

    container.appendChild(div);
}

for(let i=0;i<9;i++){

    addPlayer();
}

function getPlayers(){

    const forms = document.querySelectorAll(".player-form");

    let players = [];

    forms.forEach(form => {

        const single = parseInt(form.querySelector(".single").value) || 0;

        const double = parseInt(form.querySelector(".double").value) || 0;

        const triple = parseInt(form.querySelector(".triple").value) || 0;

        const hr = parseInt(form.querySelector(".hr").value) || 0;

        const walk = parseInt(form.querySelector(".walk").value) || 0;

        const strikeout = parseInt(form.querySelector(".strikeout").value) || 0;

        const pa = parseInt(form.querySelector(".pa").value) || 1;

        const hitTotal =
            single +
            double +
            triple +
            hr +
            walk +
            strikeout;

        const out = pa - hitTotal;

        players.push({

            name: form.querySelector(".name").value,

            single: single / pa,

            double: double / pa,

            triple: triple / pa,

            hr: hr / pa,

            walk: walk / pa,

            strikeout: strikeout / pa,

            out: out / pa

        });

    });

    return players;
}

function plateAppearance(player){

    let r = Math.random();

    let probs = [

        ["single", player.single],
        ["double", player.double],
        ["triple", player.triple],
        ["hr", player.hr],
        ["walk", player.walk],
        ["out", player.out],
        ["strikeout", player.strikeout]

    ];

    let cumulative = 0;

    for(let [result, p] of probs){

        cumulative += p;

        if(r < cumulative){

            return result;
        }
    }

    return "out";
}

function advanceRunners(result, bases){

    let [first, second, third] = bases;

    let runs = 0;

    if(result === "single"){

        runs += third;

        third = second;
        second = first;
        first = 1;
    }

    else if(result === "double"){

        runs += second + third;

        third = first;
        second = 1;
        first = 0;
    }

    else if(result === "triple"){

        runs += first + second + third;

        third = 1;
        second = 0;
        first = 0;
    }

    else if(result === "hr"){

        runs += first + second + third + 1;

        first = second = third = 0;
    }

    else if(result === "walk"){

        if(first && second && third){

            runs += 1;
        }

        let newThird = third || (second && first);

        let newSecond = second || first;

        let newFirst = 1;

        first = newFirst;
        second = newSecond;
        third = newThird;
    }

    return [runs, [first, second, third]];
}

function simulateInning(lineup, batterIndex){

    let outs = 0;

    let runs = 0;

    let bases = [0,0,0];

    while(outs < 3){

        let player = lineup[batterIndex];

        let result = plateAppearance(player);

        if(result === "out" || result === "strikeout"){

            outs++;
        }

        else{

            let temp = advanceRunners(result, bases);

            runs += temp[0];

            bases = temp[1];
        }

        batterIndex = (batterIndex + 1) % lineup.length;
    }

    return [runs, batterIndex];
}

function simulateGame(lineup){

    let totalRuns = 0;

    let batterIndex = 0;

    for(let i=0;i<9;i++){

        let temp = simulateInning(lineup, batterIndex);

        totalRuns += temp[0];

        batterIndex = temp[1];
    }

    return totalRuns;
}

function expectedRuns(lineup, simulations=100){

    let total = 0;

    for(let i=0;i<simulations;i++){

        total += simulateGame(lineup);
    }

    return total / simulations;
}

function permutations(arr){

    if(arr.length === 0) return [[]];

    let result = [];

    for(let i=0;i<arr.length;i++){

        let rest = [...arr.slice(0,i), ...arr.slice(i+1)];

        for(let perm of permutations(rest)){

            result.push([arr[i], ...perm]);
        }
    }

    return result;
}

async function runSimulation(){

    const simulations =
    parseInt(
        document.getElementById("simulationCount").value
    ) || 50;

    const output = document.getElementById("output");

    output.textContent = "計算中...\n";

    const players = getPlayers();

    if(players.length < 2){

        output.textContent = "選手数が足りません";

        return;
    }

    const perms = permutations(players);

    let rankings=[]

    let count = 0;

    for(let lineup of perms){

        let score = expectedRuns(lineup, simulations);

        count++;

        rankings.push({

            lineup: [...lineup],

            score: score
        });

        rankings.sort((a,b)=>b.score-a.score);

        rankings = rankings.slice(0,10);

        if(count % 50000 === 0){

            output.textContent +=
            count + " 通り完了\n";

            await new Promise(r => setTimeout(r,1));
        }
    }

    output.textContent +=
    "\n====================\n" +
    "最適打順\n" +
    "====================\n";

    bestLineup.forEach((player,index)=>{

        output.textContent +=
        `${index+1}番 : ${player.name}\n`;
    });

    output.textContent +=
    "\n得点期待値 = " +
    bestScore.toFixed(3);
}