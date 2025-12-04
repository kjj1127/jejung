// game.js

let player = {};
let enemy = {};
let gameData = { floor: 1, isBattleOver: false };
let isAnimating = false;
let selectedJobKey = null;

// 디버그 모드 플래그
let isDebugMode = false;

const MAX_RECORDS_KEY = "tbs_max_records"; 
const SAVE_KEY = "tbs_game_save";

let selectedRewards = [];
let currentRewardOptions = [];

const JOB_DATA = {
    "warrior": { 
        name: "warrior", hp: 200, maxHp: 200, mp: 10, maxMp: 10, atk: 30, crit: 5, avoid: 5, speed: 10, hpRegen: 13, mpRegen: 1, 
        skills: [
            { name: "정당방위", cost: 5, desc: "[MP 5] 태세 전환\n공격 받으면: (반감된 피해) + 기본공격 반격\n공격 안 받으면: 0 + 기본공격 피해" },
            { name: "강타", cost: 4, desc: "[MP 4] 강력한 일격\n기본 공격의 2.5배 피해를 입힙니다." }
        ] 
    },
    "rogue": { 
        name: "rogue", hp: 130, maxHp: 130, mp: 10, maxMp: 10, atk: 20, crit: 10, avoid: 15, speed: 25, hpRegen: 8, mpRegen: 1, 
        skills: [
            { name: "은신", cost: 7, desc: "[MP 7] 3턴간 회피/속도 +30\n회피 성공 시 자동 반격합니다." },
            { name: "기습", cost: 3, desc: "[MP 3] 빠른 공격\n기본 공격 + 스피드만큼 추가 피해" }
        ] 
    },
    "mage": { 
        name: "mage", hp: 100, maxHp: 100, mp: 30, maxMp: 30, atk: 15, crit: 5, avoid: 10, speed: 13, hpRegen: 8, mpRegen: 3, 
        skills: [
            { name: "익스플로전", cost: 5, desc: "[MP 5] 마력 응축 (스택+1)\n해당 턴 피해 50% 감소.\n기본 공격 시 스택 소모하여 폭발 피해." },
            { name: "에너지볼", cost: 5, desc: "[MP 5] 마법 구체\n적에게 강력한 피해를 입힙니다." }
        ] 
    },
    "archer": { 
        name: "archer", hp: 130, maxHp: 130, mp: 10, maxMp: 10, atk: 30, crit: 30, avoid: 10, speed: 20, hpRegen: 8, mpRegen: 1, 
        skills: [
            { name: "마법화살", cost: 5, desc: "[MP 5] 화살 강화\n3턴간 기본 공격 시 추가 피해를 입힙니다." },
            { name: "명중", cost: 6, desc: "[MP 6] 필중 사격\n방어를 무시하고 명중합니다.\n방어 안했으면 2배 피해." }
        ] 
    }
};

let battleState = {
    playerDefending: false, enemyDefending: false,
    rogueStealthTurns: 0, rogueStealthCooldown: 0,
    mageStack: 0, archerBuffTurns: 0, archerSkill1Cooldown: 0,
    warriorCounter: false, sureShot: false,
    bossDmgCut: 0, playerSilence: 0 
};

$(document).ready(function() {
    checkMainMenu();

    $("#btn-newgame").click(startNewGame);
    $("#btn-continue").click(continueGame);
    $("#btn-reset-all").click(resetAllData);
    $("#btn-go-main").click(goToMainMenu);
    $("#btn-back-menu").click(() => { $("#char-select-screen").hide(); $("#main-menu").show(); });
    
    $("#btn-detail-back").click(() => {
        $("#char-detail-view").hide();
        $("#char-selection-view").fadeIn();
    });

    $("#btn-start-game").click(() => {
        startGameWith(selectedJobKey);
    });

    // 디버그 모드 단축키 리스너 (Ctrl + Alt + Shift + A)
    $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.shiftKey && (e.key.toLowerCase() === 'a')) {
            isDebugMode = !isDebugMode;
            if (isDebugMode) {
                alert("🛠️ 디버그 모드 ON\n새로 시작 시 20층 이동 / 공격력 5배 강화");
            } else {
                alert("디버그 모드 OFF");
            }
        }
    });

    bindActionEvents();
    $("#btn-reward-confirm").click(applyRewardsAndNextFloor);
});

