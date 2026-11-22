let isDirty = false;
document.addEventListener('input', () => { isDirty = true; });
let draftTimer;
function scheduleDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => { const was = isDirty; exportTable(true); isDirty = was; }, 800);
}
document.getElementById('rebarTable').addEventListener('input', scheduleDraft);
new MutationObserver(scheduleDraft).observe(document.getElementById('dataBody'), { childList: true });
window.addEventListener('beforeunload', function(e) {
  if (!isDirty) return;
  const message = 'データを保存しますか？';
  e.preventDefault();
  e.returnValue = message;
  return message;     
});


const sections = document.querySelectorAll('.tool-section');
const body = document.body;

sections.forEach(section => {
  const header = section.querySelector('.tool-header');
  header.addEventListener('click', () => {
    const isActive = section.classList.contains('active');
    
    if (isActive) {
      // Đang active, click để tắt
      section.classList.remove('active');
      // Nếu không còn mục active nào, bật lại toàn bộ header
      if (![...sections].some(s => s.classList.contains('active'))) {
        body.classList.add('no-active');
      }
    } else {
      // Có mục active rồi, reset hết
      sections.forEach(s => s.classList.remove('active'));
      // active mục hiện tại
      section.classList.add('active');
      // tắt class no-active để ẩn header khác
      body.classList.remove('no-active');
    }
  });
});

// Khi trang load, bật no-active để hiện hết header
body.classList.add('no-active');

// Mở & Đóng popup
function openToolPopup() {
  document.getElementById('toolPopup').style.display = 'block';
}

function closeToolPopup() {
  document.getElementById('toolPopup').style.display = 'none';
}

function parseInput(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const val = parseFloat(el.value);
  return isNaN(val) ? 0 : val;
}

function calculateMaterialUsage() {
  // Lấy dữ liệu nhập
  const workingLength = parseInput('input_working_length');
  const extraSpecified = parseInput('input_extra_specified');
  const materialLength = parseInput('input_material_length');
  const spliceLength = parseInput('input_splice_length');
  const anchor1 = parseInput('input_anchor1');
  const anchor2 = parseInput('input_anchor2');

  // Kiểm tra input quan trọng
  if (workingLength <= 0 || materialLength <= 0 || spliceLength <= 0 || materialLength <= spliceLength) {
    clearResults(); // xoá kết quả nếu thiếu input quan trọng
    return;
  }

  // Tính chiều dài cần thiết cho 1 đoạn
  let baseLength = workingLength;
  if (anchor1 > 0) baseLength += anchor1;
  if (anchor2 > 0) baseLength += anchor2;

  if (extraSpecified > 0) {
    baseLength -= extraSpecified;
    baseLength += spliceLength;
  }

  // Số lần dùng 使用材 (công thức đóng, không dùng vòng lặp)
  const repeatCount = Math.max(0, Math.floor((baseLength - spliceLength) / (materialLength - spliceLength)));
  const totalUsed = repeatCount * materialLength - spliceLength * (repeatCount - 1);
  const remainExtra = baseLength - totalUsed + spliceLength;

  // Hiển thị kết quả
  document.getElementById('result_extra_specified').value = extraSpecified;
  document.getElementById('result_material_length').value = materialLength;
  document.getElementById('result_repeat_count').value = repeatCount;
  document.getElementById('result_remain_extra').value = remainExtra;
}

function clearResults() {
  document.getElementById('result_extra_specified').value = '';
  document.getElementById('result_material_length').value = '';
  document.getElementById('result_repeat_count').value = '';
  document.getElementById('result_remain_extra').value = '';
}

// Đợi đến khi DOM đã sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  [
    'input_working_length',
    'input_extra_specified',
    'input_material_length',
    'input_splice_length',
    'input_anchor1',
    'input_anchor2'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateMaterialUsage);
  });
});

