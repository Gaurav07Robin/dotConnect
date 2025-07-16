const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#222222',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: { preload, create, update },
  input: {
    activePointers: 3,
    touch: true
  },
  plugins: {
    scene: [
      {
        key: 'LightsPlugin',
        plugin: Phaser.GameObjects.LightsPlugin,
        mapping: 'lights'
      }
    ]
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

const game = new Phaser.Game(config);

//connected
let gameOver = false;
let connectSound;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScore = parseInt(highScore, 10);
let highScoreText;
let scoreText;




let restartButton;
let dots = [];
let scrollSpeed = 1;
let elapsedTime = 0;
let maxVisibleDots = 10;
const screenMin = Math.min(window.innerWidth, window.innerHeight);
let dotRadius = screenMin * 0.08; // 4% of smaller screen dimension
let outerRadius = dotRadius * 3.2;

let colorPalette = [0xff4f4f, 0x4fff90, 0x4fc3ff, 0xfff94f, 0xff9d4f, 0xaf4fff, 0x4ffff1, 0xffffff, 0x999999];


let graphics;
let dotArray = [];
//connectedDots
function preload() {
    this.load.audio('connectSound', 'assets/connect.mp3'); // path to your sound file
    this.load.image('bubble', 'assets/bubble2.png');
  }
//light
function create() {
  

  graphics = this.add.graphics();
  this.lights.enable();
this.lights.setAmbientColor(0x888888);
const light = this.lights.addLight(400, 300, 200).setColor(0xffffff).setIntensity(4);

this.input.on('pointermove', pointer => {
  light.x = pointer.x;
  light.y = pointer.y + this.cameras.main.scrollY;
});


  const scene = this;
  // this.input.mouse.disableContextMenu();
  this.cameras.main.scrollY = 0;
  this.cameras.main.setBounds(0, 0, config.width, 100000);

const initialDotCount = screenMin < 500 ? 8 : 12;
  ;
  const outerRadius = 70;
  const maxAttempts = 50;
  connectSound = this.sound.add('connectSound');

  // Place initial dots
  for (let i = 0; i < initialDotCount; i++) {
    let placed = false;

    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      const x = Phaser.Math.Between(60, config.width - 60);
      const y = Phaser.Math.Between(100, config.height + 300);

      const overlaps = dots.some(other =>
        Phaser.Math.Distance.Between(x, y, other.x, other.y) < outerRadius
      );

      if (!overlaps) {
        const color = Phaser.Utils.Array.GetRandom(colorPalette);
        // Instead of this:
// const dot = scene.add.circle(x, y, dotRadius, color);

// Do this:
const dot = scene.add.sprite(x, y, 'bubble');
dot.setDisplaySize(dotRadius * 2, dotRadius * 2);  // size the sprite to dotRadius
dot.setTint(color);  // tint the sprite with your dot color for variety
dot.setPipeline('Light2D');

dot.setData('connected', false);
dot.colorId = color;
dots.push(dot);

      
        placed = true;
      }
    }

    // Fallback placement
    if (!placed) {
      const color = Phaser.Utils.Array.GetRandom(colorPalette);
      // const fallbackDot = scene.add.circle(
      //   Phaser.Math.Between(60, config.width - 60),
      //   config.height + 300,
      //   30,
      //   color
      // );
      const fallbackDot = scene.add.sprite(
        Phaser.Math.Between(60, config.width - 60),
        config.height + 300,
        'bubble'
      );
      fallbackDot.setDisplaySize(dotRadius * 2, dotRadius * 2);
      fallbackDot.setTint(color);
      fallbackDot.setPipeline('Light2D');
      
      fallbackDot.setData('connected', false);
      fallbackDot.colorId = color;
      dots.push(fallbackDot);
    }
  }

  score = 0;
scoreText = this.add.text(16, 16, 'Score: 0', {
  fontSize: '28px',
  fill: '#ffffff',
  fontFamily: 'Arial'
});
scoreText.setScrollFactor(0);

highScoreText = this.add.text(16, 48, 'High Score: ' + highScore, {
  fontSize: '24px',
  fill: '#ffff88',
  fontFamily: 'Arial'
});
highScoreText.setScrollFactor(0);

  // Add score text
  score = 0;
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#ffffff'
  });
  scoreText.setScrollFactor(0);

  // === Input Handling ===

  this.input.on('pointerdown', function (pointer) {
    const cam = this.cameras.main;
    const x = pointer.x;
    const y = pointer.y + cam.scrollY;

    const dot = dots.find(d =>
      Phaser.Math.Distance.Between(d.x, d.y, x, y) < dotRadius * 1.4
      &&
      !d.getData('connected')
    );

    if (dot) {
      selectedColor = dot.colorId;
      dot.setData('connected', true);createBubbleBurstEffect(this, dot.x, dot.y, dot.colorId);

    
      
      if (!dotArray.includes(dot)) {
  dotArray.push(dot);
}

      drawConnectingLines();

      score++;
      scoreText.setText('Score: ' + score);
      if (score > highScore) {
        highScore = score;
        highScoreText.setText('High Score: ' + highScore);
        localStorage.setItem('highScore', highScore);  // Save to browser storage
      }

      isDragging = true;

      // this.sound.play('connectSound');
      if (connectSound) connectSound.play();


      console.log(`🟢 Start → Color: ${selectedColor.toString(16)}, Score: ${score}`);
    }
  }, this);

  this.input.on('pointermove', function (pointer) {
    if (!isDragging) return;

    const cam = this.cameras.main;
    const x = pointer.x;
    const y = pointer.y + cam.scrollY;

    const dot = dots.find(d =>
      Phaser.Math.Distance.Between(d.x, d.y, x, y) < dotRadius * 1.4 &&
      !d.getData('connected') &&
      d.colorId === selectedColor
    );

    if (dot) {
      dot.setData('connected', true);createBubbleBurstEffect(this, dot.x, dot.y, dot.colorId);

    
      
      if (!dotArray.includes(dot)) {
  dotArray.push(dot);
}

      drawConnectingLines();

      score++;
      scoreText.setText('Score: ' + score);
      if (score > highScore) {
        highScore = score;
        highScoreText.setText('High Score: ' + highScore);
        localStorage.setItem('highScore', highScore);  // Save to browser storage
      }

      if (connectSound) connectSound.play();

      console.log(`➕ Connected → Score: ${score}`);
    }
  }, this);

  this.input.on('pointerup', function (pointer) {
    if (!gameOver && isDragging) {
      isDragging = false;
      // dotArray = []
      // graphics.clear();

      console.log("dotArray : " , dotArray);
      const anyConnected = dots.some(dot => dot.getData('connected'));
      if (anyConnected) {
        endGame(this);
      }
    }
  }, this);
}



