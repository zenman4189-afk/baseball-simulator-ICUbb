const container =
    document.getElementById("playerContainer");

let chart = null;

function addPlayer(){

    const div = document.createElement("div");

    div.className = "player-form";

    div.innerHTML = `

    <input placeholder="名前" class="name">

    <input type="number" placeholder="単打数" class="single">

    <input type="number" placeholder="二塁打数" class="double">

    <input type="number" placeholder="三塁打数" class="triple">

    <input type="number" placeholder="本塁打数" class="hr">

    <input type="number" placeholder="四球数" class="walk">

    <input type="number" placeholder="三振数" class="strikeout">

    <input type="number" placeholder="打席数" class="pa">

    `;

    container.appendChild(div);
}

for(let i = 0; i < 9; i++){

    addPlayer();
}

function getPlayers(){

    const forms =
        document.querySelectorAll(".player-form");

    let players = [];

    forms.forEach(form => {

        const single =
            parseInt(form.querySelector(".single").value) || 0;

        const double =
            parseInt(form.querySelector(".double").value) || 0;

        const triple =
            parseInt(form.querySelector(".triple").value) || 0;

        const hr =
            parseInt(form.querySelector(".hr").value) || 0;

        const walk =
            parseInt(form.querySelector(".walk").value) || 0;

        const strikeout =
            parseInt(form.querySelector(".strikeout").value) || 0;

        const pa =
            parseInt(form.querySelector(".pa").value) || 1;

        const used =
            single +
            double +
            triple +
            hr +
            walk +
            strikeout;

        let inplayout =
            pa - used;

        if(inplayout < 0){

            inplayout = 0;
        }

        players.push({

            name:
                form.querySelector(".name").value || "名無し",

            single:
                single / pa,

            double:
                double / pa,

            triple:
                triple / pa,

            hr:
                hr / pa,

            walk:
                walk / pa,

            strikeout:
                strikeout / pa,

            inplayout:
                inplayout / pa
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

        ["inplayout", player.inplayout],

        ["strikeout", player.strikeout]
    ];

    let cumulative = 0;

    for(let [result,p] of probs){

        cumulative += p;

        if(r < cumulative){

            return result;
        }
    }

    return "strikeout";
}

function advanceRunners(result,bases){

    let [first,second,third] = bases;

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

        first = 0;

        second = 0;

        third = 0;
    }

    else if(result === "walk"){

        if(first && second && third){

            runs += 1;
        }

        let newThird =
            third || (second && first);

        let newSecond =
            second || first;

        let newFirst = 1;

        first = newFirst;

        second = newSecond;

        third = newThird;
    }

    else if(result === "inplayout"){

        runs += third;

        third = second;

        second = first;

        first = 0;
    }

    return [runs,[first,second,third]];
}

function simulateInning(lineup,batterIndex){

    let outs = 0;

    let runs = 0;

    let bases = [0,0,0];

    while(outs < 3){

        let player =
            lineup[batterIndex];

        let result =
            plateAppearance(player);

        if(result === "inplayout"
        || result === "strikeout"){

            outs++;
        }

        else{

            let temp =
                advanceRunners(result,bases);

            runs += temp[0];

            bases = temp[1];
        }

        batterIndex =
            (batterIndex + 1)
            % lineup.length;
    }

    return [runs,batterIndex];
}

function simulateGame(lineup){

    let totalRuns = 0;

    let batterIndex = 0;

    for(let i = 0; i < 9; i++){

        let temp =
            simulateInning(lineup,batterIndex);

        totalRuns += temp[0];

        batterIndex = temp[1];
    }

    return totalRuns;
}

async function runSimulation(){

    const output =
        document.getElementById("output");

    output.textContent =
        "シミュレーション中...\n";

    const simulations =
        parseInt(
            document.getElementById(
                "simulationCount"
            ).value
        ) || 1000;

    const lineup = getPlayers();

    if(lineup.length < 2){

        output.textContent =
            "選手数が足りません";

        return;
    }

    let totalRuns = 0;

    let scoreDistribution = {};

    for(let i = 0; i < simulations; i++){

        const runs =
            simulateGame(lineup);

        totalRuns += runs;

        scoreDistribution[runs] =
            (scoreDistribution[runs] || 0) + 1;

        if(i % 1000 === 0){

            output.textContent =
                `${i} 試合完了...\n`;

            await new Promise(
                r => setTimeout(r,1)
            );
        }
    }

    const expected =
        totalRuns / simulations;

    output.textContent =

        "====================\n" +

        "打順シミュレーション結果\n" +

        "====================\n\n";

    lineup.forEach((player,index)=>{

        output.textContent +=
            `${index + 1}番 : ${player.name}\n`;
    });

    output.textContent +=

        `\n試合数 : ${simulations}\n` +

        `平均得点期待値 : ${expected.toFixed(3)} 点\n`;

    const labels =
        Object.keys(scoreDistribution)
        .sort((a,b)=>a-b);

    const data =
        labels.map(
            label => scoreDistribution[label]
        );

    const ctx =
        document.getElementById("resultChart");

    if(chart){

        chart.destroy();
    }

    chart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{

                label: "試合数",

                data: data
            }]
        },

        options: {

            responsive: true,

            plugins: {

                title: {

                    display: true,

                    text: "得点分布"
                }
            },

            scales: {

                x: {

                    title: {

                        display: true,

                        text: "得点"
                    }
                },

                y: {

                    beginAtZero: true,

                    title: {

                        display: true,

                        text: "試合数"
                    }
                }
            }
        }
    });
}