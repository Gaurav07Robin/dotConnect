// import BrushTrail from './brushTrail.js';

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

// let brushTrail;

// Game state variables
let gameOver = false;
let connectSound;
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
let scoreText, highScoreText;
let dots = [];
let dotRadius;
let outerRadius;
let colorPalette = [0xff4f4f, 0x4fff90, 0x4fc3ff, 0xfff94f, 0xff9d4f, 0xaf4fff, 0x4ffff1, 0xffffff, 0x999999];
let dotArray = [];


let selectedColor = null;
let isDragging = false;

let trailGraphics;
let trailPoints = [];
const maxTrailLength = 12;
const minDistance = 3;

let scrollSpeed = 1;
let elapsedTime = 0;
let recycleTimer = 0;
let maxVisibleDots = 7;

function preload() {
  this.load.audio('connectSound', 'assets/connect.mp3');
  this.load.image('bubble', 'assets/bubble2.png');
}

function create() {

  this.cameras.main.setScroll(0, 0);
this.cameras.main.setBounds(0, 0, config.width, config.height);

  const scene = this;

  // Setup lighting
  trailGraphics = this.add.graphics();
  trailGraphics.setDepth(10);
  trailGraphics.setBlendMode(Phaser.BlendModes.ADD);

  this.lights.enable();
  this.lights.setAmbientColor(0x888888);
  const light = this.lights.addLight(400, 300, 200).setColor(0xffffff).setIntensity(4);
  this.input.on('pointermove', pointer => {
    light.x = pointer.x;
    light.y = pointer.y + this.cameras.main.scrollY;


  });

  // Camera setup
  this.cameras.main.scrollY = 0;
  this.cameras.main.setBounds(0, 0, config.width, 100000);

  // Calculate dot sizes based on screen
  const screenMin = Math.min(window.innerWidth, window.innerHeight);
  dotRadius = screenMin * 0.095;
  outerRadius = dotRadius * 3.5;

  // Load sound
  connectSound = this.sound.add('connectSound');

  // Initial dots
  const initialDotCount = screenMin < 500 ? 5 : 8;
  const maxAttempts = 50;

  for (let i = 0; i < initialDotCount; i++) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      const x = Phaser.Math.Between(60, config.width - 60);
      const y = Phaser.Math.Between(100, config.height + 300);

      const overlaps = dots.some(other => Phaser.Math.Distance.Between(x, y, other.x, other.y) < outerRadius);
      if (!overlaps) {
        addDot(scene, x, y);
        placed = true;
      }
    }
    if (!placed) {
      // fallback placement
      addDot(scene, Phaser.Math.Between(60, config.width - 60), config.height + 300);
    }
  }

  // Score UI
  score = 0;
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '28px',
    fill: '#ffffff',
    fontFamily: 'Arial'
  }).setScrollFactor(0);

  highScoreText = this.add.text(16, 48, 'High Score: ' + highScore, {
    fontSize: '24px',
    fill: '#ffff88',
    fontFamily: 'Arial'
  }).setScrollFactor(0);

  // Input handlers
  this.input.on('pointerdown', onPointerDown, this);
  this.input.on('pointermove', onPointerMove, this);
  this.input.on('pointerup', onPointerUp, this);

  // // brushTrail = new BrushTrail(this);

}

function addDot(scene, x, y) {
  const color = Phaser.Utils.Array.GetRandom(colorPalette);
  const dot = scene.add.sprite(x, y, 'bubble');
  dot.setDisplaySize(dotRadius * 2, dotRadius * 2);
  dot.setTint(color);
  dot.setPipeline('Light2D');
  dot.setData('connected', false);
  dot.colorId = color;
  dots.push(dot);
}