function bindActionEvents() {
    $("#btn-attack").off("click").click(() => runTurn("attack"));
    $("#btn-defend").off("click").click(() => runTurn("defend"));
    $("#btn-heal").off("click").click(() => runTurn("heal"));
    $("#btn-skill-1").off("click").click(() => runTurn("skill1"));
    $("#btn-skill-2").off("click").click(() => runTurn("skill2"));
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function triggerAnim(actor, type, duration = 400) {
    const $el = (actor === "player") ? $("#player-img") : $("#enemy-img");
    const animClass = `anim-${type}`;
    $el.removeClass(animClass); void $el[0].offsetWidth; $el.addClass(animClass);
    await delay(duration); 
    $el.removeClass(animClass);
}

function showFloatingText(actor, text, type = "dmg") {
    const $area = (actor === "player") ? $("#player-sprite-area") : $("#enemy-sprite-area");
    let $float = $(`<div class="floating-text floating-${type}">${text}</div>`);
    $area.append($float);
    setTimeout(() => $float.remove(), 800);
}

function checkMainMenu() {
    $("#game-wrapper").hide();
    $("#char-select-screen").hide();
    $("#main-menu").show();
    let records = JSON.parse(localStorage.getItem(MAX_RECORDS_KEY) || "{}");
    let max = 0;
    Object.values(records).forEach(v => { if(v > max) max = v; });
    
    // [수정] 21 이상이면 CLEAR, 아니면 -1 층 표시
    if (max > 20) {
        $("#max-record").text("CLEAR").css("color", "#f1c40f");
    } else {
        $("#max-record").text(Math.max(0, max - 1) + "층").css("color", "");
    }
    
    $("#btn-continue").prop("disabled", !localStorage.getItem(SAVE_KEY));
}

function startNewGame() { 
    if(localStorage.getItem(SAVE_KEY)) {
        if(!confirm("진행 중인 게임이 있습니다. 덮어쓰고 새로 시작할까요?")) return;
    }
    localStorage.removeItem(SAVE_KEY); 
    showCharacterSelect(); 
}

function continueGame() {
    const saved = localStorage.getItem(SAVE_KEY); if (!saved) return;
    const parsed = JSON.parse(saved); player = parsed.player; gameData.floor = parsed.floor;
    resetBattleState();
    if (player.job === "mage") battleState.mageStack = player.savedMageStack || 0; 
    $("#main-menu").hide(); $("#game-wrapper").show(); loadEnemy(gameData.floor);
}
function resetAllData() { if(confirm("데이터를 초기화하시겠습니까?")) { localStorage.clear(); location.reload(); } }
function goToMainMenu() { if(confirm("메인으로 이동하시겠습니까?")) { $("#game-wrapper").hide(); $("#main-menu").show(); checkMainMenu(); } }

function showCharacterSelect() {
    $("#main-menu").hide(); 
    $("#game-wrapper").hide();
    $("#char-select-screen").css("display", "flex");
    $("#char-detail-view").hide();
    $("#char-selection-view").show();
    
    let records = JSON.parse(localStorage.getItem(MAX_RECORDS_KEY) || "{}");
    const jobs = ["warrior", "rogue", "mage", "archer"];
    
    let html = ``;
    jobs.forEach(j => { 
        let rawRecord = records[j] || 0;
        // [수정] 21 이상이면 CLEAR 표시
        let displayRecord = (rawRecord > 20) ? "CLEAR" : (Math.max(0, rawRecord - 1) + "층");
        let colorStyle = (rawRecord > 20) ? "color:#f1c40f; font-weight:bold;" : "color:#bdc3c7;";

        let data = JOB_DATA[j];
        html += `<div class="char-card" onclick="showCharacterDetail('${j}')">
                    <h3>${data.name.toUpperCase()}</h3>
                    <img src="./img/${data.name}.webp" alt="${data.name}">
                    <p style="${colorStyle} margin-top:10px;">최고 기록: ${displayRecord}</p>
                 </div>`; 
    });
    
    $("#char-grid-container").html(html);
}

function showCharacterDetail(jobKey) {
    selectedJobKey = jobKey;
    let data = JOB_DATA[jobKey];
    
    $("#char-selection-view").hide();
    $("#char-detail-view").css("display", "flex");
    
    $("#detail-img").attr("src", `./img/${data.name}.webp`);
    $("#detail-name").text(data.name.toUpperCase());
    
    let basicAtkInfo = (jobKey === 'warrior' || jobKey === 'rogue') ? '공격력 × 0.3' : (jobKey === 'mage' ? '공격력 × 0.2' : '(공격력 × 0.1)×3타');
    let healSkillInfo = (jobKey === 'mage' ? '최대체력 × 0.4' : '최대체력 × 0.2');
    
    let html = `
        <div class="detail-stat-box">
            <div class="detail-stat-row"><span>❤ 체력</span> <span>${data.maxHp}</span></div>
            <div class="detail-stat-row"><span>💧 마나</span> <span>${data.maxMp}</span></div>
            <div class="detail-stat-row"><span>⚔ 공격력</span> <span>${data.atk}</span></div>
            <div class="detail-stat-row"><span>⚡ 스피드</span> <span>${data.speed}</span></div>
            <div class="detail-stat-row"><span>🛡 방어율</span> <span>${data.avoid}%</span></div>
            <div class="detail-stat-row"><span>💥 치명타</span> <span>${data.crit}%</span></div>
            <div class="detail-stat-row"><span>✚ 체력회복</span> <span>${data.hpRegen}</span></div>
            <div class="detail-stat-row"><span>✚ 마나회복</span> <span>${data.mpRegen}</span></div>
        </div>
        <br/>
        <p><strong>[기본 공격]</strong> ${basicAtkInfo}</p>
        <p><strong>[회복 스킬]</strong> ${healSkillInfo}</p>
        
        <div class="detail-skill-box">
            <div class="detail-skill-title">🔹 ${data.skills[0].name}</div>
            <div style="font-size:0.9em; white-space:pre-wrap;">${data.skills[0].desc}</div>
        </div>
        <div class="detail-skill-box">
            <div class="detail-skill-title">🔸 ${data.skills[1].name}</div>
            <div style="font-size:0.9em; white-space:pre-wrap;">${data.skills[1].desc}</div>
        </div>
    `;
    
    $("#detail-content").html(html);
}

function startGameWith(jobKey) {
    player = JSON.parse(JSON.stringify(JOB_DATA[jobKey])); 
    player.job = jobKey; 
    gameData.floor = 1;
    player.defStacks = 3; 

    if (isDebugMode) {
        gameData.floor = 20;
        player.maxHp *= 2; 
        player.hp = player.maxHp;
        player.atk *= 5;
        player.maxMp = Math.floor(player.maxMp * 1.5); 
        player.mp = player.maxMp;
        isDebugMode = false; 
        console.log(">> 디버그 모드: 20층 시작, 공격력 5배 적용");
    }

    $("#char-select-screen").hide();
    $("#game-wrapper").show();
    restoreActionPanel(); loadEnemy(gameData.floor); saveGame();
}

function restoreActionPanel() {
    $("#action-panel").css("display", "grid").html(`
        <button class="action-btn btn-atk" id="btn-attack" title="기본 공격&#10;MP 소모 없음">⚔️ 공격</button>
        <button class="action-btn btn-skill" id="btn-skill-1" title="스킬1">스킬1</button>
        <button class="action-btn btn-skill" id="btn-skill-2" title="스킬2">스킬2</button>
        <button class="action-btn btn-def" id="btn-defend" title="적의 공격을 방어합니다." style="grid-column: span 1.5;">🛡️ 방어</button>
        <button class="action-btn btn-heal" id="btn-heal" title="MP 3 소모&#10;체력을 회복합니다." style="grid-column: span 1.5;">💊 회복</button>
    `);
    bindActionEvents();
}

function loadEnemy(floor) {
    if (floor > 20) { alert("클리어!"); localStorage.removeItem(SAVE_KEY); location.reload(); return; }
    const data = enemiesData.find(e => e.floor === floor);
    enemy = JSON.parse(JSON.stringify(data));
    $("#enemy-img").attr("src", `./img/${enemy.name}.webp`);
    $("#player-img").attr("src", `./img/${player.name}.webp`);
    $("#current-floor").text("Floor: " + floor);
    $("#enemy-name-disp").text(enemy.name);
    $("#player-job-disp").text(player.name);
    
    $("#btn-skill-1").text(player.skills[0].name);
    $("#btn-skill-2").text(player.skills[1].name);

    if (floor > 1) {
        player.defStacks = Math.min(3, (player.defStacks || 0) + 1);
        log(`> 층 이동 보너스: 방어 스택 +1 (현재: ${player.defStacks})`);
    }

    let keptMageStack = battleState.mageStack || 0;
    resetBattleState();
    if (player.job === "mage") battleState.mageStack = keptMageStack;

    gameData.isBattleOver = false;
    isAnimating = false;
    $(".action-btn").prop("disabled", false);
    updateUI(); 
    $("#game-log").html("");
    log(`[${floor}층] ${enemy.name} 출현!`);
}

function resetBattleState() {
    battleState = { 
        playerDefending: false, enemyDefending: false, 
        rogueStealthTurns: 0, rogueStealthCooldown: 0, 
        mageStack: 0, archerBuffTurns: 0, archerSkill1Cooldown: 0, 
        warriorCounter: false, sureShot: false,
        bossDmgCut: 0, playerSilence: 0
    };
}

async function runTurn(playerAction) {
    if (gameData.isBattleOver || isAnimating) return;
    if (["skill1", "skill2", "heal"].includes(playerAction)) {
        let btnId = (playerAction === "heal") ? "#btn-heal" : (playerAction === "skill1" ? "#btn-skill-1" : "#btn-skill-2");
        if ($(btnId).prop("disabled")) return;
    }
    if (playerAction === "defend" && player.defStacks <= 0) {
        log("! 방어 스택이 부족합니다."); return;
    }
    if (!checkCostAndCooldown(playerAction)) return;
    
    try {
        isAnimating = true; $(".action-btn").prop("disabled", true); 
        let pAct = { type: playerAction, priority: 0, speed: player.speed, actor: "player" };
        if (["defend", "heal"].includes(playerAction)) pAct.priority = 1;
        battleState.playerDefending = (playerAction === "defend");
        battleState.warriorCounter = (player.job === "warrior" && playerAction === "skill1");
        battleState.sureShot = (player.job === "archer" && playerAction === "skill2");

        let eChoice = "attack";

        if (enemy.floor === 20) {
            // 마왕 패턴
            // 침묵: 30% 확률
            if (enemy.mp >= 50 && battleState.playerSilence === 0 && Math.random() < 0.3) {
                eChoice = "boss_skill_silence";
            } 
            // 장막: 15% 확률
            else if (enemy.mp >= 30 && battleState.bossDmgCut === 0 && Math.random() < 0.15) {
                eChoice = "boss_skill_shield";
            } 
            else if (Math.random() < 0.2) eChoice = "defend";
        } else {
            let enemyCanHeal = (enemy.mp >= 3) && (enemy.hp < enemy.maxHp * 0.9);
            if (enemyCanHeal && Math.random() < 0.3) eChoice = "heal"; else if (Math.random() < 0.2) eChoice = "defend";
        }

        let eAct = { type: eChoice, priority: 0, speed: enemy.speed, actor: "enemy" };
        if (["defend", "heal", "boss_skill_shield", "boss_skill_silence"].includes(eChoice)) eAct.priority = 1;
        
        let first = pAct, second = eAct;
        if (eAct.priority > pAct.priority) { first = eAct; second = pAct; }
        else if (pAct.priority === eAct.priority && enemy.speed > player.speed) { first = eAct; second = pAct; }

        log(`--- 턴 시작 ---`);
        await executeAction(first, second);
        if (player.hp > 0 && enemy.hp > 0) { await delay(500); await executeAction(second, first); }
        await delay(500); await postTurnProcess(playerAction); 
        updateUI(); saveGame(); checkWinLoss();
    } catch (error) { console.error(error); log("! 오류 발생"); } 
    finally { isAnimating = false; updateButtonStates(); }
}

function checkCostAndCooldown(action) {
    let cost = 0;
    if (action === "heal") cost = 3;
    if (player.job === "warrior") { if (action === "skill1") cost=5; if (action === "skill2") cost=4; }
    if (player.job === "rogue") { if (action === "skill1") cost=7; if (action === "skill2") cost=3; }
    if (player.job === "mage") { if (action === "skill1") cost=5; if (action === "skill2") cost=5; }
    if (player.job === "archer") { 
        if (action === "skill1") {
            if (battleState.archerSkill1Cooldown > 0) { log("! 쿨타임 중"); return false; }
            cost = 5; 
        } 
        if (action === "skill2") cost = 6; 
    }
    if (player.mp < cost) return false;
    player.mp -= cost; return true;
}

function calcDmg(base, atk, ratio, crit) {
    let d = base + (atk * ratio);
    let isCrit = false;
    if (Math.random() * 100 < crit) {
        d *= 1.3;
        isCrit = true;
    }
    return { val: Math.round(d), isCrit: isCrit };
}
function isHit(avoid) { return Math.random() * 100 >= avoid; }

async function executeAction(actObj, otherActObj) {
    if (player.hp <= 0 || enemy.hp <= 0) return;
    let actor = actObj.actor; let action = actObj.type; let me = (actor === "player") ? player : enemy;
    let isMyTurn = (actor === "player"); let nameTag = isMyTurn ? `[${player.name}]` : `[${enemy.name}]`;
    let isTargetDefending = isMyTurn ? battleState.enemyDefending : battleState.playerDefending;
    if (!isMyTurn && action === "defend") battleState.enemyDefending = true;
    let warriorCounterTriggered = false; let dResult = { val:0, isCrit:false }; let msg = "";

    switch (action) {
        case "defend": 
            msg = `${nameTag} 방어 태세!`; 
            if (isMyTurn) { player.defStacks--; log(`> 방어 스택 1 소모 (남은 스택: ${player.defStacks})`); }
            await triggerAnim(actor, "defend"); 
            break;
        case "heal":
            let ratio = (me.job === "mage") ? 0.3 : 0.1; let heal = Math.round(me.maxHp * ratio);
            if (!isMyTurn && me.mp >= 3) me.mp -= 3; me.hp = Math.min(me.hp + heal, me.maxHp);
            msg = `${nameTag} 체력 회복 (+${heal})`; await triggerAnim(actor, "heal"); 
            showFloatingText(actor, `+${heal}`, "heal"); updateUI(); break;
        
        case "boss_skill_shield":
            me.mp -= 30; battleState.bossDmgCut = 3;
            msg = `[${me.name}] 어둠의 장막! (받는 피해 절반)`;
            await triggerAnim(actor, "defend");
            break;
        case "boss_skill_silence":
            me.mp -= 50; battleState.playerSilence = 2;
            msg = `[${me.name}] 침묵의 저주! (행동 봉인)`;
            await triggerAnim(actor, "attack-e");
            break;

        case "attack": case "skill1": case "skill2":
            let animType = isMyTurn ? "attack-p" : "attack-e";
            if(action === "skill1" && isMyTurn && player.job==="mage") {
                battleState.mageStack++; msg = `마력 응축 (${battleState.mageStack})`; await triggerAnim(actor, "heal");
            } else if (action === "skill1" && isMyTurn && player.job==="rogue") {
                 battleState.rogueStealthTurns = 3; battleState.rogueStealthCooldown = 3; 
                 player.avoid+=30; player.speed+=30; 
                 msg = "연막 은신!"; await triggerAnim(actor, "defend");
            } else if (action === "skill1" && isMyTurn && player.job==="warrior") {
                msg = "정당방위 태세!"; await triggerAnim(actor, "defend");
            } else if (action === "skill1" && isMyTurn && player.job==="archer") {
                log(`[궁수] 마법화살 시전! (3연사 발동)`); await executeArcherMultiHit(true); 
                battleState.archerBuffTurns = 3; battleState.archerSkill1Cooldown = 5; return;
            } else {
                if (isMyTurn && player.job === "archer" && (action === "attack" || action === "skill2")) {
                    let isSkill2 = (action === "skill2"); let skillMsg = isSkill2 ? "[명중] 필중 사격!" : "3연사 발동!";
                    log(skillMsg); await executeArcherMultiHit(false, isSkill2); return; 
                }
                await triggerAnim(actor, animType);
                if(action === "attack") {
                     if(isMyTurn && player.job==="mage" && battleState.mageStack > 0) { 
                         let base = me.atk * 0.7; 
                         dResult.val = Math.round(base * battleState.mageStack * 2.5); 
                         dResult.isCrit = false; 
                         battleState.mageStack=0; msg=`익스플로전!`; 
                     } else { 
                         let base = 0;
                         let scale = isMyTurn ? 0.8 : 0.9; 
                         if(isMyTurn && player.job==="mage") scale = 0.7; 

                         dResult = calcDmg(base, me.atk, scale, me.crit); msg = `기본 공격`; 
                     }
                } else if (action === "skill2") {
                     if(isMyTurn && player.job==="warrior") { 
                         dResult = calcDmg(0, me.atk, 0.8, me.crit); dResult.val = Math.round(dResult.val * 2.5); msg="강타!"; 
                     }
                     if(isMyTurn && player.job==="rogue") { 
                         dResult = calcDmg(0, me.atk, 0.8, me.crit); dResult.val += me.speed; msg="기습!"; 
                     }
                     if(isMyTurn && player.job==="mage") { 
                         dResult = calcDmg(0, me.atk, 1.5, me.crit); msg="에너지볼!"; 
                     }
                }
            }
            break;
    }

    if (dResult.val > 0) {
        let dmg = dResult.val;
        let type = dResult.isCrit ? "crit" : "dmg";
        let targetAvoid = isMyTurn ? enemy.avoid : player.avoid; let isSureShot = isMyTurn ? battleState.sureShot : false;
        
        if (!isSureShot && !isHit(targetAvoid)) { log(msg + " -> 빗나감!"); showFloatingText(isMyTurn ? "enemy" : "player", "MISS", "miss"); } 
        else if (isTargetDefending) { 
            log(msg + " -> 방어됨 (0 피해)"); let targetActor = isMyTurn ? "enemy" : "player"; 
            await triggerAnim(targetActor, "defend"); showFloatingText(targetActor, "BLOCK", "block"); 
        } 
        else {
            if (!isMyTurn && player.job === "mage" && otherActObj.type === "skill1") { dmg = Math.round(dmg * 0.5); msg += " (마력보호)"; }
            
            if (isMyTurn) { 
                if (battleState.bossDmgCut > 0) {
                    dmg = Math.round(dmg * 0.5);
                    msg += " (어둠의 장막: 피해 반감)";
                }

                enemy.hp = Math.max(0, enemy.hp - dmg); log(`${msg} -> 적에게 ${dmg} 피해.`); 
                await triggerAnim("enemy", "hit"); showFloatingText("enemy", dmg, type);
            } else {
                 if (player.job === "warrior" && battleState.warriorCounter) {
                    warriorCounterTriggered = true; let reduced = Math.round(dmg * 0.5); player.hp = Math.max(0, player.hp - reduced);
                    log(`${msg} -> 반격 발동! (${reduced} 피해만 입음)`); await triggerAnim("player", "hit"); showFloatingText("player", reduced, "dmg");
                    await delay(300); await triggerAnim("player", "attack-p"); 
                    
                    let cntRes = calcDmg(0, player.atk, 0.8, player.crit); 
                    let cnt = reduced + cntRes.val; 
                    if (battleState.bossDmgCut > 0) cnt = Math.round(cnt * 0.5);

                    enemy.hp = Math.max(0, enemy.hp - cnt); log(`> [반격] 적에게 ${cnt} 피해!`); 
                    await triggerAnim("enemy", "hit"); showFloatingText("enemy", cnt, cntRes.isCrit ? "crit":"dmg");
                } else { 
                    player.hp = Math.max(0, player.hp - dmg); log(`${msg} -> ${dmg} 피해를 입음.`); 
                    await triggerAnim("player", "hit"); showFloatingText("player", dmg, type);
                }
            }
        }
    } else { if (msg) log(msg); }

    if (!isMyTurn && player.job === "warrior" && battleState.warriorCounter && !warriorCounterTriggered) {
        await delay(300); log(`[전사] 빈틈을 노려 추가 공격!`); await triggerAnim("player", "attack-p");
        let basicRes = calcDmg(0, player.atk, 0.8, player.crit); 
        let basicDmg = basicRes.val;
        if (battleState.bossDmgCut > 0) basicDmg = Math.round(basicDmg * 0.5); 
        
        enemy.hp = Math.max(0, enemy.hp - basicDmg); 
        log(`> [추가타] 적에게 ${basicDmg} 피해.`); await triggerAnim("enemy", "hit"); showFloatingText("enemy", basicDmg, basicRes.isCrit?"crit":"dmg");
    }
    updateUI(); 
}

async function executeArcherMultiHit(isMagicArrowTurn, isSkill2) {
    let totalDmg = 0;
    for (let i = 1; i <= 3; i++) {
        if (enemy.hp <= 0) break;
        await triggerAnim("player", "attack-p", 150); 
        let shotRes = calcDmg(0, player.atk, 0.35, player.crit);
        let hit = true; if (isSkill2) hit = true; else hit = isHit(enemy.avoid);

        if (hit) {
            if (battleState.enemyDefending && !isSkill2) { log(`> [${i}타] 방어됨.`); showFloatingText("enemy", "BLOCK", "block"); } 
            else {
                let finalDmg = shotRes.val; 
                if (isSkill2 && !battleState.enemyDefending) finalDmg *= 2;
                if (battleState.bossDmgCut > 0) finalDmg = Math.round(finalDmg * 0.5);

                enemy.hp = Math.max(0, enemy.hp - finalDmg);
                log(`> [${i}타] 적에게 ${finalDmg} 피해.`);
                await triggerAnim("enemy", "hit", 150);
                showFloatingText("enemy", finalDmg, shotRes.isCrit ? "crit" : "dmg");
                totalDmg += finalDmg;
            }
        } else { log(`> [${i}타] 빗나감!`); showFloatingText("enemy", "MISS", "miss"); }
        await delay(100);
    }
    if (isMagicArrowTurn || battleState.archerBuffTurns > 0) {
        if (enemy.hp > 0 && totalDmg > 0) {
            let magicDmg = Math.round(totalDmg * 0.3); 
            if (battleState.bossDmgCut > 0) magicDmg = Math.round(magicDmg * 0.5);
            enemy.hp = Math.max(0, enemy.hp - magicDmg);
            log(`> [마법화살] 추가 ${magicDmg} 피해!`); await triggerAnim("enemy", "hit", 200); showFloatingText("enemy", magicDmg, "dmg");
        }
    }
}

async function postTurnProcess(playerAction) {
    let pOldHp = player.hp, pOldMp = player.mp; let eOldHp = enemy.hp, eOldMp = enemy.mp;
    if(player.hp > 0) { player.hp = Math.min(player.hp + player.hpRegen, player.maxHp); player.mp = Math.min(player.mp + player.mpRegen, player.maxMp); }
    if(enemy.hp > 0) { enemy.hp = Math.min(enemy.hp + enemy.hpRegen, enemy.maxHp); enemy.mp = Math.min(enemy.mp + enemy.mpRegen, enemy.maxMp); }
    let pHpDiff = player.hp - pOldHp, pMpDiff = player.mp - pOldMp; let eHpDiff = enemy.hp - eOldHp, eMpDiff = enemy.mp - eOldMp;
    
    if (pHpDiff > 0 || pMpDiff > 0) { 
        log(`[턴 종료] 나: HP+${pHpDiff}, MP+${pMpDiff}`); triggerAnim("player", "heal"); 
        if(pHpDiff > 0) showFloatingText("player", `+${pHpDiff}`, "heal");
    }
    if (eHpDiff > 0 || eMpDiff > 0) { 
        log(`[턴 종료] 적: HP+${eHpDiff}, MP+${eMpDiff}`); triggerAnim("enemy", "heal"); 
        if(eHpDiff > 0) showFloatingText("enemy", `+${eHpDiff}`, "heal");
    }
    await delay(600);
    
    if (battleState.bossDmgCut > 0) battleState.bossDmgCut--;
    if (battleState.playerSilence > 0) battleState.playerSilence--;

    if (player.job === "rogue") { 
        if (battleState.rogueStealthTurns > 0) { 
            battleState.rogueStealthTurns--; 
            if (battleState.rogueStealthTurns === 0) { player.avoid -= 30; player.speed -= 30; log("! 은신 해제"); } 
        } 
        if (battleState.rogueStealthCooldown > 0) battleState.rogueStealthCooldown--; 
    }
    if (player.job === "archer") {
        if (battleState.archerBuffTurns > 0) battleState.archerBuffTurns--;
        if (battleState.archerSkill1Cooldown > 0) battleState.archerSkill1Cooldown--;
    }
    if (playerAction !== "defend" && player.defStacks < 3) { player.defStacks++; }
    battleState.enemyDefending = false;
}

function updateButtonStates() {
    if (gameData.isBattleOver) { $(".action-btn").prop("disabled", true); return; }
    
    let isSilenced = battleState.playerSilence > 0;

    $("#btn-attack").prop("disabled", false);
    
    $("#btn-defend").prop("disabled", player.defStacks <= 0 || isSilenced)
        .html(isSilenced ? "🚫 침묵" : `🛡️ 방어<br><span style='font-size:0.7em'>(${player.defStacks}/3)</span>`); 
    
    let healCost = 3; 
    $("#btn-heal").prop("disabled", player.mp < healCost || isSilenced);

    const skills = player.skills;
    const updateSkillBtn = (btnId, skillIdx, cooldown, buffTurns) => {
        let skill = skills[skillIdx]; let $btn = $(btnId);
        let isDisabled = player.mp < skill.cost;
        let tooltip = skill.desc; let btnText = skill.name;

        if (isSilenced) {
            isDisabled = true;
            tooltip += "\n\n[침묵 상태: 사용 불가]";
            btnText += " (🚫)";
        } 
        else if (player.job === "mage" && skillIdx === 0) { btnText += ` (Stack: ${battleState.mageStack})`; }

        if (!isSilenced && cooldown > 0) { isDisabled = true; tooltip += `\n\n[재사용 대기중: ${cooldown}턴]`; btnText += ` (${cooldown})`; } 
        else if (!isSilenced && buffTurns > 0) { isDisabled = true; tooltip += `\n\n[효과 지속중: ${buffTurns}턴]`; btnText += " (On)"; }

        $btn.text(btnText).attr("title", tooltip).prop("disabled", isDisabled);
    };

    let s1Cooldown = 0, s1Buff = 0;
    if (player.job === "rogue") { s1Cooldown = battleState.rogueStealthCooldown; s1Buff = battleState.rogueStealthTurns; }
    if (player.job === "archer") { s1Cooldown = battleState.archerSkill1Cooldown; s1Buff = battleState.archerBuffTurns; }

    updateSkillBtn("#btn-skill-1", 0, s1Cooldown, s1Buff);
    updateSkillBtn("#btn-skill-2", 1, 0, 0);
}

function updateUI() {
    $("#p-hp").text(player.hp); $("#p-max-hp").text(player.maxHp); $("#p-mp").text(player.mp); $("#p-max-mp").text(player.maxMp);
    $("#p-atk").text(player.atk); $("#p-spd").text(player.speed); $("#p-cri").text(player.crit); $("#p-avd").text(player.avoid);
    $("#p-hp-regen").text(player.hpRegen); $("#p-mp-regen").text(player.mpRegen);
    $("#e-hp").text(enemy.hp); $("#e-max-hp").text(enemy.maxHp); $("#e-mp").text(enemy.mp); $("#e-max-mp").text(enemy.maxMp);
    $("#e-atk").text(enemy.atk); $("#e-spd").text(enemy.speed); $("#e-cri").text(enemy.crit); $("#e-avd").text(enemy.avoid);
    $("#e-hp-regen").text(enemy.hpRegen); $("#e-mp-regen").text(enemy.mpRegen);
    $("#p-hp-bar").css("width", (player.hp / player.maxHp) * 100 + "%"); $("#p-mp-bar").css("width", (player.mp / player.maxMp) * 100 + "%");
    $("#e-hp-bar").css("width", (enemy.hp / enemy.maxHp) * 100 + "%"); $("#e-mp-bar").css("width", (enemy.mp / enemy.maxMp) * 100 + "%");
    
    if (battleState.bossDmgCut > 0) {
        $("#enemy-name-disp").html(`${enemy.name} <span style="color:#e74c3c; font-size:0.8em; font-weight:bold;">(🛡️${battleState.bossDmgCut})</span>`);
    } else {
        $("#enemy-name-disp").text(enemy.name);
    }

    if (!isAnimating) updateButtonStates();
}

function isHit(avoid) { return Math.random() * 100 >= avoid; }

function checkWinLoss() {
    if (player.hp <= 0) {
        gameData.isBattleOver = true; saveMaxRecord(gameData.floor); alert("패배! 기록: " + gameData.floor + "층"); localStorage.removeItem(SAVE_KEY); location.reload();
    } else if (enemy.hp <= 0) {
        gameData.isBattleOver = true; 
        if (player.job === "rogue" && battleState.rogueStealthTurns > 0) { player.avoid -= 30; player.speed -= 30; log("! 전투 승리로 은신 해제 (스탯 복구)"); }
        player.savedMageStack = battleState.mageStack; 

        // [수정] 20층 클리어 시 기록을 21로 저장 (완전 클리어 구분)
        if (gameData.floor === 20) {
            saveMaxRecord(21);
            localStorage.removeItem(SAVE_KEY);
            log("축하합니다! 마왕을 처치했습니다!");
            setTimeout(showGameClearPopup, 800);
        } else {
            log("승리! 보상 선택.");
            setTimeout(showRewardPopup, 800);
        }
    }
}

function saveMaxRecord(floor) {
    let records = JSON.parse(localStorage.getItem(MAX_RECORDS_KEY) || "{}");
    let currentMax = records[player.job] || 0;
    if (floor > currentMax) { records[player.job] = floor; localStorage.setItem(MAX_RECORDS_KEY, JSON.stringify(records)); }
}
function saveGame() { if(player.hp > 0) { player.savedMageStack = battleState.mageStack; localStorage.setItem(SAVE_KEY, JSON.stringify({ player: player, floor: gameData.floor })); } }
function log(text) { const $log = $("#game-log"); $log.append(`<p>${text}</p>`); $log.scrollTop($log[0].scrollHeight); }

const STAT_KEYS = [ { key: "atk", name: "공격력" }, { key: "maxHp", name: "최대체력" }, { key: "maxMp", name: "최대마나" }, { key: "speed", name: "스피드" }, { key: "crit", name: "치명타" }, { key: "avoid", name: "회피율" }, { key: "hpRegen", name: "HP회복" }];

function showRewardPopup() {
    let healAmt = Math.round(player.maxHp * 0.1); player.hp = Math.min(player.hp + healAmt, player.maxHp); player.mp = player.maxMp;
    let options = [{ type: "heal", text: "체력 50% 회복 (고정)" }];
    let pool = [...STAT_KEYS];
    for (let i = 0; i < 3; i++) { let idx = Math.floor(Math.random() * pool.length); options.push({ type: "stat", data: pool[idx], text: `${pool[idx].name} 증가` }); pool.splice(idx, 1); }
    currentRewardOptions = options; selectedRewards = [];
    let html = ""; options.forEach((opt, idx) => { html += `<div class="menu-btn" id="reward-btn-${idx}" onclick="selectReward(${idx})">${opt.text}</div>`; });
    $("#reward-options").html(html); $("#btn-reward-confirm").prop("disabled", true).text("2개를 선택하세요"); $("#reward-overlay").show();
}
window.selectReward = function(idx) {
    let btn = $(`#reward-btn-${idx}`);
    if (selectedRewards.includes(idx)) { selectedRewards = selectedRewards.filter(i => i !== idx); btn.css("background", "").css("color", ""); } 
    else { if (selectedRewards.length < 2) { selectedRewards.push(idx); btn.css("background", "#f1c40f").css("color", "#2c3e50"); } }
    $("#btn-reward-confirm").prop("disabled", selectedRewards.length !== 2).text(selectedRewards.length === 2 ? "다음 층으로" : `${selectedRewards.length}/2 선택됨`);
};

window.applyRewardsAndNextFloor = function() {
    selectedRewards.forEach(idx => {
        let opt = currentRewardOptions[idx];
        if (opt.type === "heal") { let amt = Math.round(player.maxHp * 0.5); player.hp = Math.min(player.hp + amt, player.maxHp); } 
        else {
            let k = opt.data.key;
            if (k === "atk") player.atk = Math.round(player.atk * 1.3);
            else if (k === "maxHp") { player.maxHp = Math.round(player.maxHp * 1.05); player.hp = Math.round(player.hp * 1.05); }
            else if (k === "maxMp") player.maxMp += 1;
            else if (k === "speed") player.speed = Math.round(player.speed * 1.1);
            else if (k === "crit") player.crit += 5;
            else if (k === "avoid") player.avoid += 3;
            else if (k === "hpRegen") player.hpRegen += 1;
        }
    });
    $("#reward-overlay").hide();

    if (gameData.floor % 5 === 0) {
        player.atk = Math.round(player.atk * 1.1);
        player.maxHp = Math.round(player.maxHp * 1.1);
        player.hp = Math.round(player.hp * 1.1); 
    }
    let bonusMpRegen = 0;
    if (gameData.floor % 10 === 0) {
        player.mpRegen += 1;
        bonusMpRegen = 1;
    }
    
    gameData.floor++;
    saveGame();
    loadEnemy(gameData.floor);

    if ((gameData.floor - 1) % 5 === 0) {
        log(`======== [보스 격파 보너스] ========`);
        log(`> 공격력, 체력 10% 영구 상승!`);
        if (bonusMpRegen > 0) log(`> 턴당 MP 회복량 +1 증가!`);
        log(`=================================`);
    }
};

function showGameClearPopup() {
    let html = `
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#f1c40f; margin-bottom:10px;">🏆 GAME CLEAR! 🏆</h2>
            <p style="color:#ecf0f1; font-size:0.9em;">마왕을 쓰러뜨리고<br>던전의 평화를 되찾았습니다.</p>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; text-align:left; font-size:0.9em;">
            <p style="color:#bdc3c7; border-bottom:1px solid #555; padding-bottom:5px; margin-bottom:10px;">
                최종 직업: <strong style="color:#fff; font-size:1.1em;">${player.name.toUpperCase()}</strong>
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; color:#ecf0f1;">
                <span>❤ 체력: ${player.maxHp}</span>
                <span>💧 마나: ${player.maxMp}</span>
                <span>⚔ 공격력: ${player.atk}</span>
                <span>⚡ 스피드: ${player.speed}</span>
                <span>💥 치명타: ${player.crit}%</span>
                <span>🛡 회피율: ${player.avoid}%</span>
            </div>
        </div>
        <button class="menu-btn" onclick="location.reload()" style="margin-top:20px; background:#f39c12; color:#2c3e50;">메인으로 돌아가기</button>
    `;
    $(".reward-modal").html(html);
    $("#reward-overlay").show();
}