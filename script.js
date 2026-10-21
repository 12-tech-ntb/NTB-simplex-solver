let isSolved = false;

function showToast(message) {
  const toast = document.getElementById("custom-toast");
  document.getElementById("toast-text").innerText = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function handleNavClick(viewIndex) {
  if (viewIndex === 1) showView(1);
  else if (isSolved) showView(viewIndex);
  else showToast("Vui lòng bấm 'Giải bài toán' trước khi xem các bước giải!");
}

function lockNavigation() {
  isSolved = false;
  document.getElementById("nav-2").classList.add("disabled");
  document.getElementById("nav-3").classList.add("disabled");
}

function showView(viewIndex) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".nav-step")
    .forEach((n) => n.classList.remove("active"));
  document
    .getElementById(
      `view-${viewIndex === 1 ? "input" : viewIndex === 2 ? "steps" : "result"}`,
    )
    .classList.add("active");
  document.getElementById(`nav-${viewIndex}`).classList.add("active");

  const footer = document.getElementById("app-footer");
  if (footer) {
    if (viewIndex === 2) footer.classList.add("hidden");
    else footer.classList.remove("hidden");
  }
}

function formatEq(coeffs, startIndex = 1) {
  let terms = [];
  for (let i = 0; i < coeffs.length; i++) {
    let c = coeffs[i];
    let termStr = `${Math.abs(c)}x<sub>${startIndex + i}</sub>`;
    if (i === 0) terms.push(c < 0 ? `-${termStr}` : termStr);
    else terms.push(c < 0 ? `- ${termStr}` : `+ ${termStr}`);
  }
  return terms.join(" ");
}

// ========================================================
// 1. BỘ CHUYỂN ĐỔI SỐ THẬP PHÂN SANG PHÂN SỐ TỐI GIẢN
// ========================================================
function toFraction(val) {
  if (val === null || val === undefined) return "-";
  if (Math.abs(val) < 1e-6) return "0";
  if (Math.abs(Math.round(val) - val) < 1e-6) return Math.round(val).toString();

  let sign = val < 0 ? "-" : "";
  val = Math.abs(val);

  let h1 = 1,
    h2 = 0,
    k1 = 0,
    k2 = 1;
  let b = val;
  for (let i = 0; i < 20; i++) {
    let a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    if (Math.abs(val - h1 / k1) < 1e-7) break;
    if (b - a < 1e-7) break;
    b = 1 / (b - a);
  }
  if (k1 === 1) return sign + h1;
  return sign + h1 + "/" + k1;
}

function formatBigM(valObj) {
  let v = valObj.v;
  let m = valObj.m;
  if (Math.abs(m) < 1e-6) return toFraction(v);
  if (Math.abs(v) < 1e-6)
    return Math.abs(m - 1) < 1e-6
      ? "M"
      : Math.abs(m + 1) < 1e-6
        ? "-M"
        : toFraction(m) + "M";
  let sign = m > 0 ? "+" : "-";
  let absM = Math.abs(m);
  let mStr = Math.abs(absM - 1) < 1e-6 ? "M" : toFraction(absM) + "M";
  return `${toFraction(v)} ${sign} ${mStr}`;
}

function compareBigM(a, b) {
  let dm = a.m - b.m;
  if (Math.abs(dm) > 1e-6) return dm;
  return a.v - b.v;
}

function isNegativeBigM(a) {
  return a.m < -1e-6 || (Math.abs(a.m) <= 1e-6 && a.v < -1e-6);
}
function isPositiveBigM(a) {
  return a.m > 1e-6 || (Math.abs(a.m) <= 1e-6 && a.v > 1e-6);
}