function calculateStairValues() {
  const kegai = parseInput('input_kegai');
  const fumizen = parseInput('input_fumizen');
  const slab = parseInput('input_slab_thickness');
  const stepCount = parseInput('input_step_count'); // nếu không có => 0

  // Kiểm tra input quan trọng
  if (kegai <= 0 || fumizen <= 0 || slab <= 0) {
    clearStairResults();
    return;
  }

  const adjust = slab / 3;
  const resultKegai = kegai + adjust;
  const resultFumizen = fumizen + adjust;
  const hypotenuse = Math.sqrt(kegai ** 2 + fumizen ** 2);

  let cutLength = 0;
  if (stepCount > 0) {
    cutLength = (resultKegai + resultFumizen) * stepCount + 600;
  }

  // Hiển thị kết quả
  document.getElementById('result_kegai').value = resultKegai.toFixed(0);
  document.getElementById('result_fumizen').value = resultFumizen.toFixed(0);
  document.getElementById('result_hypotenuse').value = hypotenuse.toFixed(0);
  document.getElementById('result_cutlength').value = cutLength.toFixed(0);
  updateStairCanvas();
}

function clearStairResults() {
  document.getElementById('result_kegai').value = '';
  document.getElementById('result_fumizen').value = '';
  document.getElementById('result_hypotenuse').value = '';
  document.getElementById('result_cutlength').value = '';
  updateStairCanvas();
}

// Đợi DOM sẵn sàng rồi gán sự kiện
window.addEventListener('DOMContentLoaded', () => {
  [
    'input_kegai',
    'input_fumizen',
    'input_slab_thickness',
    'input_step_count'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateStairValues);
  });
});



function roundUpTo50(value) {
  return Math.ceil(value / 50) * 50;
}


function calculateBeamMainBar() {
  // --- Lấy dữ liệu input ---
  const diameter = parseInput("input_diameter");
  const anchorageTop = parseInput("input_anchorage_top");
  const anchorageBottom = parseInput("input_anchorage_bottom");
  const pullback = parseInput("input_pullback");

  const colWidthStart = parseInput("input_column_width_start");
  const colWidthEnd = parseInput("input_column_width_end");
  const columnSpacing = parseInput("input_column_spacing");
  const columnSpacing2 = parseInput("input_column_spacing2");

  const stSpacing = parseInput("input_st_spacing");

  const topmargin = parseInput("input_column_top_margin");
  const bottommargin = parseInput("input_column_bottom_margin");
  const harakinlength = parseInput("input_column_anchor_length");
  const stagecount = parseInput("input_column_stage_count");

  if (
    colWidthStart > 0 &&
    colWidthEnd > 0 &&
    columnSpacing > 0
  ) {
    const effectiveLength = columnSpacing + colWidthStart + colWidthEnd - 2 * (pullback || 0);
    document.getElementById("output_effective_length").value = effectiveLength.toFixed(0);

    // Tính số lượng ST nếu stSpacing > 0
    if (stSpacing > 0) {
      const stCount = Math.ceil(columnSpacing / stSpacing) + 1;
      document.getElementById("output_st_count").value = stCount;
    } else {
      document.getElementById("output_st_count").value = "";
    }
  } else {
    document.getElementById("output_effective_length").value = "";
    document.getElementById("output_st_count").value = "";
  }

  const enoughForAnchor = (
    diameter > 0 &&
    anchorageTop > 0 &&
    anchorageBottom > 0 &&
    pullback > 0 && 
    colWidthStart > 0 &&
    colWidthEnd > 0
  );

  if (enoughForAnchor) {
    // Các tính toán anchor như trước
    const topMin = roundUpTo50(diameter * 11);
    const top1_calc = roundUpTo50(anchorageTop * diameter - colWidthStart + pullback);
    const top2_calc = roundUpTo50(anchorageTop * diameter - colWidthEnd + pullback);
    const anchorTop1 = Math.max(topMin, top1_calc);
    const anchorTop2 = Math.max(topMin, top2_calc);

    const bottom1 = roundUpTo50(anchorageBottom * diameter - colWidthStart + pullback);
    const bottom2 = roundUpTo50(anchorageBottom * diameter - colWidthEnd + pullback);
    const anchorBottom1 = Math.max(topMin, bottom1);
    const anchorBottom2 = Math.max(topMin, bottom2);

    // Gán kết quả anchor
    document.getElementById("output_anchor_top1").value = anchorTop1;
    document.getElementById("output_anchor_top2").value = anchorTop2;
    document.getElementById("output_anchor_bottom1").value = anchorBottom1;
    document.getElementById("output_anchor_bottom2").value = anchorBottom2;

    // Tính các output mới theo công thức bạn cung cấp
    const output_end = roundUpTo50(anchorTop1 + colWidthStart - pullback + columnSpacing / 4 + topmargin * diameter);
    const center_single = roundUpTo50(columnSpacing / 2 + 2 * bottommargin * diameter);
    const center_outer = roundUpTo50(7 * columnSpacing / 12 + 2 * bottommargin * diameter);
    const end_continuous = roundUpTo50(columnSpacing / 2 + columnSpacing2 / 2 + colWidthEnd + 2 * topmargin * diameter);
    const column_anchor_length = roundUpTo50(columnSpacing + 2 * harakinlength);
    const habadome_count = Math.ceil(columnSpacing / 1000) * (stagecount || 0);

    document.getElementById("output_end").value = output_end;
    document.getElementById("output_center_single").value = center_single;
    document.getElementById("output_center_outer").value = center_outer;
    document.getElementById("output_end_continuous").value = end_continuous;
    document.getElementById("output_column_anchor_length").value = column_anchor_length;
    document.getElementById("output_habadome_count").value = habadome_count;

  } else {
    // Clear nếu chưa đủ input cho anchor
    document.getElementById("output_anchor_top1").value = "";
    document.getElementById("output_anchor_top2").value = "";
    document.getElementById("output_anchor_bottom1").value = "";
    document.getElementById("output_anchor_bottom2").value = "";

    document.getElementById("output_end").value = "";
    document.getElementById("output_center_single").value = "";
    document.getElementById("output_center_outer").value = "";
    document.getElementById("output_end_continuous").value = "";
    document.getElementById("output_column_anchor_length").value = "";
    document.getElementById("output_habadome_count").value = "";
  }

  updateBeamCanvas();
}
// --- Gán sự kiện tự động cập nhật ---
window.addEventListener("DOMContentLoaded", () => {
  [
    "input_diameter", "input_anchorage_top", "input_anchorage_bottom",
    "input_pullback", "input_column_width_start", "input_column_width_end",
    "input_column_spacing", "input_column_spacing2", "input_st_spacing",
    "input_column_top_margin", "input_column_bottom_margin",
    "input_column_anchor_length", "input_column_stage_count"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calculateBeamMainBar);
  });

  // Tính lần đầu khi load trang
  calculateBeamMainBar();
});