let chosenColor = null;
let connectedDots = [];
let isDragging = false;
let lastDebuggedDot = null;

let selectedColor = null;

function pointerMove(pointer) {
  if (!pointer.isDown || selectedColor === null) return;

  const cam = game.scene.scenes[0].cameras.main;
  const pointerX = pointer.x;
  const pointerY = pointer.y + cam.scrollY;

  const detectionRadius = 50;

  const dot = dots.find(d =>
    !d.getData('connected') &&
    d.colorId === selectedColor &&
    Phaser.Math.Distance.Between(d.x, d.y, pointerX, pointerY) < detectionRadius
  );

  if (dot) {
    dot.setData('connected', true);createBubbleBurstEffect(this, dot.x, dot.y, dot.colorId);
 // Mark as visited
    score++;
    scoreText.setText('Score: ' + score);

    if (score > highScore) {
      highScore = score;
      highScoreText.setText('High Score: ' + highScore);
      localStorage.setItem('highScore', highScore);  // Save to browser storage
    }
    console.log(`🎯 +1 Score → Total: ${score}`);
  }
}


function pointerDown(pointer) {
  if (pointer.rightButtonDown()) return;

  dotArray = [];
  graphics.clear();

  const x = pointer.x;
  const y = pointer.y + game.scene.scenes[0].cameras.main.scrollY;

  const dot = dots.find(d =>
    Phaser.Math.Distance.Between(d.x, d.y, x, y) < dotRadius * 1.4 &&
    !d.getData('connected')
  );

  if (!dot) return;

  chosenColor = dot.colorId;
  connectedDots = [dot];
  dot.setData('connected', true);createBubbleBurstEffect(this, dot.x, dot.y, dot.colorId);

  isDragging = true;

  // ✅ Initial score increment
  score++;
  scoreText.setText('Score: ' + score);

  if (score > highScore) {
    highScore = score;
    highScoreText.setText('High Score: ' + highScore);
    localStorage.setItem('highScore', highScore);  // Save to browser storage
  }
}

function pointerUp(pointer) {
  if (pointer.rightButtonDown()) return;

  isDragging = false;
  connectedDots = [];
  chosenColor = null;
}



let recycleTimer = 0;

function update(time, delta) {
  const cam = this.cameras.main;
  cam.scrollY += scrollSpeed;

  elapsedTime += delta;
  recycleTimer += delta;

  // Increase scroll speed over time
const speedIncreaseRate = 0.00001; // Adjust this to control how fast it increases
scrollSpeed = 1 + (elapsedTime * speedIncreaseRate);

  // Dot density over time
  if (elapsedTime > 90000) maxVisibleDots = 40;
  else if (elapsedTime > 45000) maxVisibleDots = 25;
  else maxVisibleDots = 10;

  // Count visible unconnected dots
  let visibleDots = 0;
  dots.forEach(dot => {
    dot.y -= scrollSpeed;
    const inView = dot.y > cam.scrollY && dot.y < cam.scrollY + config.height;
    if (!dot.getData('connected') && inView) visibleDots++;
  });

  // Recycle gradually every 200ms
  if (recycleTimer >= 200 && visibleDots < maxVisibleDots) {
    recycleTimer = 0;

    const dot = dots.find(dot =>
       dot.y < cam.scrollY - 100
    );

    if (dot) {
      const outerRadius = 70;
      const maxAttempts = 20;
      let placed = false;

      for (let i = 0; i < maxAttempts && !placed; i++) {
        const newX = Phaser.Math.Between(60, config.width - 60);
        const newY = cam.scrollY + config.height + Phaser.Math.Between(50, 200);

        const overlapping = dots.some(other =>
          other !== dot &&
          Phaser.Math.Distance.Between(newX, newY, other.x, other.y) < outerRadius
        );

        if (!overlapping) {
          const color = Phaser.Utils.Array.GetRandom(colorPalette);
          dot.setPosition(newX, newY);
          dot.setTint(color);
          dot.colorId = color;
          dot.setData('connected', false);
          dot.setAlpha(1);
          dot.setDisplaySize(dotRadius * 2, dotRadius * 2); 
          placed = true;

          if (dotArray.includes(dot)) {
            dotArray = dotArray.filter(d => d !== dot);
            drawConnectingLines(); // Redraw after removal
          }
        }
      }

      // fallback
      if (!placed) {
        dot.y = cam.scrollY + config.height + 300;
        dot.x = Phaser.Math.Between(60, config.width - 60);
      }
    }
  }
  drawConnectingLines();
}