// ==========================================
// 2. TẠO LƯỚI MA TRẬN NHẬP LIỆU (TỐI ƯU UX)
// ==========================================
function generateMatrix() {
  let n_input = document.getElementById("inp-vars").value;
  let m_input = document.getElementById("inp-cons").value;

  // BẢO VỆ: Kiểm tra nếu người dùng chưa nhập hoặc nhập số không hợp lệ
  if (!n_input || !m_input || n_input <= 0 || m_input <= 0) {
    showToast(
      "Vui lòng nhập đầy đủ Số biến và Số ràng buộc hợp lệ (lớn hơn 0)!",
    );
    return; // Dừng lại, không cho tạo ma trận
  }
  document.getElementById("view-input").classList.remove("setup-mode");

  const n = parseInt(document.getElementById("inp-vars").value);
  const m = parseInt(document.getElementById("inp-cons").value);

  // Đã thay value="0" thành placeholder="0" cho Hàm mục tiêu
  let objTh = "<tr>",
    objTd = "<tr>";
  for (let i = 1; i <= n; i++) {
    objTh += `<th>x${i}</th>`;
    objTd += `<td><input type="number" class="cell-input obj-c" placeholder="0"></td>`;
  }
  document.getElementById("obj-table").innerHTML =
    `<thead>${objTh}<th></th></tr></thead><tbody>${objTd}<td>➔ Z</td></tr></tbody>`;

  let consTh = "<tr><th>#</th>";
  for (let i = 1; i <= n; i++) consTh += `<th>x${i}</th>`;
  document.getElementById("cons-table").innerHTML =
    `<thead>${consTh}<th>Dấu</th><th>b</th></tr></thead><tbody id="cons-body"></tbody>`;

  let consBody = "";
  for (let i = 1; i <= m; i++) {
    let row = `<tr><td>${i}</td>`;

    // Đã thay value="0" thành placeholder="0" cho các hệ số A
    for (let j = 1; j <= n; j++) {
      row += `<td><input type="number" class="cell-input cons-a" data-row="${i}" placeholder="0"></td>`;
    }

    row += `<td>
            <select class="operator-select" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; cursor: pointer; color: #334155; font-weight: bold;">
                <option value="<=">&le;</option>
                <option value=">=">&ge;</option>
                <option value="=">=</option>
            </select>
        </td>`;

    // Đã thay value="0" thành placeholder="0" cho hệ số tự do b
    row += `<td><input type="number" class="cell-input cons-b" placeholder="0"></td></tr>`;
    consBody += row;
  }
  document.getElementById("cons-body").innerHTML = consBody;

  let vars = [];
  for (let i = 1; i <= n; i++) vars.push(`x<sub>${i}</sub>`);
  document.getElementById("non-negative-condition").innerHTML =
    `Điều kiện không âm: ${vars.join(", ")} &ge; 0`;

  lockNavigation();
  showView(1);
}

function clearInputs() {
  document
    .querySelectorAll(".matrix-table .cell-input")
    .forEach((inp) => (inp.value = ""));
  document
    .querySelectorAll(".operator-select")
    .forEach((sel) => (sel.value = "<="));
  lockNavigation();
  showView(1);
}

