// Hàm dùng chung cho index.html và home.html
function localISODate(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dimLetterToIndex(letter) {
  return letter.toLowerCase().charCodeAt(0) - 97 + 1; 
}

function roundTo5(val) {
  return Math.max(Math.round(val / 5) * 5, 0);
}

function updateLength(tabIndex) {
  tabIndex = String(tabIndex);
  const select = document.querySelector(`.angle-preset[data-tab="${tabIndex}"]`);
  const selected = tabIndex === '0' ? '直筋' : select?.value;
  const shape = selected ? shapesByTab[tabIndex]?.[selected] : null;

  const diaInput = document.getElementById('dia');
  const dBar = diaInput ? parseFloat(diaInput.value) || 0 : 0;
  const lenInput = document.getElementById('len');
  
  if (shape && typeof shape.calculate === 'function') {
    const args = {};
    shape.params.forEach(param => {
      if (param === 'dBar') {
        args[param] = dBar;
      } else {
        const input = document.getElementById(`s${tabIndex}${param}`);
        args[param] = input ? (parseFloat(input.value) || 0) : 0;
      }
    });
    const length = shape.calculate(args);
    if (lenInput) lenInput.value = roundTo5(length);
    return;
  }

  let totalLength = 0;
  const segments = ["a", "b", "c", "d", "e", "f"];
  for (let seg of segments) {
    const input = document.getElementById(`s${tabIndex}${seg}`);
    if (input) {
      const val = parseFloat(input.value || 0);
      if (!isNaN(val)) totalLength += val;
    }
  }

  const bends = document.querySelectorAll(`input[id^="s${tabIndex}bend"]`);
  const bendCount = bends.length;
  const bendLoss = 2 * dBar * bendCount;

  let finalLength = totalLength - bendLoss;

  let bend180Count = 0;
  bends.forEach(bend => {
    const bendValue = parseFloat(bend.value);
    if (bendValue === 180) bend180Count++;
  });

  finalLength += bend180Count * 12 * dBar;

  if (lenInput) lenInput.value = roundTo5(finalLength);
}

function updateHighlightedInputs(shape) {
  const highlights = shape.highlight || [];
  const labels = document.querySelectorAll('label[data-param]');

  labels.forEach(label => {
    const param = label.getAttribute('data-param');
    if (highlights.includes(param)) {
      label.classList.remove('hidden'); // hiện label
    } else {
      label.classList.add('hidden'); // ẩn label
    }
  });
}

function resetAllInputVisibility(tabIndex) {
  const tabContent = document.querySelector(`.tab-content[data-content="${tabIndex}"]`);
  if (!tabContent) return;

  const labels = tabContent.querySelectorAll('.dim-col label');
  labels.forEach(label => label.classList.remove('hidden'));
}

function initAnglePresets() {
  const selects = document.querySelectorAll('.angle-preset');
  selects.forEach(select => {
    const tabIndex = parseInt(select.dataset.tab);
    const shapes = shapesByTab[tabIndex];
    if (!shapes) return;
    for (const shapeName in shapes) {
      const option = document.createElement('option');
      option.value = shapeName;
      option.textContent = shapeName;
      select.appendChild(option);
    }

    select.addEventListener('change', function () {
      const selected = this.value;
      const shape = shapes[selected];
      if (!shape) return;
      document.querySelectorAll(`#s${tabIndex}a, #s${tabIndex}b, #s${tabIndex}c, #s${tabIndex}d, #s${tabIndex}e, #s${tabIndex}f`)
        .forEach(input => {
          input.classList.remove('highlight-dim');
          const labelSpan = input.parentElement.querySelector('span');
          if (labelSpan) labelSpan.classList.remove('highlight-label');
        });
      (shape.highlight ?? []).forEach(letter => {
        const input = document.getElementById(`s${tabIndex}${letter}`);
        if (input) {
          input.classList.add('highlight-dim');
          const labelSpan = input.parentElement.querySelector('span');
          if (labelSpan) labelSpan.classList.add('highlight-label');
        }
      });
      const angles = shape.angles ?? [];
      for (let i = 0; ; i++) {
        const bendInput = document.getElementById(`s${tabIndex}bend${i + 1}`);
        if (!bendInput) break;
        bendInput.value = angles[i] ?? angles[angles.length - 1] ?? '';
      }

      updateLength(tabIndex);
      drawSample();
    });

    ['a','b','c','d','e','f'].forEach(letter => {
  const input = document.getElementById(`s${tabIndex}${letter}`);
  if (input) {
    input.addEventListener('input', () => {
      updateLength(tabIndex);
      drawSample();
    });
  }
});

  });

const diaInput = document.getElementById('dia');
if (diaInput) {
  diaInput.addEventListener('input', () => {
    let tabIndex = typeof currentTabIndex === 'number'
      ? currentTabIndex
      : (() => {
          const activeTabBtn = document.querySelector('.tab-btn.active');
          return activeTabBtn ? parseInt(activeTabBtn.dataset.shape) : null;
        })();

    if (tabIndex !== null) {
      updateLength(tabIndex);
      drawSample();
    }
  });
}
}

function setupTabInputsNavigation() {
  document.querySelectorAll('.tab-content').forEach(tab => {
    const tabIndex = tab.dataset.content;
    const segs = ['a', 'b', 'c', 'd', 'e', 'f'];
    const segInputs = segs.map(seg => document.getElementById(`s${tabIndex}${seg}`)).filter(Boolean);

    const diaInput = document.getElementById('dia');
    const lenInput = document.getElementById('len');
    const qtyInput = document.getElementById('qty');
    const applyBtn = document.getElementById('applyBtn');
    const inputOrder = [diaInput, ...segInputs, lenInput, qtyInput].filter(Boolean);

    inputOrder.forEach((input, index) => {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const nextInput = inputOrder[index + 1];
          if (nextInput) {
            nextInput.focus();
          } else {
            applyBtn?.focus();
          }
        }
      });
    });
    applyBtn?.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyShape();
      }
    });
  });
}