function calculateWallRebars() {
  // Lấy giá trị input
  const shortLength = +document.getElementById("input_short_length").value;
  const shortSpacing = +document.getElementById("input_short_spacing").value;
  const shortDiameter = +document.getElementById("input_short_diameter").value;
  const anchorageTop = +document.getElementById("input_wall_anchorage_top").value;

  const longLength = +document.getElementById("input_long_length").value;
  const longSpacing = +document.getElementById("input_long_spacing").value;
  const longDiameter = +document.getElementById("input_long_diameter").value;
  const anchorageBottom = +document.getElementById("input_wall_anchorage_bottom").value;

  const valid =
    shortLength > 0 && shortSpacing > 0 && shortDiameter > 0 && anchorageTop > 0 &&
    longLength > 0 && longSpacing > 0 && longDiameter > 0 && anchorageBottom > 0;

  if (!valid) {
    // Nếu không đủ dữ liệu thì xoá kết quả
    [
      "main_rebar_bottom_dan", "main_rebar_top_dan", "main_rebar_count", "main_rebar_count1",
      "distribution_rebar_bottom_dan", "distribution_rebar_top_dan", "distribution_rebar_count", "distribution_rebar_count1"
    ].forEach(id => document.getElementById(id).value = "");
    return;
  }

  // 主筋 (Main rebar)
  const mainBottomDan = shortLength + anchorageBottom * shortDiameter * 2;
  const mainTopDan = shortLength + anchorageTop * shortDiameter * 2;
  const mainCount = Math.ceil(longLength / shortSpacing) + 1;

  // 配力筋 (Distribution rebar)
  const distBottomDan = longLength + anchorageBottom * longDiameter * 2;
  const distTopDan = longLength + anchorageTop * longDiameter * 2;
  const distCount = Math.ceil(shortLength / longSpacing) + 1;

  // Gán giá trị kết quả
  document.getElementById("main_rebar_bottom_dan").value = mainBottomDan;
  document.getElementById("main_rebar_top_dan").value = mainTopDan;
  document.getElementById("main_rebar_count").value = mainCount;
  document.getElementById("main_rebar_count1").value = mainCount;

  document.getElementById("distribution_rebar_bottom_dan").value = distBottomDan;
  document.getElementById("distribution_rebar_top_dan").value = distTopDan;
  document.getElementById("distribution_rebar_count").value = distCount;
  document.getElementById("distribution_rebar_count1").value = distCount;
}