// ==========================================
// 3. SIÊU LÕI THUẬT TOÁN TOÀN NĂNG (BIG-M + FLIP SIGN)
// ==========================================
function startSolving() {
  const n = parseInt(document.getElementById("inp-vars").value);
  const m = parseInt(document.getElementById("inp-cons").value);
  const type = document.getElementById("inp-type").value;
  const isMax = type === "MAX";

  let C_input = Array.from(document.querySelectorAll(".obj-c")).map(
    (inp) => parseFloat(inp.value) || 0,
  );
  let A_input = [],
    B_input = [],
    Ops = [];
  for (let i = 1; i <= m; i++) {
    A_input.push(
      Array.from(document.querySelectorAll(`.cons-a[data-row="${i}"]`)).map(
        (inp) => parseFloat(inp.value) || 0,
      ),
    );
    Ops.push(document.querySelectorAll(".operator-select")[i - 1].value);
    B_input.push(
      parseFloat(document.querySelectorAll(".cons-b")[i - 1].value) || 0,
    );
  }

  let stepsHTML = "";

  // --- BƯỚC 1: BÀI TOÁN BAN ĐẦU ---
  let origObj = `<span class="modern-highlight">${type} F(x) =</span> ${formatEq(C_input)}`;
  let origCons = A_input.map(
    (row, i) =>
      `${formatEq(row)} ${Ops[i].replace("<=", "&le;").replace(">=", "&ge;")} ${B_input[i]}`,
  ).join("<br>");
  let origCond =
    Array.from({ length: n }, (_, i) => `x<sub>${i + 1}</sub>`).join(", ") +
    " &ge; 0";

  stepsHTML += `<div class="modern-step-card"><div class="modern-step-header"><div class="modern-badge">Bước 1</div><div><h3 class="modern-title">Bài toán ban đầu</h3><p class="modern-subtitle">Giữ nguyên đúng mô hình bạn đã nhập</p></div></div><div class="modern-math-box" style="font-size:20px;">${origObj}<br><br>${origCons}<br><br><span style="color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: block;">Điều kiện: ${origCond}</span></div></div>`;

  // --- TIỀN XỬ LÝ: LẬT DẤU NẾU B < 0 ---
  let flippedRows = new Array(m).fill(false);
  for (let i = 0; i < m; i++) {
    if (B_input[i] < 0) {
      B_input[i] = -B_input[i];
      for (let j = 0; j < n; j++) A_input[i][j] = -A_input[i][j];
      if (Ops[i] === "<=") Ops[i] = ">=";
      else if (Ops[i] === ">=") Ops[i] = "<=";
      flippedRows[i] = true;
    }
  }

  // --- THIẾT LẬP BIẾN ---
  let varNames = [];
  let C_j = [];
  for (let j = 0; j < n; j++) {
    varNames.push(`x<sub>${j + 1}</sub>`);
    C_j.push({ v: C_input[j], m: 0 });
  }

  let constraintsData = [];
  let basis = [];
  let mFactor = isMax ? -1 : 1;

  for (let i = 0; i < m; i++) {
    if (Ops[i] === "<=") {
      varNames.push(`x<sub>${varNames.length + 1}</sub>`);
      C_j.push({ v: 0, m: 0 });
      basis.push(varNames.length - 1);
      constraintsData.push({ type: "<=", slackIdx: varNames.length - 1 });
    } else if (Ops[i] === ">=") {
      varNames.push(`x<sub>${varNames.length + 1}</sub>`);
      C_j.push({ v: 0, m: 0 });
      let surplusIdx = varNames.length - 1;

      varNames.push(`x<sub>${varNames.length + 1}</sub>`);
      C_j.push({ v: 0, m: mFactor });
      let artIdx = varNames.length - 1;

      basis.push(artIdx);
      constraintsData.push({
        type: ">=",
        surplusIdx: surplusIdx,
        artIdx: artIdx,
      });
    } else {
      varNames.push(`x<sub>${varNames.length + 1}</sub>`);
      C_j.push({ v: 0, m: mFactor });
      basis.push(varNames.length - 1);
      constraintsData.push({ type: "=", artIdx: varNames.length - 1 });
    }
  }

  let totalVars = varNames.length;
  // =========================================================================
  // --- KHỞI TẠO BẢNG ĐƠN HÌNH (Kéo lên chạy sớm để lấy dữ liệu vẽ Ma trận A)
  // =========================================================================
  let tableau = [];
  for (let i = 0; i < m; i++) {
    let row = new Array(totalVars + 1).fill(0);
    for (let j = 0; j < n; j++) row[j] = A_input[i][j];
    let info = constraintsData[i];
    if (info.type === "<=") row[info.slackIdx] = 1;
    else if (info.type === ">=") {
      row[info.surplusIdx] = -1;
      row[info.artIdx] = 1;
    } else {
      row[info.artIdx] = 1;
    }
    row[totalVars] = B_input[i];
    tableau.push(row);
  }

  // =========================================================================
  // --- BƯỚC 2: DẠNG CHUẨN & VẼ MA TRẬN A
  // =========================================================================
  let stdObjStr = C_j.map((cj, idx) => {
    let str = formatBigM(cj);
    if (str === "0") return "";
    if (idx === 0 || str.startsWith("-")) return `${str}${varNames[idx]} `;
    return `+ ${str}${varNames[idx]} `;
  })
    .join("")
    .trim();
  if (stdObjStr === "") stdObjStr = "0";

  let stdObj = `<span class="modern-highlight">F(x) =</span> ${stdObjStr} <span class="modern-highlight">&rarr; ${type}</span>`;
  let stdConsHTML = "";
  let slackTags = "";

  for (let i = 0; i < m; i++) {
    let rowStr = formatEq(A_input[i]);
    let info = constraintsData[i];
    let flipMsg = flippedRows[i]
      ? `<div style="color: #d97706; font-size: 13px; margin-bottom: 6px;">Nhân cả hai vế với -1 và đảo chiều dấu.</div>`
      : "";
    let varsMsg = "";

    if (info.type === "<=") {
      rowStr += ` <span style="color: #0284c7; font-weight: bold;">+ 1${varNames[info.slackIdx]}</span> = ${B_input[i]}`;
      varsMsg = `${varNames[info.slackIdx]}: biến phụ (Slack)`;
    } else if (info.type === ">=") {
      rowStr += ` <span style="color: #ea580c; font-weight: bold;">- 1${varNames[info.surplusIdx]}</span> <span style="color: #16a34a; font-weight: bold;">+ 1${varNames[info.artIdx]}</span> = ${B_input[i]}`;
      varsMsg = `${varNames[info.surplusIdx]}: biến dư (Surplus)<br>${varNames[info.artIdx]}: biến giả (Artificial)`;
    } else {
      rowStr += ` <span style="color: #16a34a; font-weight: bold;">+ 1${varNames[info.artIdx]}</span> = ${B_input[i]}`;
      varsMsg = `${varNames[info.artIdx]}: biến giả (Artificial)`;
    }

    stdConsHTML += `${rowStr}<br>`;
    slackTags += `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
            <div style="font-weight: 700; color: #1e293b; margin-bottom: 6px;">Ràng buộc ${i + 1}</div>
            ${flipMsg}
            <div style="color: #64748b; font-size: 14px; line-height: 1.6;">${varsMsg}</div>
        </div>`;
  }

  // TẠO UI CHO MA TRẬN A (Highlight đường chéo Cơ sở)
  let matrixA_HTML = `<div style="margin-top: 24px; padding-top: 24px; border-top: 1px dashed #cbd5e1;">`;
  matrixA_HTML += `
    <div style="margin-bottom: 16px;">
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Ma trận hệ số A</div>
        <div style="font-size: 14px; color: #64748b;">Hệ thống tự động trích xuất <span style="color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">Ma trận đơn vị (đường chéo số 1)</span> để cấu thành Phương án xuất phát.</div>
    </div>`;

  matrixA_HTML += `<div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);"><table style="width: 100%; border-collapse: collapse; text-align: center; font-family: 'Courier New', Courier, monospace; font-size: 16px; background: white;">`;

  // Header Ma trận A
  matrixA_HTML += `<thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;"><tr>`;
  for (let j = 0; j < totalVars; j++) {
    let isBasis = basis.includes(j);
    matrixA_HTML += `<th style="padding: 12px 10px; color: ${isBasis ? "#059669" : "#64748b"}; font-weight: ${isBasis ? "900" : "600"}; border-right: 1px solid #f1f5f9;">${varNames[j]}</th>`;
  }
  matrixA_HTML += `</tr></thead><tbody>`;

  // Body Ma trận A
  for (let i = 0; i < m; i++) {
    matrixA_HTML += `<tr style="border-bottom: 1px solid #f1f5f9;">`;
    for (let j = 0; j < totalVars; j++) {
      let isBasis = basis.includes(j);
      let isDiagonal = basis[i] === j;
      let val = tableau[i][j];

      let cellStyle = `padding: 14px 10px; border-right: 1px solid #f1f5f9; `;
      if (isBasis) {
        if (isDiagonal) {
          // Highlight cực mạnh cho số 1 nằm trên đường chéo
          cellStyle += `background: #ecfdf5; color: #059669; font-weight: 900; font-size: 18px; text-shadow: 0 0 1px rgba(5,150,105,0.5);`;
        } else {
          // Mờ đi đối với các số 0 trong cột cơ sở
          cellStyle += `background: #f0fdf4; color: #a7f3d0; font-weight: 400;`;
        }
      } else {
        cellStyle += `color: #475569;`;
      }
      matrixA_HTML += `<td style="${cellStyle}">${val}</td>`;
    }
    matrixA_HTML += `</tr>`;
  }
  matrixA_HTML += `</tbody></table></div></div>`;

  stepsHTML += `
    <div class="modern-step-card" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 30px;">
        <div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px;">
            <div style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">BƯỚC 2</div>
            <div>
                <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Đưa về dạng chuẩn & Trích xuất</h3>
                <p style="margin: 0; font-size: 14px; color: #64748b;">Chuẩn hóa vế phải, bổ sung biến và trích xuất Ma trận A</p>
            </div>
        </div>
        <div class="modern-grid-2" style="padding: 24px;">
            <div style="display: flex; flex-direction: column;">
                <div class="modern-math-box" style="font-size:20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 0; height: 100%;">
                    ${stdObj}<br><br>${stdConsHTML}<br>
                    <span style="color: #94a3b8; font-style: italic; font-size: 15px;">Tất cả biến &ge; 0</span>
                </div>
            </div>
            <div class="modern-info-panel" style="background: transparent; border: none; box-shadow: none; padding: 0;">
                ${slackTags}
            </div>
        </div>
        
        <!-- Render Ma trận A chèn vào lưới dưới cùng của Bước 2 -->
        <div style="padding: 0 24px 24px 24px;">
            ${matrixA_HTML}
        </div>
    </div>`;

  // =========================================================================
  // --- BƯỚC 3: PHƯƠNG ÁN CỰC BIÊN XUẤT PHÁT
  // =========================================================================
  let x0 = new Array(totalVars).fill(0);
  for (let i = 0; i < m; i++) x0[basis[i]] = B_input[i];

  let x0Str = `X<sup>0</sup> = ( <span style="color: #059669;">${x0.map((v) => toFraction(v)).join('</span>, <span style="color: #059669;">')}</span> )`;

  let basisBadges = "";
  for (let i = 0; i < m; i++) {
    basisBadges += `<div style="display: flex; align-items: center; gap: 8px; background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"><span style="color: #7dd3fc; font-size: 13px;">Dòng ${i + 1}</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> <span style="font-size: 16px; font-weight: 700;">${varNames[basis[i]]}</span></div>`;
  }

  stepsHTML += `
    <div class="modern-step-card" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 30px;">
        <div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px;">
            <div style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">BƯỚC 3</div>
            <div>
                <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Phương án cực biên xuất phát</h3>
                <p style="margin: 0; font-size: 14px; color: #64748b;">Khởi tạo ma trận cơ sở ban đầu trước khi đưa vào bảng Đơn hình</p>
            </div>
        </div>
        <div style="padding: 24px;">
            <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center;">
                ${basisBadges}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">Vector Phương Án Đầu Tiên</div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 22px; color: #0f172a; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    ${x0Str}
                </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; font-size: 14px; font-weight: 600;">
                <div style="display: flex; align-items: center; gap: 8px; color: #64748b;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Hoàn tất chuẩn hóa</div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <div style="display: flex; align-items: center; gap: 8px; color: #0ea5e9;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> Trích xuất ma trận</div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <div style="display: flex; align-items: center; gap: 8px; color: #64748b;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Sẵn sàng tối ưu</div>
            </div>
        </div>
    </div>`;

  // (Đoạn code VÒNG LẶP XOAY BẢNG `let iteration = 1; while (true) {...` sẽ nằm ngay dưới đây)
  // --- KHỞI TẠO BẢNG ĐƠN HÌNH ---

  for (let i = 0; i < m; i++) {
    let row = new Array(totalVars + 1).fill(0);
    for (let j = 0; j < n; j++) row[j] = A_input[i][j];
    let info = constraintsData[i];
    if (info.type === "<=") row[info.slackIdx] = 1;
    else if (info.type === ">=") {
      row[info.surplusIdx] = -1;
      row[info.artIdx] = 1;
    } else {
      row[info.artIdx] = 1;
    }
    row[totalVars] = B_input[i];
    tableau.push(row);
  }

  stepsHTML += `<div class="modern-step-card"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background: #0f172a; color: white; border-color: #0f172a;">Bước 4</div><div><h3 class="modern-title">Quá trình lặp Đơn Hình</h3><p class="modern-subtitle">Hỗ trợ thuật toán M-lớn (Big-M) tự động</p></div></div><div id="simplex-tables-container" style="margin-top: 20px;">`;

  // --- VÒNG LẶP XOAY BẢNG ---
  let iteration = 1;
  while (true) {
    let deltas = [];
    for (let j = 0; j <= totalVars; j++) {
      let v = 0,
        m_val = 0;
      for (let i = 0; i < m; i++) {
        let cb = C_j[basis[i]];
        v += cb.v * tableau[i][j];
        m_val += cb.m * tableau[i][j];
      }
      if (j < totalVars) {
        v -= C_j[j].v;
        m_val -= C_j[j].m;
      }
      deltas.push({ v: v, m: m_val });
    }

    let pivotCol = -1;
    let bestDelta = { v: 0, m: 0 };
    for (let j = 0; j < totalVars; j++) {
      if (isMax) {
        if (
          isNegativeBigM(deltas[j]) &&
          compareBigM(deltas[j], bestDelta) < 0
        ) {
          bestDelta = deltas[j];
          pivotCol = j;
        }
      } else {
        if (
          isPositiveBigM(deltas[j]) &&
          compareBigM(deltas[j], bestDelta) > 0
        ) {
          bestDelta = deltas[j];
          pivotCol = j;
        }
      }
    }

    let isOptimal = pivotCol === -1;
    if (isOptimal) break;

    let pivotRow = -1;
    let minRatio = Infinity;
    let thetas = [];
    for (let i = 0; i < m; i++) {
      if (tableau[i][pivotCol] > 1e-6) {
        let ratio = tableau[i][totalVars] / tableau[i][pivotCol];
        thetas.push(ratio);
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotRow = i;
        }
      } else {
        thetas.push(null);
      }
    }

    if (pivotRow === -1) {
      showToast("Bài toán không giới hạn (Unbounded)!");
      return;
    }

    stepsHTML += renderTableau(
      tableau,
      m,
      totalVars,
      basis,
      iteration,
      false,
      C_j,
      varNames,
      deltas,
      pivotCol,
      pivotRow,
      thetas,
    );

    basis[pivotRow] = pivotCol;
    let pivotVal = tableau[pivotRow][pivotCol];
    for (let j = 0; j <= totalVars; j++) tableau[pivotRow][j] /= pivotVal;
    for (let i = 0; i < m; i++) {
      if (i !== pivotRow) {
        let factor = tableau[i][pivotCol];
        for (let j = 0; j <= totalVars; j++)
          tableau[i][j] -= factor * tableau[pivotRow][j];
      }
    }
    iteration++;
    if (iteration > 30) {
      showToast("Cảnh báo: Vượt quá 30 lần lặp!");
      break;
    }
  }
  stepsHTML += `</div></div>`;

  // --- KIỂM TRA NGHIỆM VÀ KẾT LUẬN ---
  let finalDeltas = [];
  for (let j = 0; j <= totalVars; j++) {
    let v = 0,
      m_val = 0;
    for (let i = 0; i < m; i++) {
      let cb = C_j[basis[i]];
      v += cb.v * tableau[i][j];
      m_val += cb.m * tableau[i][j];
    }
    if (j < totalVars) {
      v -= C_j[j].v;
      m_val -= C_j[j].m;
    }
    finalDeltas.push({ v: v, m: m_val });
  }

  let hasArtificial = false;
  for (let i = 0; i < m; i++) {
    if (C_j[basis[i]].m !== 0 && tableau[i][totalVars] > 1e-5)
      hasArtificial = true;
  }

  if (hasArtificial) {
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #ef4444;"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#ef4444; color:white; border-color:#ef4444;">Kết luận</div><div><h3 class="modern-title" style="color: #b91c1c;">BÀI TOÁN VÔ NGHIỆM (Infeasible)</h3><p class="modern-subtitle">Biến giả vẫn tồn tại trong phương án tối ưu.</p></div></div><div style="margin-top: 20px;">${renderTableau(tableau, m, totalVars, basis, iteration, true, C_j, varNames, finalDeltas)}</div></div>`;
  } else {
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #10b981; box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.2);"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#10b981; color:white; border-color:#10b981;">Kết luận</div><div><h3 class="modern-title" style="color: #059669;">Bảng Tối Ưu Cuối Cùng</h3><p class="modern-subtitle">Phương án đã thỏa mãn điều kiện tối ưu</p></div></div><div style="margin-top: 20px;">${renderTableau(tableau, m, totalVars, basis, iteration, true, C_j, varNames, finalDeltas)}</div></div>`;
  }

  isSolved = true;
  document.getElementById("nav-2").classList.remove("disabled");
  document.getElementById("nav-3").classList.remove("disabled");
  document.getElementById("steps-container").innerHTML = stepsHTML;

  // --- DASHBOARD KẾT QUẢ CUỐI CÙNG ---
  let optZ = finalDeltas[totalVars];
  let solution = new Array(n).fill(0);
  for (let i = 0; i < m; i++)
    if (basis[i] < n) solution[basis[i]] = tableau[i][totalVars];

  let varCardsHTML = "";
  for (let i = 0; i < n; i++) {
    let val = toFraction(solution[i]);
    // Loại bỏ điều kiện isActive, áp thẳng class 'active-var' cho mọi thẻ để đồng bộ màu xanh
    varCardsHTML += `
            <div class="var-card active-var">
                <div class="var-name">x<sub>${i + 1}</sub></div>
                <div class="var-val">${hasArtificial ? "-" : val}</div>
            </div>
        `;
  }

  let zStr = hasArtificial ? "Vô nghiệm" : formatBigM(optZ);
  let resultHTML = `
        <div class="result-container">
            <div class="result-hero" style="${hasArtificial ? "background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%);" : ""}">
                <h2>${hasArtificial ? "❌ KHÔNG TÌM THẤY PHƯƠNG ÁN KHẢ THI" : "🎉 BÀI TOÁN ĐÃ ĐƯỢC TỐI ƯU"}</h2>
                <div class="result-zopt">Z<sub>opt</sub> = ${zStr}</div>
            </div>
            <div class="result-body">
                <div class="result-section-title">Giá trị các biến quyết định</div>
                <div class="var-grid">${varCardsHTML}</div>
                <div class="result-actions">
                    <button class="btn-modern btn-outline" onclick="showView(2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Xem lại các bước</button>
                    <button class="btn-modern btn-primary" style="${hasArtificial ? "background:#ef4444; border-color:#ef4444;" : ""}" onclick="location.reload()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Giải bài toán mới</button>
                </div>
            </div>
        </div>
    `;
  document.getElementById("view-result").innerHTML = resultHTML;
  showView(2);
}