function handlePopupKeys(e) {
  const activeTab = document.querySelector('.tab-content.active');
  if (!activeTab) return;
  const activeTabIndex = parseInt(activeTab.dataset.content || "0");
  if (e.key === 'Tab') {
    e.preventDefault();
    const nextTabIndex = e.shiftKey
      ? (activeTabIndex - 1 + 6) % 6
      : (activeTabIndex + 1) % 6;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      const isActive = tab === String(nextTabIndex);
      btn.classList.toggle('active', isActive);
      const content = document.querySelector(`.tab-content[data-content="${tab}"]`);
      if (content) content.classList.toggle('active', isActive);
    });
    if (selectedCanvas) {
      selectedCanvas.dataset.shape = String(nextTabIndex);
    }
	
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    letters.forEach(l => {
      const input = document.getElementById(`s${nextTabIndex}${l}`);
      if (input) input.value = "";
    });
    ['dia', 'len', 'qty'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });


    drawSample();
  }
}

function closePopup() {
  overlay.style.display = "none";
  popup.style.display = "none";
  popup.removeEventListener('keydown', handlePopupKeys);
  document.body.classList.remove('popup-open');
  
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return canvas.getContext("2d");
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawLineWithLabel(ctx, x1, y1, x2, y2, label, angleLabel) {
  if (typeof angleLabel === 'number' && angleLabel < 0) {
    [x1, y1, x2, y2] = [x2, y2, x1, y1];
    angleLabel = -angleLabel;
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  const epsilon = 0.01;
  let angle = Math.abs(dx) < epsilon ? -Math.PI / 2 : Math.atan2(dy, dx);
  const offset = 10;
  let ox, oy;
  if (Math.abs(dx) < epsilon) {
    ox = dy < 0 ? offset : -offset;
    oy = 0;
  } else if (Math.abs(dy) < epsilon) {
    ox = 0;
    oy = dx < 0 ? -offset : offset;
  } else {
    ox = (-dy / len) * offset;
    oy = (dx / len) * offset;
    if (dy < 0) oy = -oy;
  }
  if (label !== 0) {
    ctx.save();
    ctx.translate(midX + ox, midY + oy);
    let textAngle = angle;
    if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
      textAngle += Math.PI; 
    }
    ctx.rotate(textAngle);
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
 const niceAngles = [0, 45, 90, 135, 180];
  if (
    typeof angleLabel === 'number' &&
    !niceAngles.includes(Math.abs(angleLabel))
  ){
    const angleText = `${angleLabel}°`;
    const cornerX = midX;
    const cornerY = midY;
    const cornerOffsetX = -ox;
    const cornerOffsetY = -oy;
    ctx.save();
    ctx.translate(cornerX + cornerOffsetX, cornerY + cornerOffsetY);
    let textAngle = angle;
    if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
      textAngle += Math.PI;
    }
    ctx.rotate(textAngle);
    ctx.font = "10px Arial";
    ctx.fillStyle = "#777";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(angleText, 0, 0);
    ctx.restore();
  }
}

function drawHook(ctx, x0, y0, angle, radius, side = 'left') {
  const direction = side === 'left' ? -1 : 1;
  const arcCenterX = x0 + Math.cos(angle + direction * Math.PI / 2) * radius;
  const arcCenterY = y0 + Math.sin(angle + direction * Math.PI / 2) * radius;
  ctx.beginPath();
  ctx.arc(
    arcCenterX,
    arcCenterY,
    radius,
    angle + direction * Math.PI / 2,
    angle - direction * Math.PI / 2,
    side === 'right'
  );
  ctx.stroke();
  const startAngle = angle + direction * Math.PI / 2;
  const endX = arcCenterX + Math.cos(startAngle) * radius;
  const endY = arcCenterY + Math.sin(startAngle) * radius;
  const nextX = endX - Math.cos(angle) * 5;
  const nextY = endY - Math.sin(angle) * 5;
  drawLineWithLabel(ctx, endX, endY, nextX, nextY, 0);
}

function drawShape0(ctx, a) {
  drawLineWithLabel(ctx, 20, 30, 70, 30, a);
}

function drawShape1(ctx, a, b, bend1) {
  const x0 = 30, y0 = 30;
  const x1 = x0 + 50, y1 = y0;
  const radius = 5;
  drawLineWithLabel(ctx, x0, y0, x1, y1, b);
  if (bend1 === 180) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const angle = Math.atan2(dy, dx);
    const arcCenterX = x0 + Math.cos(angle - Math.PI / 2) * radius;
    const arcCenterY = y0 + Math.sin(angle - Math.PI / 2) * radius;
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, radius,
            angle - Math.PI / 2,
            angle + Math.PI / 2,
            true); 
    ctx.stroke();
    drawLineWithLabel(ctx, x0, y0 - 10, x0 + dx - 40, y0 - 10, 0);

  } else {
    const rad = (bend1) * Math.PI / 180;
    const ax1 = x0, ay1 = y0;
    const ax0 = x0 - Math.cos(rad) * 20;
    const ay0 = y0 - Math.sin(rad) * 20;
    drawLineWithLabel(ctx, ax0, ay0, ax1, ay1, a, bend1);
  }
}