function createBubbleBurstEffect(scene, x, y, color = 0xffffff) {
  const bubble = scene.add.sprite(x, y, 'bubble');
  bubble.setTint(color);
  bubble.setDisplaySize(dotRadius * 2, dotRadius * 2);
  bubble.setDepth(1);

  scene.tweens.add({
    targets: bubble,
    scale: 0,
    alpha: 0,
    duration: 200,
    ease: 'Back.easeIn',
    onComplete: () => bubble.destroy()
  });

  // Ring flash remains as circle graphic
  const ring = scene.add.circle(x, y, 10, 0xffffff, 0.3);
  ring.setDepth(2);

  scene.tweens.add({
    targets: ring,
    scale: 3,
    alpha: 0,
    duration: 250,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy()
  });

  // Sharp burst lines remain same
  for (let i = 0; i < 6; i++) {
    const angle = Phaser.Math.DegToRad(60 * i + Phaser.Math.Between(-10, 10));
    const line = scene.add.rectangle(x, y, 2, 10, color);
    line.setRotation(angle);
    line.setDepth(1);

    scene.tweens.add({
      targets: line,
      x: x + Math.cos(angle) * 50,
      y: y + Math.sin(angle) * 50,
      alpha: 0,
      duration: 300,
      ease: 'Expo.easeOut',
      onComplete: () => line.destroy()
    });
  }
}






function endGame(scene) {
  if (gameOver) return;
  gameOver = true;

  

  // Game Over text
  const gameOverText = scene.add.text(
    config.width / 2,
    config.height / 2 - 100,
    'Game Over\nScore: ' + score,
    {
      fontSize: '48px',
      fill: '#ff4444',
      align: 'center',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }
  ).setOrigin(0.5);
  gameOverText.setScrollFactor(0);

  // 🟢 Restart Button (fixed on screen)
  const restartButton = scene.add.text(config.width / 2, config.height / 2 + 150, 'Restart', {
    fontFamily: 'Verdana',
    fontSize: '28px',
    color: '#ffffff',
    backgroundColor: '#2e8b57',
    padding: { left: 24, right: 24, top: 14, bottom: 14 },
    align: 'center',
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#000000',
      blur: 4,
      stroke: true,
      fill: true
    }
  }).setOrigin(0.5);
  
  restartButton.setScrollFactor(0);
  restartButton.setInteractive({ useHandCursor: true });
  
  // Hover glow effect
  restartButton.on('pointerover', () => {
    restartButton.setStyle({ backgroundColor: '#3cb371' });
    scene.tweens.add({
      targets: restartButton,
      scale: 1.08,
      duration: 150,
      ease: 'Sine.easeOut'
    });
  });
  
  restartButton.on('pointerout', () => {
    restartButton.setStyle({ backgroundColor: '#2e8b57' });
    scene.tweens.add({
      targets: restartButton,
      scale: 1,
      duration: 150,
      ease: 'Sine.easeIn'
    });
  });
  
  // Click action
  restartButton.on('pointerdown', () => {
    restartButton.setAlpha(0.7);
  });
  restartButton.on('pointerup', () => {
    window.location.reload();
  });
  

  restartButton.setInteractive({ useHandCursor: true });
  restartButton.setScrollFactor(0); // Fixes the button to the screen

  restartButton.on('pointerdown', () => {
    window.location.reload(); // Simple page reload restarts game
  });

  console.log('🛑 Game ended. Final score:', score);
}


function drawConnectingLines() {
  graphics.clear();  // Clear previous lines

  if (dotArray.length < 2) return;  // Need at least 2 dots to draw a line

  graphics.lineStyle(2, selectedColor || 0xffffff, 1);

  for (let i = 0; i <  dotArray.length - 1; i++) {
    const startDot = dotArray[i];
    const endDot = dotArray[i + 1];

    graphics.beginPath();
    graphics.moveTo(startDot.x, startDot.y);
    graphics.lineTo(endDot.x, endDot.y);
    graphics.strokePath();
  }
}