// ==========================================
// 4. HÀM VẼ BẢNG ĐƠN HÌNH (IN PHÂN SỐ)
// ==========================================
function renderTableau(
  tableau,
  m,
  totalVars,
  basis,
  iter,
  isOptimal,
  C_j,
  varNames,
  deltas,
  pivotCol = -1,
  pivotRow = -1,
  thetas = [],
) {
  let statusHTML = "";
  let title = isOptimal ? `🎉 Bảng Tối Ưu` : `🔄 Lần lặp thứ ${iter}`;

  if (isOptimal) {
    statusHTML = `<div style="display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #059669; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-bottom: 15px; border: 1px solid #a7f3d0;">Kết luận: Đã đạt điều kiện tối ưu (không còn Δ<sub>j</sub> vi phạm).</div>`;
  } else {
    statusHTML = `<div style="display: inline-flex; align-items: center; gap: 6px; background: #fef2f2; color: #dc2626; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-bottom: 15px; border: 1px solid #fecaca;">Kết luận: Chưa tối ưu, cần tiếp tục xoay bảng.</div>`;
  }

  let html = `<div style="margin-bottom: 40px;"><h4 style="color: ${isOptimal ? "#059669" : "#0f172a"}; margin-bottom: 10px;">${title}</h4>${statusHTML}`;

  html += `<div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;"><table class="tableau"><thead>`;
  html += `<tr><th rowspan="2">Bước</th><th rowspan="2">Hệ số C<sub>B</sub></th><th rowspan="2">Cơ sở</th><th rowspan="2">Phương án</th>`;
  for (let j = 0; j < totalVars; j++) html += `<th>${formatBigM(C_j[j])}</th>`;
  html += `</tr><tr>`;
  for (let j = 0; j < totalVars; j++) html += `<th>${varNames[j]}</th>`;
  html += `</tr></thead><tbody>`;

  for (let i = 0; i < m; i++) {
    let cbStr = formatBigM(C_j[basis[i]]);
    let basisName = varNames[basis[i]];
    html += `<tr>`;
    if (i === 0)
      html += `<td rowspan="${m}" style="font-weight:900; color:#3b82f6; font-size: 16px;">${iter}</td>`;

    html += `<td>${cbStr}</td><td><b>${basisName}</b></td>`;
    html += `<td><b>${toFraction(tableau[i][totalVars])}</b></td>`;

    for (let j = 0; j < totalVars; j++) {
      let isPivotCell = j === pivotCol && i === pivotRow && !isOptimal;
      let isPivotColCell = j === pivotCol && !isOptimal;
      let cellClass = isPivotCell
        ? "pivot-element"
        : isPivotColCell
          ? "pivot-col"
          : "";
      let cellValue = toFraction(tableau[i][j]);

      if (isPivotCell)
        html += `<td class="${cellClass}">${cellValue} <span class="pivot-badge">PIVOT</span></td>`;
      else html += `<td class="${cellClass}">${cellValue}</td>`;
    }
    html += `</tr>`;
  }

  html += `<tr class="delta-row"><td colspan="3" style="text-align:right;"><b>Δ<sub>j</sub> = Z<sub>j</sub> - C<sub>j</sub></b></td>`;
  html += `<td><b style="color:#0f172a;">F = ${formatBigM(deltas[totalVars])}</b></td>`;
  for (let j = 0; j < totalVars; j++) {
    let isPivotColCell = j === pivotCol && !isOptimal;
    html += `<td class="${isPivotColCell ? "pivot-col" : ""}">${formatBigM(deltas[j])}</td>`;
  }
  html += `</tr></tbody></table></div>`;

  if (!isOptimal && pivotCol !== -1 && pivotRow !== -1) {
    let minDelta = formatBigM(deltas[pivotCol]);
    let inVar = varNames[pivotCol];
    let outVar = varNames[basis[pivotRow]];
    let pivotVal = toFraction(tableau[pivotRow][pivotCol]);

    let thetaRows = "";
    for (let i = 0; i < m; i++) {
      let calcStr =
        thetas[i] !== null
          ? `${toFraction(tableau[i][totalVars])} / ${toFraction(tableau[i][pivotCol])}`
          : "-";
      let thetaStr = thetas[i] !== null ? toFraction(thetas[i]) : "-";
      let isMinRow = i === pivotRow;

      thetaRows += `<tr class="${isMinRow ? "theta-min-row" : ""}">
                <td><b>${varNames[basis[i]]}</b></td>
                <td>${calcStr}</td>
                <td><div class="theta-val-cell"><span>${thetaStr}</span>${isMinRow ? '<span class="theta-badge-modern">★ CHỌN DÒNG NÀY</span>' : ""}</div></td>
            </tr>`;
    }

    html += `
        <div class="insight-panel">
            <div class="insight-text">Phương án chưa tối ưu vì phát hiện <b>Δ<sub>j</sub></b> vi phạm.<br>Cột <b>${inVar}</b> có giá trị vi phạm lớn nhất là <b style="color:#ef4444;">${minDelta}</b> nên được chọn làm biến vào.</div>
            <div class="decision-flow">
                <div class="flow-node"><span class="flow-label">Hệ số vi phạm</span><span class="flow-value delta">${minDelta}</span></div>
                <svg class="flow-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div class="flow-node"><span class="flow-label">Biến Vào</span><span class="flow-value in" style="font-family: inherit;">${inVar}</span></div>
                <svg class="flow-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div class="flow-node"><span class="flow-label">Biến Ra</span><span class="flow-value out" style="font-family: inherit;">${outVar}</span></div>
                <svg class="flow-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <div class="flow-node"><span class="flow-label">Phần tử xoay</span><span class="flow-value pivot">${pivotVal}</span></div>
            </div>
            <div class="theta-wrapper">
                <table class="theta-grid">
                    <thead><tr><th>Cơ sở</th><th>Phép tính (B / Pivot)</th><th>Giá trị Theta (θ)</th></tr></thead>
                    <tbody>${thetaRows}</tbody>
                </table>
            </div>
        </div>`;
  }
  html += `</div>`;
  return html;
}