function drawShape2(ctx, a, b, c, bend1, bend2) {
  const x0 = 30, y0 = 30; 
  const x1 = x0 + 45, y1 = y0;
  const radius = 5;
    drawLineWithLabel(ctx, x0, y0, x1, y1, b);
  if (bend1 === 180) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const angle = Math.atan2(dy, dx);
    const arcCenterX = x0 + Math.cos(angle - Math.PI / 2) * radius;
    const arcCenterY = y0 + Math.sin(angle - Math.PI / 2) * radius;
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, radius,
            angle - Math.PI / 2,
            angle + Math.PI / 2,
            true);
    ctx.stroke();
    drawLineWithLabel(ctx, x0, y0 - 10, x0 + dx - 40, y0 - 10, 0);
  }
  else {
    const rad = (bend1) * Math.PI / 180;
    const ax1 = x0, ay1 = y0;
    const ax0 = x0 - Math.cos(rad) * 20;
    const ay0 = y0 - Math.sin(rad) * 20;
    drawLineWithLabel(ctx, ax0, ay0, ax1, ay1, a, bend1);
  }
  if (bend2 === 180) {
    drawLineWithLabel(ctx, x1, y1-10, x0+35, y0-10,0);
    const arcCenterX = x1;
    const arcCenterY = y1-radius;
	ctx.beginPath();
	ctx.arc(arcCenterX, arcCenterY, radius, 3 * Math.PI / 2, Math.PI / 2, false); 
	ctx.stroke();
  } 
  else {
    const rad = (180-bend2) * Math.PI / 180;
    const cx0 = x1, cy0 = y1;
    const cx1 = x1 - Math.cos(rad) * 20;
    const cy1 = y1 - Math.sin(rad) * 20;
    drawLineWithLabel(ctx, cx0, cy0, cx1, cy1, c, bend2);
  }
}

