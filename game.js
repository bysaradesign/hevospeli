const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    scene: { preload, create, update },
    physics: { default: 'arcade' }
};

const game = new Phaser.Game(config);

let player, cursors, wasd, horses = [], stalls = [], currentTask = 0, tasks = [], selectedHorse = null;

function preload() {
    // Luodaan paikkamerkkikuvia koodissa (ei tarvita ulkoisia tiedostoja)
    this.textures.generate('bg', { data: ['#bbf'], pixelWidth: 1024, pixelHeight: 768 });
    this.textures.generate('stable', { data: ['#994d1a'], pixelWidth: 450, pixelHeight: 200 });
    this.textures.generate('player', { data: ['#f9a', '#fff'], pixelWidth: 64, pixelHeight: 64 });
    this.textures.generate('horse', { data: ['#a52a2a', '#fff'], pixelWidth: 64, pixelHeight: 64 });
}

function create() {
    this.add.rectangle(512, 384, 1024, 768, 0xbbccff); // tausta
    this.add.rectangle(700, 350, 450, 200, 0x994d1a); // talli

    // Pelaaja
    player = this.physics.add.sprite(200, 500, 'player').setScale(1).setCollideWorldBounds(true);
    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys('W,A,S,D');

    // Karsinat ja hevoset
    for(let i=0; i<15; i++) {
        let x = 180 + (i % 5) * 150;
        let y = 150 + Math.floor(i/5)*110;
        let horseObj = {
            sprite: this.add.sprite(x, y, 'horse').setScale(1),
            hunger: 100, cleanliness: 100, name: `Hevonen ${i+1}`, stall: i, x, y
        };
        horses.push(horseObj);
        stalls.push({x, y});
    }

    // Tehtävät
    tasks = [
        {desc: "Harjaa Hevonen 1", done: false, action: "brush", horse: 0},
        {desc: "Ruoki Hevonen 2", done: false, action: "feed", horse: 1}
    ];

    // Tallennus
    loadGame();

    // Näytä tehtävä
    this.taskText = this.add.text(20, 20, getTaskText(), { fontSize: '20px', fill: '#fff' });


    // Klikkaa hevosta
    this.input.on('pointerdown', pointer => {
        horses.forEach((h, i) => {
            if (pointer.x > h.x-32 && pointer.x < h.x+32 && pointer.y > h.y-32 && pointer.y < h.y+32) {
                selectedHorse = i;
                showHorseMenu.call(this, i);
            }
        });
    });
}

function update() {
    let speed = 200;
    player.setVelocity(0);
    if (cursors.left.isDown || wasd.A.isDown) player.setVelocityX(-speed);
    if (cursors.right.isDown || wasd.D.isDown) player.setVelocityX(speed);
    if (cursors.up.isDown || wasd.W.isDown) player.setVelocityY(-speed);
    if (cursors.down.isDown || wasd.S.isDown) player.setVelocityY(speed);
}

// Hevosen interaktio
function showHorseMenu(horseIndex) {
    const h = horses[horseIndex];
    let menu = document.getElementById('horse-menu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'horse-menu';
        document.body.appendChild(menu);
    }
    menu.innerHTML = `<b>${h.name}</b><br>
        Nälkä: ${h.hunger} <button onclick="feedHorse(${horseIndex})">Ruoki</button><br>
        Puhtaus: ${h.cleanliness} <button onclick="brushHorse(${horseIndex})">Harjaa</button><br>
        <button onclick="closeMenu()">Sulje</button>`;
}

window.feedHorse = function(horseIndex) {
    horses[horseIndex].hunger = 100;
    game.scene.scenes[0].sound.play('eat');
    checkTask('feed', horseIndex);
    saveGame();
    closeMenu();
};
window.brushHorse = function(horseIndex) {
    horses[horseIndex].cleanliness = 100;
    game.scene.scenes[0].sound.play('brush');
    checkTask('brush', horseIndex);
    saveGame();
    closeMenu();
};
window.closeMenu = function() {
    let menu = document.getElementById('horse-menu');
    if (menu) menu.remove();
};

function checkTask(action, horseIndex) {
    if (currentTask < tasks.length) {
        let t = tasks[currentTask];
        if (t.action === action && t.horse === horseIndex) {
            t.done = true;
            currentTask++;
            game.scene.scenes[0].taskText.setText(getTaskText());
        }
    }
}

function getTaskText() {
    if (currentTask < tasks.length) return "Tehtävä: " + tasks[currentTask].desc;
    return "Kaikki tehtävät tehty!";
}

function saveGame() {
    localStorage.setItem('horses', JSON.stringify(horses));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('currentTask', currentTask);
}
function loadGame() {
    let h = localStorage.getItem('horses');
    if (h) horses = JSON.parse(h);
    let t = localStorage.getItem('tasks');
    if (t) tasks = JSON.parse(t);
    let c = localStorage.getItem('currentTask');
    if (c) currentTask = parseInt(c);
}