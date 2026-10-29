(() => {
  const canvas = document.getElementById('maze-sim-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const columnCount = 15;
  const rowCount = 11;
  const startCell = { x: 1, y: 1 };
  const goalCell = { x: 13, y: 9 };
  const wallCoordinates = [
    [5, 1], [5, 2], [5, 3], [5, 5], [5, 6],
    [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 8],
    [2, 3], [3, 3], [7, 2], [8, 2], [7, 5], [8, 5],
    [2, 6], [3, 6], [4, 6], [3, 8], [4, 8], [6, 8], [7, 8],
    [11, 4], [12, 4], [11, 5], [12, 7]
  ];
  const obstacleCoordinates = [[2, 2], [8, 4], [11, 3]];
  const grid = Array.from({ length: rowCount }, (_, y) =>
    Array.from({ length: columnCount }, (_, x) =>
      x === 0 || y === 0 || x === columnCount - 1 || y === rowCount - 1 ? 1 : 0));
  wallCoordinates.forEach(([x, y]) => { grid[y][x] = 1; });
  obstacleCoordinates.forEach(([x, y]) => { grid[y][x] = 2; });

  const elements = {
    toggle: document.getElementById('maze-toggle-btn'),
    step: document.getElementById('maze-step-btn'),
    reset: document.getElementById('maze-reset-btn'),
    speed: document.getElementById('maze-speed-input'),
    speedOutput: document.getElementById('maze-speed-output'),
    modeChip: document.getElementById('maze-mode-chip'),
    direction: document.getElementById('maze-direction'),
    mode: document.getElementById('maze-mode'),
    steps: document.getElementById('maze-steps'),
    pathLength: document.getElementById('maze-path-length'),
    progressText: document.getElementById('maze-progress-text'),
    progressTrack: document.getElementById('maze-progress-track'),
    progressFill: document.getElementById('maze-progress-fill'),
    sensors: {
      left: document.getElementById('maze-sensor-left'),
      front: document.getElementById('maze-sensor-front'),
      right: document.getElementById('maze-sensor-right')
    },
    motors: [document.getElementById('maze-motor-left'), document.getElementById('maze-motor-right')]
  };
  const directionNames = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
  const directionVectors = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  let cellSize = 0;
  let route = [];
  let routeIndex = 0;
  let robot = { ...startCell };
  let heading = 1;
  let previousCell = { ...startCell };
  let visualPosition = { x: startCell.x, y: startCell.y };
  let animationFrame = 0;
  let moveStartedAt = 0;
  let movementDuration = 700;
  let moveProgress = 0;
  let running = false;
  let singleStep = false;
  let mode = 'IDLE';

  // Breadth-first search visits open cells and reconstructs a shortest route.
  function findShortestPath() {
    const queue = [{ ...startCell }];
    const previous = new Map([[`${startCell.x},${startCell.y}`, null]]);
    let queueIndex = 0;

    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      if (current.x === goalCell.x && current.y === goalCell.y) break;
      directionVectors.forEach((vector) => {
        const next = { x: current.x + vector.x, y: current.y + vector.y };
        const key = `${next.x},${next.y}`;
        if (next.x < 0 || next.y < 0 || next.x >= columnCount || next.y >= rowCount || grid[next.y][next.x] || previous.has(key)) return;
        previous.set(key, `${current.x},${current.y}`);
        queue.push(next);
      });
    }

    const goalKey = `${goalCell.x},${goalCell.y}`;
    if (!previous.has(goalKey)) return [];
    const result = [];
    let key = goalKey;
    while (key) {
      const [x, y] = key.split(',').map(Number);
      result.push({ x, y });
      key = previous.get(key);
    }
    return result.reverse();
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    cellSize = Math.min(bounds.width / columnCount, bounds.height / rowCount);
    drawMaze();
  }

  function drawMaze() {
    if (!cellSize) return;
    const bounds = canvas.getBoundingClientRect();
    const offsetX = (bounds.width - cellSize * columnCount) / 2;
    const offsetY = (bounds.height - cellSize * rowCount) / 2;
    context.clearRect(0, 0, bounds.width, bounds.height);
    context.fillStyle = '#f8fafc';
    context.fillRect(0, 0, bounds.width, bounds.height);

    for (let y = 0; y < rowCount; y += 1) {
      for (let x = 0; x < columnCount; x += 1) {
        const left = offsetX + x * cellSize;
        const top = offsetY + y * cellSize;
        context.fillStyle = grid[y][x] === 1 ? '#243b58' : grid[y][x] === 2 ? '#c66a5c' : '#ffffff';
        context.fillRect(left + 1, top + 1, cellSize - 2, cellSize - 2);
        if (!grid[y][x]) {
          context.strokeStyle = '#e8eef5';
          context.lineWidth = 1;
          context.strokeRect(left + .5, top + .5, cellSize, cellSize);
        }
      }
    }

    route.forEach((cell, index) => {
      if ((cell.x === startCell.x && cell.y === startCell.y) || (cell.x === goalCell.x && cell.y === goalCell.y)) return;
      context.fillStyle = index <= routeIndex ? 'rgba(28, 166, 127, .38)' : 'rgba(88, 174, 218, .28)';
      context.fillRect(offsetX + cell.x * cellSize + 2, offsetY + cell.y * cellSize + 2, cellSize - 4, cellSize - 4);
    });

    drawMarker(startCell, '#16866f', 'S', offsetX, offsetY);
    drawMarker(goalCell, '#e58a36', 'G', offsetX, offsetY);
    drawRobot(offsetX, offsetY);
  }

  function drawMarker(cell, color, label, offsetX, offsetY) {
    if (label === 'S') {
      const left = offsetX + cell.x * cellSize;
      const top = offsetY + cell.y * cellSize;
      context.strokeStyle = color;
      context.lineWidth = Math.max(2, cellSize * .07);
      context.strokeRect(left + 2, top + 2, cellSize - 4, cellSize - 4);
      context.fillStyle = color;
      context.font = `700 ${Math.max(8, cellSize * .24)}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, left + cellSize * .17, top + cellSize * .18);
      return;
    }
    const centerX = offsetX + (cell.x + .5) * cellSize;
    const centerY = offsetY + (cell.y + .5) * cellSize;
    context.fillStyle = color;
    context.beginPath();
    context.arc(centerX, centerY, cellSize * .31, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fff';
    context.font = `700 ${Math.max(9, cellSize * .34)}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, centerX, centerY + .5);
  }

  function drawRobot(offsetX, offsetY) {
    const centerX = offsetX + (visualPosition.x + .5) * cellSize;
    const centerY = offsetY + (visualPosition.y + .5) * cellSize;
    const radius = cellSize * .31;
    context.fillStyle = '#2563eb';
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.save();
    context.translate(centerX, centerY);
    context.rotate(heading * Math.PI / 2);
    context.fillStyle = '#fff';
    context.beginPath();
    context.moveTo(radius * .58, 0);
    context.lineTo(-radius * .28, -radius * .3);
    context.lineTo(-radius * .28, radius * .3);
    context.closePath();
    context.fill();
    context.restore();
  }

  function isWall(x, y) {
    return x < 0 || y < 0 || x >= columnCount || y >= rowCount || grid[y][x] !== 0;
  }

  function updateTelemetry() {
    const percentage = route.length > 1 ? Math.round((routeIndex / (route.length - 1)) * 100) : 0;
    elements.direction.textContent = directionNames[heading];
    elements.mode.textContent = mode;
    elements.modeChip.textContent = mode.toLowerCase();
    elements.modeChip.dataset.mode = mode.toLowerCase();
    elements.steps.textContent = String(routeIndex);
    elements.pathLength.textContent = String(Math.max(0, route.length - 1));
    elements.progressText.textContent = `${percentage}%`;
    elements.progressTrack.setAttribute('aria-valuenow', String(percentage));
    elements.progressFill.style.width = `${percentage}%`;

    const leftVector = directionVectors[(heading + 3) % 4];
    const frontVector = directionVectors[heading];
    const rightVector = directionVectors[(heading + 1) % 4];
    [['left', leftVector], ['front', frontVector], ['right', rightVector]].forEach(([side, vector]) => {
      const blocked = isWall(robot.x + vector.x, robot.y + vector.y);
      elements.sensors[side].textContent = blocked ? 'Wall' : 'Clear';
      elements.sensors[side].dataset.reading = blocked ? 'wall' : 'clear';
    });

    const motorsActive = mode === 'RUNNING' || (mode === 'PAUSED' && moveProgress > 0);
    elements.motors.forEach((motor) => {
      motor.dataset.active = String(motorsActive);
      motor.querySelector('b').textContent = motorsActive ? 'DRIVE' : 'HOLD';
    });
    elements.toggle.textContent = mode === 'RUNNING' ? 'Pause' : mode === 'COMPLETE' ? 'Complete' : 'Start';
    elements.toggle.disabled = mode === 'COMPLETE';
    elements.step.disabled = mode === 'COMPLETE';
  }

  function setMode(nextMode) {
    mode = nextMode;
    updateTelemetry();
  }

  function updateMotion(timestamp) {
    if (!running) return;
    moveProgress = Math.min(1, (timestamp - moveStartedAt) / movementDuration);
    const target = route[routeIndex + 1];
    if (!target) {
      running = false;
      setMode('COMPLETE');
      return;
    }
    visualPosition = {
      x: robot.x + (target.x - robot.x) * moveProgress,
      y: robot.y + (target.y - robot.y) * moveProgress
    };
    drawMaze();

    if (moveProgress >= 1) {
      previousCell = { ...robot };
      robot = { ...target };
      routeIndex += 1;
      visualPosition = { ...robot };
      const dx = robot.x - previousCell.x;
      const dy = robot.y - previousCell.y;
      heading = directionVectors.findIndex((vector) => vector.x === dx && vector.y === dy);
      moveProgress = 0;
      drawMaze();
      if (routeIndex >= route.length - 1) {
        running = false;
        setMode('COMPLETE');
        updateTelemetry();
        return;
      }
      if (singleStep) {
        singleStep = false;
        running = false;
        setMode('PAUSED');
        return;
      }
      moveStartedAt = timestamp;
      updateTelemetry();
    }
    animationFrame = window.requestAnimationFrame(updateMotion);
  }

  function beginMovement(oneCell = false) {
    if (mode === 'COMPLETE') return;
    if (routeIndex >= route.length - 1) {
      setMode('COMPLETE');
      return;
    }
    singleStep = oneCell;
    running = true;
    movementDuration = Number(elements.speed.value);
    moveStartedAt = performance.now() - moveProgress * movementDuration;
    setMode('RUNNING');
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(updateMotion);
  }

  function pauseMovement() {
    if (running) {
      moveProgress = Math.min(1, (performance.now() - moveStartedAt) / movementDuration);
      const target = route[routeIndex + 1];
      if (target) {
        visualPosition = {
          x: robot.x + (target.x - robot.x) * moveProgress,
          y: robot.y + (target.y - robot.y) * moveProgress
        };
      }
    }
    running = false;
    singleStep = false;
    window.cancelAnimationFrame(animationFrame);
    drawMaze();
    setMode('PAUSED');
  }

  function resetSimulation() {
    running = false;
    singleStep = false;
    window.cancelAnimationFrame(animationFrame);
    routeIndex = 0;
    robot = { ...startCell };
    previousCell = { ...startCell };
    visualPosition = { ...startCell };
    heading = 1;
    moveProgress = 0;
    setMode('IDLE');
    drawMaze();
  }

  elements.toggle.addEventListener('click', () => {
    if (running) pauseMovement();
    else beginMovement();
  });
  elements.step.addEventListener('click', () => {
    if (running) pauseMovement();
    beginMovement(true);
  });
  elements.reset.addEventListener('click', resetSimulation);
  elements.speed.addEventListener('input', () => {
    const speed = (700 / Number(elements.speed.value)).toFixed(1);
    elements.speedOutput.value = `${speed}x`;
    elements.speedOutput.textContent = `${speed}x`;
    if (running) {
      const now = performance.now();
      moveProgress = Math.min(1, (now - moveStartedAt) / movementDuration);
      movementDuration = Number(elements.speed.value);
      moveStartedAt = now - moveProgress * movementDuration;
    }
  });

  route = findShortestPath();
  elements.pathLength.textContent = route.length ? String(route.length - 1) : 'NO ROUTE';
  updateTelemetry();
  drawMaze();
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
  else window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
})();