function drawShape3(ctx, a, b, c, d, bend1, bend2, bend3) {
  const x0 = 15, y0 = 30;
  const radius = 5;
  const x1 = x0 + 45, y1 = y0;

  // Trường hợp đặc biệt: Tam giác với các góc
  if (bend1 === 135 && bend2 === -135 && bend3 === 135) {
	const x0 = 16, y0 = 16;
	const x1 = x0 + 40, y1 = y0;
	const x2 = 45, y2 = 45;
	const x3 = 12, y3 = 12;
	const x4 = 49, y4 = 49;
	drawLineWithLabel(ctx, x1, y1, x0, y0, a);
	
	drawLineWithLabel(ctx, x2, y2, x1, y1, b);
	
	drawLineWithLabel(ctx, x3, y3, x4, y4, c);
	ctx.font = '12px Arial';
	ctx.fillStyle = 'black';
	const labelText = d + '段';
	ctx.fillText(labelText, 60, 13);
    return; // Kết thúc không vẽ các phần còn lại
  }

  // Phần xử lý vẽ các hình bình thường
  drawLineWithLabel(ctx, x0, y0, x1, y1, b);
  if (bend1 === 180) {
    drawLineWithLabel(ctx, x0, y0 - 10, x1 - 35, y1 - 10, 0);
    const arcCenterX = x0;
    const arcCenterY = y0 - radius;
    ctx.beginPath();
    ctx.arc(arcCenterX, arcCenterY, radius, 3 * Math.PI / 2, Math.PI / 2, true);
    ctx.stroke();
  } else {
    const rad = (bend1) * Math.PI / 180;
    const ax1 = x0, ay1 = y0;
    const ax0 = x0 - Math.cos(rad) * 15;
    const ay0 = y0 - Math.sin(rad) * 15;
    drawLineWithLabel(ctx, ax0, ay0, ax1, ay1, a, bend1);
  }
  const cx0 = x1, cy0 = y1;
  const rad2 = (bend2) * Math.PI / 180;
  const cx1 = cx0 + Math.cos(rad2) * 15;
  const cy1 = cy0 - Math.sin(rad2) * 15;
  drawLineWithLabel(ctx, cx0, cy0, cx1, cy1, c, bend2);
  const dx0 = cx1, dy0 = cy1;
  if (bend3 === 180) {
    const dx = cx1 - cx0;
    const dy = cy1 - cy0;
    const angle = Math.atan2(dy, dx);
    const arcCenterX = dx0 + Math.cos(angle - Math.PI / 2) * radius;
    const arcCenterY = dy0 + Math.sin(angle - Math.PI / 2) * radius;
    ctx.beginPath();
    ctx.arc(
      arcCenterX,
      arcCenterY,
      radius,
      angle - Math.PI / 2,
      angle + Math.PI / 2,
      false
    );
    ctx.stroke();
    const startAngle = angle - Math.PI / 2;
    const endX = arcCenterX + Math.cos(startAngle) * radius;
    const endY = arcCenterY + Math.sin(startAngle) * radius;
    const nextX = endX - Math.cos(angle) * 5;
    const nextY = endY - Math.sin(angle) * 5;
    drawLineWithLabel(ctx, endX, endY, nextX, nextY, 0);
  } else {
    const rad3 = (bend2 + bend3) * Math.PI / 180;
    const dx1 = dx0 + Math.cos(rad3) * 20;
    const dy1 = dy0 - Math.sin(rad3) * 20;
    drawLineWithLabel(ctx, dx1, dy1, dx0, dy0, d, bend3);
  }
}