// --- Gán sự kiện tự động cập nhật cho tường/sàn ---
window.addEventListener("DOMContentLoaded", () => {
  [
    "input_short_length", "input_short_spacing", "input_short_diameter", "input_wall_anchorage_top",
    "input_long_length", "input_long_spacing", "input_long_diameter", "input_wall_anchorage_bottom"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calculateWallRebars);
  });
});




function drawstairCanvas(ctx, a, b, c, d) {

  const x0 = 16, y0 = 16;
  const x1 = x0 + 120, y1 = y0;
  const x2 = 115, y2 = 115;
  const x3 = 10, y3 = 10;
  const x4 = 125, y4 = 125;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Xóa canvas

  drawLineWithLabel(ctx, x1, y1, x0, y0, a); // Đoạn a
  drawLineWithLabel(ctx, x2, y2, x1, y1, b); // Đoạn b
  drawLineWithLabel(ctx, x3, y3, x4, y4, c); // Đoạn c

  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  const labelText = d + '段';
  ctx.fillText(labelText, x1 + 15, y0 - 3); // Hiển thị số段
}
function updateStairCanvas() {
  const a = document.getElementById("result_fumizen").value;
  const b = document.getElementById("result_kegai").value;
  const c = document.getElementById("result_hypotenuse").value;
  const d = document.getElementById("input_step_count").value;

  const canvas = document.getElementById("stairCanvas");
  const ctx = canvas.getContext("2d");

  // Kiểm tra nếu tất cả đều > 0 thì vẽ với nhãn thật, nếu không thì dùng a,b,c,d
  if (a > 0 && b > 0 && c > 0 && d > 0) {
    drawstairCanvas(ctx, a, b, c, d);
  } else {
    drawstairCanvas(ctx, 'a', 'b', 'c', 'd');
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ["result_fumizen", "result_kegai", "result_hypotenuse", "input_step_count"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateStairCanvas);
  });
});
window.addEventListener("DOMContentLoaded", () => {
  // Vẽ mẫu ban đầu
  const canvas = document.getElementById("stairCanvas");
  const ctx = canvas.getContext("2d");
  drawstairCanvas(ctx, 'a', 'b', 'c', 'd');

  // Gắn sự kiện input để cập nhật lại nếu có đủ dữ liệu
  const ids = [
    "result_fumizen", "result_kegai", "result_hypotenuse", "input_step_count"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateStairCanvas);
    }
  });
});


function drawAnchorCanvas(ctx, anchor1, anchor2) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Đường ngang cố định từ (20, 20) đến (140, 20)
  drawLineWithLabel(ctx, 20, 20, 100, 20, '');
  drawLineWithLabel(ctx, 40, 15, 50, 15, '');
  drawLineWithLabel(ctx, 70, 15, 80, 15, '');

  // Nếu có anchor1 > 0 → vẽ đường đứng bên trái
  if (anchor1 > 0) {
    drawLineWithLabel(ctx, 20, 20, 20, 45, anchor1);
  }

  // Nếu có anchor2 > 0 → vẽ đường đứng bên phải
  if (anchor2 > 0) {
    drawLineWithLabel(ctx,  100, 45, 100, 20, anchor2);
  }

}