function onPointerDown(pointer) {
  if (pointer.rightButtonDown()) return;

  const cam = this.cameras.main;
  const x = pointer.x;
  const y = pointer.y + cam.scrollY;

  const dot = dots.find(d => Phaser.Math.Distance.Between(d.x, d.y, x, y) < dotRadius * 1.4 && !d.getData('connected'));
  if (!dot) return;

  selectedColor = dot.colorId;
  dot.setData('connected', true);
  createBubbleBurstEffect(this, dot.x, dot.y, dot.colorId);
  isDragging = true;
  score++;
  updateScore();

  // Start trail points
  trailPoints = [{ x: pointer.x, y: pointer.y }];

  if (connectSound) connectSound.play();
}

function onPointerMove(pointer) {
  if (!isDragging) return;

  const cam = this.cameras.main;
  const x = pointer.x;
  const y = pointer.y + cam.scrollY;

  
  // Update trail points with minimum distance check
  const lastPoint = trailPoints[trailPoints.length - 1];
  if (!lastPoint || Phaser.Math.Distance.Between(x, y, lastPoint.x, lastPoint.y) > minDistance) {
    trailPoints.push({ x, y });
    if (trailPoints.length > maxTrailLength) {
      trailPoints.shift();
    }
  }

  const dot = dots.find(d =>
    Phaser.Math.Distance.Between(d.x, d.y, x, y) < dotRadius * 1.4 &&
    !d.getData('connected') &&
    d.colorId === selectedColor
  );

  if (dot) {
    dot.setData('connected', true);
    createBubbleBurstEffect(this, dot.x, dot.y, dot.colorId);
    score++;
    updateScore();

    if (connectSound) connectSound.play();
  }

  
}

function onPointerUp(pointer) {
  isDragging = false;
  trailPoints = [];
  if (trailGraphics) trailGraphics.clear();

  // Check if any dot connected to end game
  if (!gameOver && dots.some(dot => dot.getData('connected'))) {
    endGame(this);
  }
}

function updateScore() {
  scoreText.setText('Score: ' + score);
  if (score > highScore) {
    highScore = score;
    highScoreText.setText('High Score: ' + highScore);
    localStorage.setItem('highScore', highScore);
  }
}

function update(time, delta) {
  const cam = this.cameras.main;
  cam.scrollY += scrollSpeed;

  elapsedTime += delta;
  recycleTimer += delta;

  // Gradually increase scroll speed
  const initialSpeed = 1;
  const acceleration = 0.00002;
  scrollSpeed = initialSpeed + acceleration * elapsedTime;

  // Adjust max visible dots based on elapsed time
  if (elapsedTime > 90000) maxVisibleDots = 40;
  else if (elapsedTime > 45000) maxVisibleDots = 25;
  else maxVisibleDots = 13;

  // Move dots upward and count visible unconnected
  let visibleDots = 0;
  dots.forEach(dot => {
    dot.y -= scrollSpeed;
    const inView = dot.y > cam.scrollY && dot.y < cam.scrollY + config.height;
    if (!dot.getData('connected') && inView) visibleDots++;
  });

  // Recycle dots every 200ms if visible dots below maxVisibleDots
  if (recycleTimer >= 200 && visibleDots < maxVisibleDots) {
    recycleTimer = 0;

    const dot = dots.find(d => d.y < cam.scrollY - 100);
    if (dot) {
      recycleDot(dot, cam);
    }
  }

  // brushTrail.update();
  
}

function recycleDot(dot, cam) {
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
    }
  }

  if (!placed) {
    dot.y = cam.scrollY + config.height + 300;
    dot.x = Phaser.Math.Between(60, config.width - 60);
  }
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

  // Restart Button
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

  // Hover effects
  restartButton.on('pointerover', () => {
    restartButton.setStyle({ backgroundColor: '#3cb371' });
    scene.tweens.add({ targets: restartButton, scale: 1.08, duration: 150, ease: 'Sine.easeOut' });
  });

  restartButton.on('pointerout', () => {
    restartButton.setStyle({ backgroundColor: '#2e8b57' });
    scene.tweens.add({ targets: restartButton, scale: 1, duration: 150, ease: 'Sine.easeIn' });
  });

  restartButton.on('pointerdown', () => {
    restartButton.setAlpha(0.7);
  });

  restartButton.on('pointerup', () => {
    window.location.reload();
  });
}