function drawShape4(ctx, a, b, c, d, e, bend1, bend2, bend3, bend4) {
  const x0 = 22; 
  const y0 = (bend2 < 0 || bend4 < 0) ? 25 : 30;
  const radius = 5;
  const x1 = x0 + 45, y1 = y0; 
  drawLineWithLabel(ctx, x0, y0, x1, y1, c);
  const bx0 = x0, by0 = y0;
  const rad2 = (-bend2) * Math.PI / 180;
  const bx1 = bx0 - Math.cos(rad2) * 15;
  const by1 = by0 + Math.sin(rad2) * 15;
  drawLineWithLabel(ctx, bx1, by1, bx0, by0, b, bend2);
  const ax0 = bx1, ay0 = by1;
  if (bend1 === 180) {
    const dx = bx1 - bx0;
    const dy = by1 - by0;
    const angle = Math.atan2(dy, dx);
    drawHook(ctx, ax0, ay0, angle, radius, 'right');
  } else {
    const rad1 = (-bend1-bend2) * Math.PI / 180;
    const ax1 = ax0 - Math.cos(rad1) * 15;
    const ay1 = ay0 + Math.sin(rad1) * 15;
    drawLineWithLabel(ctx, ax0, ay0, ax1, ay1, a, bend1);
  }
  const dx0 = x1, dy0 = y1;
  const rad3 = (bend3) * Math.PI / 180;
  const dx1 = dx0 + Math.cos(rad3) * 15;
  const dy1 = dy0 - Math.sin(rad3) * 15;
  drawLineWithLabel(ctx, dx0, dy0, dx1, dy1, d, bend3);
  const ex0 = dx1, ey0 = dy1;
  if (bend4 === 180) {
    const dx = dx1 - dx0;
    const dy = dy1 - dy0;
    const angle = Math.atan2(dy, dx);
    drawHook(ctx, ex0, ey0, angle, radius, 'left'); 
  } else {
    const rad4 = (bend4+bend3) * Math.PI / 180;
    const ex1 = ex0 + Math.cos(rad4) * 15;
    const ey1 = ey0 - Math.sin(rad4) * 15;
    drawLineWithLabel(ctx, ex1, ey1, ex0, ey0, e, bend4);
  }
}

function drawShape5(ctx, a, b, c, d, e, f, bend1, bend2, bend3, bend4, bend5) {
   const x0 = 22;
  let y0 = 20;
  if (bend3 === 90) {
    y0 = 35;
  }
  const radius = 5;
  const x1 = x0 + 45, y1 = y0; 
  drawLineWithLabel(ctx, x0, y0, x1, y1, c);
  const bx0 = x0, by0 = y0;
  const rad2 = (-bend2) * Math.PI / 180;
    const lenB = (bend1 === 135 && bend5 === 135) ? 18 : 15;
  const bx1 = bx0 - Math.cos(rad2) * 15;
  const by1 = by0 + Math.sin(rad2) * 15;
  const bx1a = bx0 - Math.cos(rad2) * lenB;
  const by1a = by0 + Math.sin(rad2) * lenB;
  drawLineWithLabel(ctx, bx1, by1, bx0, by0, b, bend2);
  drawLineWithLabel(ctx, bx1a, by1a, bx0, by0, 0);
  const ax0 = bx1, ay0 = by1;
  if (bend1 === 180) {
    const dx = bx1 - bx0;
    const dy = by1 - by0;
    const angle = Math.atan2(dy, dx);
    drawHook(ctx, ax0, ay0, angle, radius, 'right'); 
  } else {
    const rad1 = (-bend1-bend2) * Math.PI / 180;
    const lenA = (bend1 === 135 && bend5 === 135) ? 8 : 15;
    const ax1 = ax0 - Math.cos(rad1) * lenA;
    const ay1 = ay0 + Math.sin(rad1) * lenA;
    drawLineWithLabel(ctx, ax0, ay0, ax1, ay1, a);
  }
  const dx0 = x1, dy0 = y1;
  const rad3 = (bend3) * Math.PI / 180;
  const dx1 = dx0 + Math.cos(rad3) * 18;
  const dy1 = dy0 - Math.sin(rad3) * 18;
  drawLineWithLabel(ctx, dx0, dy0, dx1, dy1, d, bend3);
  const ex0 = dx1, ey0 = dy1;
    const rad4 = (bend4+bend3) * Math.PI / 180;
let lenE = 15;
if (bend4 === 90) {
  lenE = (bend1 === 135 && bend5 === 135) ? 45 : 42;
}
    const ex1 = ex0 + Math.cos(rad4) * 42;
    const ey1 = ey0 - Math.sin(rad4) * 42;
    const ex1a = ex0 + Math.cos(rad4) * lenE;
    const ey1a = ey0 - Math.sin(rad4) * lenE;
    drawLineWithLabel(ctx, ex1, ey1, ex0, ey0, e, bend4);
    drawLineWithLabel(ctx, ex1a, ey1a, ex0, ey0, 0);
  const fx0 = ex1, fy0 = ey1;
  const rad5 = (-bend5-bend4-bend3) * Math.PI / 180;
  const lenF = (bend1 === 135 && bend5 === 135) ? 8 : 15;
  const fx1 = fx0 + Math.cos(rad5) * lenF;
  const fy1 = fy0 + Math.sin(rad5) * lenF;
  if (bend5 === 180) {
    const dx = fx1 - fx0;
    const dy = fy1 - fy0;
    const angle = Math.atan2(dy, dx);
    drawHook(ctx, fx0, fy0, angle, radius, 'left');
  } else {
    drawLineWithLabel(ctx, fx0, fy0, fx1, fy1, f);
  }
}