function updateAnchorCanvas() {
  const val1 = parseFloat(document.getElementById("input_anchor1").value);
  const val2 = parseFloat(document.getElementById("input_anchor2").value);

  const canvas = document.getElementById("anchorCanvas");
  const ctx = canvas.getContext("2d");

  const anchor1 = (val1 > 0) ? val1 : 0;
  const anchor2 = (val2 > 0) ? val2 : 0;

  drawAnchorCanvas(ctx, anchor1, anchor2);
}

window.addEventListener("DOMContentLoaded", () => {
  // Vẽ mặc định khi load trang
  const canvas = document.getElementById("anchorCanvas");
  const ctx = canvas.getContext("2d");
  drawAnchorCanvas(ctx, 0, 0); // Không có giá trị ban đầu

  // Gắn sự kiện tự động cập nhật
  ["input_anchor1", "input_anchor2"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateAnchorCanvas);
    }
  });
});


function drawBeamCanvas(ctx, top_length, bottom_length) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Vẽ khung dầm
  drawLineWithLabel(ctx, 5, 5, 110, 5, 0);   // Trên ngang
  drawLineWithLabel(ctx, 5, 5, 5, 45, 0);    // Trái đứng
  drawLineWithLabel(ctx, 110, 45, 110, 5, 0);  // Phải đứng

  drawLineWithLabel(ctx, 10, 60, 105, 60, 0);   // Dưới ngang
  drawLineWithLabel(ctx, 10, 60, 10, 25, 0);    // Dưới trái đứng
  drawLineWithLabel(ctx, 105, 60, 105, 25, 0);  // Dưới phải đứng

  // Nhãn chiều dài hiệu dụng
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  toplength = '切' + top_length;
  bottomlength ='切' + bottom_length;
  ctx.fillText(toplength, 30, 22);
  ctx.fillText(bottomlength, 30, 52);
}
function updateBeamCanvas() {
  const canvas = document.getElementById("beamCanvas");
  const ctx = canvas.getContext("2d");

  const effective_length = parseFloat(document.getElementById("output_effective_length").value) || 0;
  const anchorTop1 = parseFloat(document.getElementById("output_anchor_top1").value) || 0;
  const anchorTop2 = parseFloat(document.getElementById("output_anchor_top2").value) || 0;
  const anchorBottom1 = parseFloat(document.getElementById("output_anchor_bottom1").value) || 0;
  const anchorBottom2 = parseFloat(document.getElementById("output_anchor_bottom2").value) || 0;

  const top_length = effective_length + anchorTop1 + anchorTop2;
  const bottom_length = effective_length + anchorBottom1 + anchorBottom2;

  drawBeamCanvas(ctx, top_length, bottom_length);
}
window.addEventListener("DOMContentLoaded", () => {
  updateBeamCanvas(); // Vẽ ban đầu

  const input = document.getElementById("output_effective_length");

  // Quan sát thay đổi thuộc tính (value) để cập nhật
  const observer = new MutationObserver(updateBeamCanvas);
  observer.observe(input, { attributes: true, attributeFilter: ['value'] });
});
window.addEventListener("DOMContentLoaded", () => {
  // Focus vào input đầu tiên
  const inputs = Array.from(document.querySelectorAll('.form-column input:not([readonly])'));
  if (inputs.length > 0) {
    inputs[0].focus();
  }

  // Bắt sự kiện Enter để chuyển sang input tiếp theo
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const next = inputs[index + 1];
        if (next) {
          next.focus();
        }
      }
    });
  });
});