// 5. BÀI TOÁN MẪU TEST PHÂN SỐ
function loadSampleProblem() {
  document.getElementById("inp-vars").value = 2;
  document.getElementById("inp-cons").value = 3;
  document.getElementById("inp-type").value = "MAX";
  generateMatrix();
  const objC = document.querySelectorAll(".obj-c");
  if (objC.length >= 2) {
    objC[0].value = 2;
    objC[1].value = -3;
  }

  const aValues = [
    [3, 2],
    [2, -5],
    [1, 3],
  ];
  const opsValues = ["<=", ">=", "<="];
  const bValues = [10, -9, 12];

  for (let i = 1; i <= 3; i++) {
    const consA = document.querySelectorAll(`.cons-a[data-row="${i}"]`);
    if (consA.length >= 2) {
      consA[0].value = aValues[i - 1][0];
      consA[1].value = aValues[i - 1][1];
    }
    const ops = document.querySelectorAll(".operator-select");
    if (ops.length >= i) ops[i - 1].value = opsValues[i - 1];
    const consB = document.querySelectorAll(".cons-b");
    if (consB.length >= i) consB[i - 1].value = bValues[i - 1];
  }
  showToast("Đã tải dữ liệu kiểm tra phân số!");
}
// Khởi chạy chế độ Setup khi vừa vào trang (hoặc khi ấn nút Mới)
window.onload = function () {
  document.getElementById("view-input").classList.add("setup-mode");
};