function drawSample() {
  const scale = 2;
  [0, 1, 2, 3, 4, 5].forEach(id => {
    const canvas = document.getElementById(`shape${id}`);
    const ctx = setupCanvas(canvas);
    const segments = ["a", "b", "c", "d", "e", "f"];
const shapePreset = shapesByTab[id];
const select = document.querySelector(`.angle-preset[data-tab="${id}"]`);
const selected = id === 0 ? '直筋' : select?.value;
const highlightSegments = shapePreset?.[selected]?.highlight || [];

const [a, b, c, d, e, f] = segments.map(seg => {
  const el = document.getElementById(`s${id}${seg}`);
  const val = el ? parseFloat(el.value) : 0;

  if (!el || el.value.trim() === "" || val === 0 || isNaN(val)) {
    return highlightSegments.includes(seg) ? seg : 0;
  }
  return val;
});

    const [bend1, bend2, bend3, bend4, bend5] = [1, 2, 3, 4, 5].map(i => {
      const val = parseFloat(document.getElementById(`s${id}bend${i}`)?.value || "0");
      return isNaN(val) ? 0 : val;
    });
    if (!isCanvasScaled) {
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      canvas.width = originalWidth * scale;
      canvas.height = originalHeight * scale; 
      isCanvasScaled = true; 
    }    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    switch (id) {
      case 0: drawShape0(ctx, a); break;
      case 1: drawShape1(ctx, a, b, bend1); break;
      case 2: drawShape2(ctx, a, b, c, bend1, bend2); break;
      case 3: drawShape3(ctx, a, b, c, d, bend1, bend2, bend3); break;
      case 4: drawShape4(ctx, a, b, c, d, e, bend1, bend2, bend3, bend4); break;
      case 5: drawShape5(ctx, a, b, c, d, e, f, bend1, bend2, bend3, bend4, bend5); break;
    }
    ctx.restore();
  });
}

function showContextMenu(x, y) {
  contextMenu.style.top = y + "px";
  contextMenu.style.left = x + "px";
  contextMenu.style.display = "block";
}

function mergeDuplicateRows() {
  const rows = document.querySelectorAll("#dataBody tr");
  const seen = new Map();

  rows.forEach((row, index) => {
    const canvas = row.querySelector("canvas");
    if (!canvas) return;

    const key = [
      canvas.dataset.shape,
      canvas.dataset.shapeName || "",
      canvas.dataset.a || "0",
      canvas.dataset.b || "0",
      canvas.dataset.c || "0",
      canvas.dataset.d || "0",
      canvas.dataset.e || "0",
      canvas.dataset.f || "0",
      canvas.dataset.bend1 || "0",
      canvas.dataset.bend2 || "0",
      canvas.dataset.bend3 || "0",
      canvas.dataset.bend4 || "0",
      canvas.dataset.bend5 || "0",
      row.cells[2]?.textContent || "", // dia
      row.cells[3]?.textContent || "", // len
    ].join("|");

    const qtyCell = row.cells[4];
    const qty = parseInt(qtyCell?.textContent || "0", 10);

    if (seen.has(key)) {
      // Nếu đã thấy, cộng dồn số lượng vào dòng đầu tiên
      const firstRow = seen.get(key);
      const firstQtyCell = firstRow.cells[4];
      const oldQty = parseInt(firstQtyCell.textContent || "0", 10);
      firstQtyCell.textContent = oldQty + qty;

      // Xoá dòng trùng hiện tại
      row.remove();
    } else {
      // Lưu dòng đầu tiên theo key
      seen.set(key, row);
    }
  });
}