function drawTriangle(ctx, a, b, c, d) {
  const x0 = 25, y0 = 100;
  const x1 = x0 + 100, y1 = y0;
  const x2 = 25, y2 = 25;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Xóa canvas

  drawLineWithLabel(ctx, x2, y2, x0, y0, b); // cạnh a
  drawLineWithLabel(ctx, x0, y0, x1, y1, a); // cạnh b
  drawLineWithLabel(ctx, x2, y2, x1, y1, c); // cạnh c
  
  // Vẽ ký hiệu góc vuông nhỏ tại đỉnh (x0,y0)
  drawLineWithLabel(ctx, 35, 100, 35, 90, 0);
  drawLineWithLabel(ctx, 35, 90, 25, 90, 0);

  // --- Vẽ cung góc tại đỉnh (x1, y1) ---
  // Vector từ (x1,y1) tới (x0,y0) và (x2,y2)
  const radius = 20; // bán kính cung góc

  const v1x = x0 - x1;
  const v1y = y0 - y1;
  const v2x = x2 - x1;
  const v2y = y2 - y1;

  const angle1 = Math.atan2(v1y, v1x);
  const angle2 = Math.atan2(v2y, v2x);

  // Đảm bảo startAngle < endAngle (cho vẽ đúng chiều)
  let startAngle = angle1;
  let endAngle = angle2;
  if (endAngle < startAngle) {
    [startAngle, endAngle] = [endAngle, startAngle];
  }

  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.arc(x1, y1, radius, startAngle, endAngle, true);
  ctx.stroke();




  // Vẽ nhãn góc d°
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  const labelAngle = (startAngle + endAngle) / 2;
  const labelX = x1+5;
  const labelY = y1;
  ctx.fillText(d + '°', labelX, labelY);
 if (!isNaN(d)) {
  let e = 90 - d;
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(e.toFixed(2) + '°', 40, 30);
  
  
// --- Vẽ cung góc tại đỉnh (x2, y2) ---
  const v3x = x0 - x2;
  const v3y = y0 - y2;
  const v4x = x1 - x2;
  const v4y = y1 - y2;

  const angle3 = Math.atan2(v3y, v3x); // cạnh vuông
  const angle4 = Math.atan2(v4y, v4x); // cạnh huyền

  let start2 = angle3;
  let end2 = angle4;
  if (end2 < start2) {
    [start2, end2] = [end2, start2];
  }

  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.arc(x2, y2, 15, start2, end2, false);
  ctx.stroke();
}
}

function updateTriangle() {
  const a = document.getElementById("input_teihen").value;
  const b = document.getElementById("input_takasa").value;
  const c = document.getElementById("result_shahen").value;
  const d = document.getElementById("result_kakudo").value;

  const canvas = document.getElementById("triangleCanvas");
  const ctx = canvas.getContext("2d");

  // Kiểm tra nếu tất cả đều > 0 thì vẽ với nhãn thật, nếu không thì dùng a,b,c,d
  if (a > 0 && b > 0 && c > 0 && d > 0) {
    drawTriangle(ctx, a, b, c, d);
  } else {
    drawTriangle(ctx, 'a', 'b', 'c', 'd');
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ["input_teihen", "input_takasa", "result_shahen", "result_kakudo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateTriangle);
  });
});
window.addEventListener("DOMContentLoaded", () => {
  // Vẽ mẫu ban đầu
  const canvas = document.getElementById("triangleCanvas");
  const ctx = canvas.getContext("2d");
  drawTriangle(ctx, 'a', 'b', 'c', 'd');

  // Gắn sự kiện input để cập nhật lại nếu có đủ dữ liệu
  const ids = [
    "input_teihen", "input_takasa", "result_shahen", "result_kakudo"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateTriangle);
    }
  });
});







function roundTo2(num) {
  return Math.round(num * 100) / 100;
}

function calculateTriangle() {
  const base = parseFloat(document.getElementById("input_teihen").value);
  const height = parseFloat(document.getElementById("input_takasa").value);

  if (isNaN(base) || base <= 0 || isNaN(height) || height <= 0) {
    document.getElementById("result_shahen").value = "";
    document.getElementById("result_kakudo").value = "";
    updateTriangle();
    return;
  }

  const hypotenuse = Math.sqrt(base * base + height * height);
  const angleRad = Math.atan(height / base);
  const angleDeg = angleRad * (180 / Math.PI);

  document.getElementById("result_shahen").value = roundTo2(hypotenuse);
  document.getElementById("result_kakudo").value = roundTo2(angleDeg);

  updateTriangle();
}

document.getElementById("input_teihen").addEventListener("input", calculateTriangle);
document.getElementById("input_takasa").addEventListener("input", calculateTriangle);
