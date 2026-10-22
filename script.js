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

// ========================================================
// LÕI TOÁN HỌC PHÂN SỐ TUYỆT ĐỐI (DÙNG BIGINT)
// Xóa bỏ hoàn toàn sai số dấu phẩy động của JavaScript
// ========================================================
class Frac {
  constructor(n, d = 1n) {
    if (typeof n !== "bigint") n = BigInt(n);
    if (typeof d !== "bigint") d = BigInt(d);
    if (d === 0n) throw new Error("Mẫu số không thể bằng 0");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    let g = Frac.gcd(n < 0n ? -n : n, d);
    this.n = n / g;
    this.d = d / g;
  }
  static gcd(a, b) {
    while (b !== 0n) {
      let t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
  static fromString(str) {
    if (str === null || str === undefined) return null;
    str = str.toString().trim().replace(",", ".");
    if (str === "") return null;
    try {
      if (str.includes("/")) {
        let parts = str.split("/");
        if (parts.length !== 2) return null;
        let num = BigInt(parts[0].trim());
        let den = BigInt(parts[1].trim());
        if (den === 0n) return null; // Chặn lỗi chia cho 0 từ đầu vào
        return new Frac(num, den);
      }
      if (str.includes(".")) {
        let sign = 1n;
        if (str.startsWith("-")) {
          sign = -1n;
          str = str.substring(1);
        }
        let parts = str.split(".");
        let intP = parts[0] || "0";
        let decP = parts[1] || "0";
        let numStr = intP + decP;
        return new Frac(sign * BigInt(numStr), 10n ** BigInt(decP.length));
      }
      return new Frac(BigInt(str), 1n);
    } catch (e) {
      return null;
    }
  }
  add(f) {
    return new Frac(this.n * f.d + f.n * this.d, this.d * f.d);
  }
  sub(f) {
    return new Frac(this.n * f.d - f.n * this.d, this.d * f.d);
  }
  mul(f) {
    return new Frac(this.n * f.n, this.d * f.d);
  }
  div(f) {
    if (f.n === 0n) throw new Error("Lỗi chia cho 0");
    return new Frac(this.n * f.d, this.d * f.n);
  }
  cmp(f) {
    let left = this.n * f.d;
    let right = f.n * this.d;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }
  isZero() {
    return this.n === 0n;
  }
  isPositive() {
    return this.n > 0n;
  }
  isNegative() {
    return this.n < 0n;
  }
  abs() {
    return new Frac(this.n < 0n ? -this.n : this.n, this.d);
  }
  toString() {
    return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`;
  }
}

const ZERO = new Frac(0n);
const ONE = new Frac(1n);

class BigM {
  constructor(v, m) {
    this.v = v;
    this.m = m;
  }
  add(b) {
    return new BigM(this.v.add(b.v), this.m.add(b.m));
  }
  sub(b) {
    return new BigM(this.v.sub(b.v), this.m.sub(b.m));
  }
  mul(f) {
    return new BigM(this.v.mul(f), this.m.mul(f));
  }
  cmp(b) {
    let dm = this.m.cmp(b.m);
    if (dm !== 0) return dm;
    return this.v.cmp(b.v);
  }
  isZero() {
    return this.v.isZero() && this.m.isZero();
  }
  isNegative() {
    let c = this.m.cmp(ZERO);
    if (c < 0) return true;
    if (c === 0 && this.v.cmp(ZERO) < 0) return true;
    return false;
  }
  isPositive() {
    let c = this.m.cmp(ZERO);
    if (c > 0) return true;
    if (c === 0 && this.v.cmp(ZERO) > 0) return true;
    return false;
  }
  toString() {
    if (this.m.isZero()) return this.v.toString();
    if (this.v.isZero()) {
      if (this.m.cmp(ONE) === 0) return "M";
      if (this.m.cmp(new Frac(-1n)) === 0) return "-M";
      return this.m.toString() + "M";
    }
    let sign = this.m.isPositive() ? "+" : "-";
    let absM = this.m.isPositive() ? this.m : new Frac(-this.m.n, this.m.d);
    let mStr = absM.cmp(ONE) === 0 ? "M" : absM.toString() + "M";
    return `${this.v.toString()} ${sign} ${mStr}`;
  }
}

const M_ZERO = new BigM(ZERO, ZERO);

function formatEq(coeffs, startIndex = 1) {
  let terms = [];
  for (let i = 0; i < coeffs.length; i++) {
    let c = coeffs[i];
    if (c.isZero()) continue;
    let absC = c.abs();
    let termStr =
      absC.cmp(ONE) === 0
        ? `x<sub>${startIndex + i}</sub>`
        : `${absC.toString()}x<sub>${startIndex + i}</sub>`;
    if (terms.length === 0) {
      terms.push(c.isNegative() ? `-${termStr}` : termStr);
    } else {
      terms.push(c.isNegative() ? `- ${termStr}` : `+ ${termStr}`);
    }
  }
  return terms.length === 0 ? "0" : terms.join(" ");
}

// ==========================================
// TẠO LƯỚI MA TRẬN NHẬP LIỆU
// ==========================================
function generateMatrix() {
  let n_input = document.getElementById("inp-vars").value;
  let m_input = document.getElementById("inp-cons").value;

  if (!n_input || !m_input || n_input <= 0 || m_input <= 0) {
    showToast(
      "Vui lòng nhập đầy đủ Số biến và Số ràng buộc hợp lệ (lớn hơn 0)!",
    );
    return;
  }
  document.getElementById("view-input").classList.remove("setup-mode");

  const n = parseInt(document.getElementById("inp-vars").value);
  const m = parseInt(document.getElementById("inp-cons").value);

  let objTh = "<tr>",
    objTd = "<tr>";
  for (let i = 1; i <= n; i++) {
    objTh += `<th>x${i}</th>`;
    objTd += `<td><input type="text" autocomplete="off" class="cell-input obj-c" placeholder="0" required></td>`;
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
    for (let j = 1; j <= n; j++) {
      row += `<td><input type="text" autocomplete="off" class="cell-input cons-a" data-row="${i}" placeholder="0" required></td>`;
    }
    row += `<td><select class="operator-select" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; cursor: pointer; color: #334155; font-weight: bold;"><option value="<=">&le;</option><option value=">=">&ge;</option><option value="=">=</option></select></td>`;
    row += `<td><input type="text" autocomplete="off" class="cell-input cons-b" placeholder="0" required></td></tr>`;
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
// THUẬT TOÁN ĐƠN HÌNH CHÍNH
// ==========================================
function startSolving() {
  const n = parseInt(document.getElementById("inp-vars").value);
  const m = parseInt(document.getElementById("inp-cons").value);
  const type = document.getElementById("inp-type").value;
  const isMax = type === "MAX";

  // BẪY LỖI: KIỂM TRA NGƯỜI DÙNG CÓ BỎ TRỐNG Ô NHẬP HOẶC NHẬP SAI KHÔNG
  let inputs = document.querySelectorAll(".cell-input");
  for (let inp of inputs) {
    if (Frac.fromString(inp.value) === null) {
      showToast(
        "Dữ liệu không hợp lệ! Vui lòng không để trống hệ số, hoặc nhập sai định dạng phân số (chia cho 0).",
      );
      inp.style.border = "2px solid #ef4444";
      setTimeout(() => (inp.style.border = "1px solid #cbd5e1"), 3000);
      return;
    }
  }

  let C_input = Array.from(document.querySelectorAll(".obj-c")).map((inp) =>
    Frac.fromString(inp.value),
  );
  let A_input = [],
    B_input = [],
    Ops = [];
  for (let i = 1; i <= m; i++) {
    A_input.push(
      Array.from(document.querySelectorAll(`.cons-a[data-row="${i}"]`)).map(
        (inp) => Frac.fromString(inp.value),
      ),
    );
    Ops.push(document.querySelectorAll(".operator-select")[i - 1].value);
    B_input.push(
      Frac.fromString(document.querySelectorAll(".cons-b")[i - 1].value),
    );
  }

  window.lastLP = {
    C: C_input.map(toNum),
    A: A_input.map((r) => r.map(toNum)),
    B: B_input.map(toNum),
    Ops: [...Ops],
  };
  let stepsHTML = "";
  let origObj = `<span class="modern-highlight">${type} F(x) =</span> ${formatEq(C_input)}`;
  let origCons = A_input.map(
    (row, i) =>
      `${formatEq(row)} ${Ops[i].replace("<=", "&le;").replace(">=", "&ge;")} ${B_input[i].toString()}`,
  ).join("<br>");
  let origCond =
    Array.from({ length: n }, (_, i) => `x<sub>${i + 1}</sub>`).join(", ") +
    " &ge; 0";

  stepsHTML += `<div class="modern-step-card"><div class="modern-step-header"><div class="modern-badge">Bước 1</div><div><h3 class="modern-title">Bài toán ban đầu</h3><p class="modern-subtitle">Giữ nguyên đúng mô hình bạn đã nhập</p></div></div><div class="modern-math-box" style="font-size:20px;">${origObj}<br><br>${origCons}<br><br><span style="color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: block;">Điều kiện: ${origCond}</span></div></div>`;

  // XỬ LÝ LẬT DẤU (b < 0)
  let flippedRows = new Array(m).fill(false);
  for (let i = 0; i < m; i++) {
    if (B_input[i].isNegative()) {
      B_input[i] = new Frac(-B_input[i].n, B_input[i].d);
      for (let j = 0; j < n; j++)
        A_input[i][j] = new Frac(-A_input[i][j].n, A_input[i][j].d);
      if (Ops[i] === "<=") Ops[i] = ">=";
      else if (Ops[i] === ">=") Ops[i] = "<=";
      flippedRows[i] = true;
    }
  }

  // TÌM CỘT ĐƠN VỊ CÓ SẴN (TRÁNH PHẠT BIG-M THỪA)
  let existingUnitCols = new Array(m).fill(-1);
  for (let j = 0; j < n; j++) {
    let oneRow = -1;
    let isUnit = true;
    for (let i = 0; i < m; i++) {
      let val = A_input[i][j];
      if (val.cmp(ONE) === 0) {
        if (oneRow === -1) oneRow = i;
        else {
          isUnit = false;
          break;
        }
      } else if (!val.isZero()) {
        isUnit = false;
        break;
      }
    }
    if (isUnit && oneRow !== -1 && existingUnitCols[oneRow] === -1)
      existingUnitCols[oneRow] = j;
  }

  // THIẾT LẬP CÁC BIẾN MỚI
  let varNames = [];
  let C_j = [];
  for (let j = 0; j < n; j++) {
    varNames.push(`x<sub>${j + 1}</sub>`);
    C_j.push(new BigM(C_input[j], ZERO));
  }

  let constraintsData = [];
  let basis = new Array(m).fill(-1);
  let mFactor = isMax ? new Frac(-1n) : ONE;

  for (let i = 0; i < m; i++) {
    let op = Ops[i];
    if (op === "<=") {
      varNames.push(`x<sub>${varNames.length + 1}</sub>`);
      C_j.push(M_ZERO);
      let slackIdx = varNames.length - 1;
      basis[i] = slackIdx;
      constraintsData.push({ type: "<=", slackIdx: slackIdx });
    } else if (op === ">=") {
      varNames.push(`x<sub>${varNames.length + 1}</sub>`);
      C_j.push(M_ZERO);
      let surplusIdx = varNames.length - 1;
      if (existingUnitCols[i] !== -1) {
        basis[i] = existingUnitCols[i];
        constraintsData.push({
          type: ">=",
          surplusIdx: surplusIdx,
          alreadyUnitIdx: existingUnitCols[i],
        });
      } else {
        varNames.push(`x<sub>${varNames.length + 1}</sub>`);
        C_j.push(new BigM(ZERO, mFactor));
        let artIdx = varNames.length - 1;
        basis[i] = artIdx;
        constraintsData.push({
          type: ">=",
          surplusIdx: surplusIdx,
          artIdx: artIdx,
        });
      }
    } else {
      if (existingUnitCols[i] !== -1) {
        basis[i] = existingUnitCols[i];
        constraintsData.push({
          type: "=",
          alreadyUnitIdx: existingUnitCols[i],
        });
      } else {
        varNames.push(`x<sub>${varNames.length + 1}</sub>`);
        C_j.push(new BigM(ZERO, mFactor));
        let artIdx = varNames.length - 1;
        basis[i] = artIdx;
        constraintsData.push({ type: "=", artIdx: artIdx });
      }
    }
  }

  let totalVars = varNames.length;
  let tableau = [];
  for (let i = 0; i < m; i++) {
    let row = new Array(totalVars + 1).fill(ZERO);
    for (let j = 0; j < n; j++) row[j] = A_input[i][j];
    let info = constraintsData[i];
    if (info.type === "<=") row[info.slackIdx] = ONE;
    else if (info.type === ">=") {
      row[info.surplusIdx] = new Frac(-1n);
      if (info.artIdx !== undefined) row[info.artIdx] = ONE;
    } else if (info.type === "=") {
      if (info.artIdx !== undefined) row[info.artIdx] = ONE;
    }
    row[totalVars] = B_input[i];
    tableau.push(row);
  }

  let stdObjStr = C_j.map((cj, idx) => {
    let str = cj.toString();
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
      rowStr += ` <span style="color: #0284c7; font-weight: bold;">+ 1${varNames[info.slackIdx]}</span> = ${B_input[i].toString()}`;
      varsMsg = `${varNames[info.slackIdx]}: biến phụ (Slack)`;
    } else if (info.type === ">=") {
      rowStr += ` <span style="color: #ea580c; font-weight: bold;">- 1${varNames[info.surplusIdx]}</span>`;
      if (info.artIdx !== undefined) {
        rowStr += ` <span style="color: #16a34a; font-weight: bold;">+ 1${varNames[info.artIdx]}</span>`;
        varsMsg = `${varNames[info.surplusIdx]}: biến dư (Surplus)<br>${varNames[info.artIdx]}: biến giả (Artificial)`;
      } else {
        varsMsg = `${varNames[info.surplusIdx]}: biến dư (Đã có sẵn biến cơ sở ${varNames[info.alreadyUnitIdx]})`;
      }
      rowStr += ` = ${B_input[i].toString()}`;
    } else {
      if (info.artIdx !== undefined) {
        rowStr += ` <span style="color: #16a34a; font-weight: bold;">+ 1${varNames[info.artIdx]}</span> = ${B_input[i].toString()}`;
        varsMsg = `${varNames[info.artIdx]}: biến giả (Artificial)`;
      } else {
        rowStr += ` = ${B_input[i].toString()}`;
        varsMsg = `Đã có sẵn biến cơ sở ${varNames[info.alreadyUnitIdx]} (Không cần thêm biến giả)`;
      }
    }
    stdConsHTML += `${rowStr}<br>`;
    slackTags += `<div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);"><div style="font-weight: 700; color: #1e293b; margin-bottom: 6px;">Ràng buộc ${i + 1}</div>${flipMsg}<div style="color: #64748b; font-size: 14px; line-height: 1.6;">${varsMsg}</div></div>`;
  }

  let matrixA_HTML = `<div style="margin-top: 24px; padding-top: 24px; border-top: 1px dashed #cbd5e1;"><div style="margin-bottom: 16px;"><div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Ma trận hệ số A</div><div style="font-size: 14px; color: #64748b;">Hệ thống tự động trích xuất <span style="color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">Ma trận đơn vị (đường chéo số 1)</span> để cấu thành Phương án xuất phát.</div></div><div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);"><table style="width: 100%; border-collapse: collapse; text-align: center; font-family: 'Courier New', Courier, monospace; font-size: 16px; background: white;"><thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;"><tr>`;
  for (let j = 0; j < totalVars; j++) {
    let isBasis = basis.includes(j);
    matrixA_HTML += `<th style="padding: 12px 10px; color: ${isBasis ? "#059669" : "#64748b"}; font-weight: ${isBasis ? "900" : "600"}; border-right: 1px solid #f1f5f9;">${varNames[j]}</th>`;
  }
  matrixA_HTML += `</tr></thead><tbody>`;
  for (let i = 0; i < m; i++) {
    matrixA_HTML += `<tr style="border-bottom: 1px solid #f1f5f9;">`;
    for (let j = 0; j < totalVars; j++) {
      let isBasis = basis.includes(j);
      let isDiagonal = basis[i] === j;
      let val = tableau[i][j];
      let cellStyle = `padding: 14px 10px; border-right: 1px solid #f1f5f9; `;
      if (isBasis) {
        if (isDiagonal)
          cellStyle += `background: #ecfdf5; color: #059669; font-weight: 900; font-size: 18px; text-shadow: 0 0 1px rgba(5,150,105,0.5);`;
        else
          cellStyle += `background: #f0fdf4; color: #a7f3d0; font-weight: 400;`;
      } else cellStyle += `color: #475569;`;
      matrixA_HTML += `<td style="${cellStyle}">${val.toString()}</td>`;
    }
    matrixA_HTML += `</tr>`;
  }
  matrixA_HTML += `</tbody></table></div></div>`;

  stepsHTML += `<div class="modern-step-card" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 30px;"><div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px;"><div style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">BƯỚC 2</div><div><h3 style="margin: 0 0 4px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Đưa về dạng chuẩn & Trích xuất</h3><p style="margin: 0; font-size: 14px; color: #64748b;">Chuẩn hóa vế phải, bổ sung biến và trích xuất Ma trận A</p></div></div><div class="modern-grid-2" style="padding: 24px;"><div style="display: flex; flex-direction: column;"><div class="modern-math-box" style="font-size:20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 0; height: 100%;">${stdObj}<br><br>${stdConsHTML}<br><span style="color: #94a3b8; font-style: italic; font-size: 15px;">Tất cả biến &ge; 0</span></div></div><div class="modern-info-panel" style="background: transparent; border: none; box-shadow: none; padding: 0;">${slackTags}</div></div><div style="padding: 0 24px 24px 24px;">${matrixA_HTML}</div></div>`;

  let x0 = new Array(totalVars).fill(ZERO);
  for (let i = 0; i < m; i++) x0[basis[i]] = B_input[i];
  let x0Str = `X<sup>0</sup> = ( <span style="color: #059669;">${x0.map((v) => v.toString()).join('</span>, <span style="color: #059669;">')}</span> )`;
  let basisBadges = "";
  for (let i = 0; i < m; i++)
    basisBadges += `<div style="display: flex; align-items: center; gap: 8px; background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"><span style="color: #7dd3fc; font-size: 13px;">Dòng ${i + 1}</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> <span style="font-size: 16px; font-weight: 700;">${varNames[basis[i]]}</span></div>`;

  stepsHTML += `<div class="modern-step-card" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 30px;"><div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px;"><div style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 14px;">BƯỚC 3</div><div><h3 style="margin: 0 0 4px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Phương án cực biên xuất phát</h3><p style="margin: 0; font-size: 14px; color: #64748b;">Khởi tạo ma trận cơ sở ban đầu trước khi đưa vào bảng Đơn hình</p></div></div><div style="padding: 24px;"><div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center;">${basisBadges}</div><div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;"><div style="font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">Vector Phương Án Đầu Tiên</div><div style="font-family: 'Courier New', Courier, monospace; font-size: 22px; color: #0f172a; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">${x0Str}</div></div><div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; font-size: 14px; font-weight: 600;"><div style="display: flex; align-items: center; gap: 8px; color: #64748b;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Hoàn tất chuẩn hóa</div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg><div style="display: flex; align-items: center; gap: 8px; color: #0ea5e9;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> Trích xuất ma trận</div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg><div style="display: flex; align-items: center; gap: 8px; color: #64748b;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Sẵn sàng tối ưu</div></div></div></div>`;

  stepsHTML += `<div class="modern-step-card"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background: #0f172a; color: white; border-color: #0f172a;">Bước 4</div><div><h3 class="modern-title">Quá trình lặp Đơn Hình</h3><p class="modern-subtitle">Quy tắc Bland chống lặp vòng và Tính toán siêu phân số BigInt</p></div></div><div id="simplex-tables-container" style="margin-top: 20px;">`;

  let iteration = 1;
  let status = "OPTIMAL"; // Có thể là: OPTIMAL, UNBOUNDED, INFEASIBLE, ITER_LIMIT
  let unboundedCol = -1;
  let finalDeltas = [];

  while (true) {
    let deltas = [];
    for (let j = 0; j <= totalVars; j++) {
      let z = M_ZERO;
      for (let i = 0; i < m; i++) {
        z = z.add(C_j[basis[i]].mul(tableau[i][j]));
      }
      if (j < totalVars) z = z.sub(C_j[j]);
      deltas.push(z);
    }
    finalDeltas = deltas;

    const violates = (d) => (isMax ? d.isNegative() : d.isPositive());
    const violatesM = (d) => (isMax ? d.m.isNegative() : d.m.isPositive());
    let pivotCol = -1;
    for (let j = 0; j < totalVars; j++)
      if (violatesM(deltas[j])) {
        pivotCol = j;
        break;
      }
    if (pivotCol === -1) {
      let artPos = false;
      for (let i = 0; i < m; i++)
        if (!C_j[basis[i]].m.isZero() && tableau[i][totalVars].isPositive())
          artPos = true;
      if (artPos) {
        status = "OPTIMAL";
        break;
      }
      for (let j = 0; j < totalVars; j++)
        if (violates(deltas[j])) {
          pivotCol = j;
          break;
        }
    }
    if (pivotCol === -1) {
      status = "OPTIMAL";
      break;
    }

    // QUY TẮC BLAND: Chọn dòng ra dựa trên minRatio. Nếu hòa, chọn dòng có chỉ số biến cơ sở (basis[i]) nhỏ nhất.
    let pivotRow = -1;
    let minRatio = null;
    let thetas = [];
    for (let i = 0; i < m; i++) {
      if (tableau[i][pivotCol].isPositive()) {
        let ratio = tableau[i][totalVars].div(tableau[i][pivotCol]);
        thetas.push(ratio);
        if (minRatio === null) {
          minRatio = ratio;
          pivotRow = i;
        } else {
          let cmp = ratio.cmp(minRatio);
          if (cmp < 0) {
            minRatio = ratio;
            pivotRow = i;
          } else if (cmp === 0) {
            if (basis[i] < basis[pivotRow]) pivotRow = i;
          }
        }
      } else {
        thetas.push(null);
      }
    }

    if (pivotRow === -1) {
      status = "UNBOUNDED";
      unboundedCol = pivotCol;
      break;
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

    // CẬP NHẬT BIẾN CƠ SỞ SAU KHI TÌM ĐƯỢC PHẦN TỬ XOAY
    basis[pivotRow] = pivotCol;

    let pivotVal = tableau[pivotRow][pivotCol];
    for (let j = 0; j <= totalVars; j++)
      tableau[pivotRow][j] = tableau[pivotRow][j].div(pivotVal);
    for (let i = 0; i < m; i++) {
      if (i !== pivotRow) {
        let factor = tableau[i][pivotCol];
        for (let j = 0; j <= totalVars; j++)
          tableau[i][j] = tableau[i][j].sub(factor.mul(tableau[pivotRow][j]));
      }
    }

    iteration++;
    if (iteration > 1000) {
      status = "ITER_LIMIT";
      break;
    }
  }

  // PHÂN BIỆT RÕ CÁC TRẠNG THÁI CUỐI CÙNG
  let hasArtificial = false;
  let artVarsInBasis = [];
  if (status === "OPTIMAL") {
    for (let i = 0; i < m; i++) {
      if (!C_j[basis[i]].m.isZero() && tableau[i][totalVars].isPositive()) {
        hasArtificial = true;
        artVarsInBasis.push(
          `<b>${varNames[basis[i]]}</b> = ${tableau[i][totalVars].toString()}`,
        );
      }
    }
    if (hasArtificial) status = "INFEASIBLE";
  }

  // NHẬN DIỆN VÔ SỐ NGHIỆM
  let hasInfinite = false;
  let infiniteVars = [];
  if (status === "OPTIMAL") {
    for (let j = 0; j < totalVars; j++) {
      if (basis.includes(j) || !finalDeltas[j].isZero() || !C_j[j].m.isZero())
        continue;
      let hasPos = false,
        minRatio = null;
      for (let i = 0; i < m; i++) {
        if (tableau[i][j].isPositive()) {
          hasPos = true;
          let r = tableau[i][totalVars].div(tableau[i][j]);
          if (minRatio === null || r.cmp(minRatio) < 0) minRatio = r;
        }
      }
      if (!hasPos || minRatio.isPositive()) {
        hasInfinite = true;
        infiniteVars.push(varNames[j]);
      }
    }
  }

  // RENDER GIAO DIỆN KẾT LUẬN
  if (status === "ITER_LIMIT") {
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #64748b; box-shadow: 0 10px 40px -10px rgba(100, 116, 139, 0.2);"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#64748b; color:white; border-color:#64748b;">Lỗi hệ thống</div><div><h3 class="modern-title" style="color: #334155;">VƯỢT QUÁ SỐ LẦN LẶP (Iteration Limit)</h3><p class="modern-subtitle">Hệ thống đã tự động dừng sau 1000 vòng lặp.</p></div></div><div style="margin-top: 20px; padding: 20px; background: #f1f5f9; border-radius: 8px; border: 1px dashed #cbd5e1; color: #334155; font-size: 15px; line-height: 1.6;">Bài toán quá phức tạp hoặc cấu trúc gây lặp vòng không thể giải quyết trong số bước cho phép. Kết quả bảng dưới đây <b>không phải là phương án tối ưu cuối cùng</b>.</div>${renderTableau(tableau, m, totalVars, basis, iteration, false, C_j, varNames, finalDeltas)}</div>`;
  } else if (status === "UNBOUNDED") {
    let inVar = varNames[unboundedCol];
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #8b5cf6; box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.2);"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#8b5cf6; color:white; border-color:#8b5cf6;">Kết luận</div><div><h3 class="modern-title" style="color: #6d28d9;">BÀI TOÁN KHÔNG GIỚI HẠN (Unbounded)</h3><p class="modern-subtitle">Không tồn tại phương án tối ưu hữu hạn.</p></div></div><div style="margin-top: 20px; padding: 20px; background: #f5f3ff; border-radius: 8px; border: 1px dashed #c4b5fd; color: #4c1d95; font-size: 15px; line-height: 1.6;"><b>Nguyên nhân Toán học:</b> Cột biến vào <b>${inVar}</b> được chọn, nhưng tất cả các hệ số trong cột này đều <b>&le; 0</b>, dẫn đến không thể tính được giá trị Theta (θ).<br><br><b>Ý nghĩa thực tế:</b> Hàm mục tiêu sẽ tiến tới <b>vô cực (±&infin;)</b> mà không bị cản lại bởi bất kỳ ràng buộc nào.</div>${renderTableau(tableau, m, totalVars, basis, iteration, false, C_j, varNames, finalDeltas, -1, -1, [], { title: "📋 Bảng tại thời điểm phát hiện (bằng chứng)", titleColor: "#6d28d9", statusHTML: `<div style="background:#f5f3ff;color:#6d28d9;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:bold;margin-bottom:15px;border:1px solid #c4b5fd;display:inline-block;">Cột ${inVar} có Δ vi phạm nhưng mọi phần tử đều ≤ 0 nên không tính được θ.</div>` })}</div>`;
  } else if (status === "INFEASIBLE") {
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #ef4444; box-shadow: 0 10px 40px -10px rgba(239, 68, 68, 0.2);"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#ef4444; color:white; border-color:#ef4444;">Kết luận</div><div><h3 class="modern-title" style="color: #b91c1c;">BÀI TOÁN VÔ NGHIỆM (Infeasible)</h3><p class="modern-subtitle">Hệ ràng buộc mâu thuẫn, không tồn tại phương án khả thi.</p></div></div><div style="margin-top: 20px; padding: 20px; background: #fef2f2; border-radius: 8px; border: 1px dashed #fca5a5; color: #991b1b; font-size: 15px; line-height: 1.6;">Biến giả vẫn tồn tại trong cơ sở với giá trị dương (${artVarsInBasis.join(", ")}). Điều này chứng tỏ hệ ràng buộc đang mâu thuẫn trực tiếp với nhau, không có vùng nghiệm chung.</div>${renderTableau(
      tableau,
      m,
      totalVars,
      basis,
      iteration,
      false,
      C_j,
      varNames,
      finalDeltas,
      -1,
      -1,
      [],
      {
        title: "📋 Bảng đơn hình cuối cùng (bằng chứng)",
        titleColor: "#b91c1c",
        statusHTML: `<div style="display: inline-flex; align-items: center; gap: 6px; background: #fef2f2; color: #dc2626; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-bottom: 15px; border: 1px solid #fecaca;">Kết luận: Không tồn tại phương án khả thi (biến giả còn dương trong cơ sở).</div>`,
      },
    )}</div>`;
  } else if (hasInfinite) {
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #f59e0b; box-shadow: 0 10px 40px -10px rgba(245, 158, 11, 0.2);"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#f59e0b; color:white; border-color:#f59e0b;">Kết luận</div><div><h3 class="modern-title" style="color: #d97706;">VÔ SỐ NGHIỆM TỐI ƯU</h3><p class="modern-subtitle">Phát hiện biến không cơ sở <b>${infiniteVars.join(", ")}</b> có Δ<sub>j</sub> = 0.</p></div></div><div style="margin-top: 20px;">${renderTableau(tableau, m, totalVars, basis, iteration, true, C_j, varNames, finalDeltas)}</div></div>`;
  } else {
    stepsHTML += `<div class="modern-step-card" style="border: 2px solid #10b981; box-shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.2);"><div class="modern-step-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;"><div class="modern-badge" style="background:#10b981; color:white; border-color:#10b981;">Kết luận</div><div><h3 class="modern-title" style="color: #059669;">Bảng Tối Ưu Cuối Cùng (Nghiệm duy nhất)</h3><p class="modern-subtitle">Phương án đã thỏa mãn điều kiện tối ưu</p></div></div><div style="margin-top: 20px;">${renderTableau(tableau, m, totalVars, basis, iteration, true, C_j, varNames, finalDeltas)}</div></div>`;
  }

  stepsHTML += `</div></div>`;
  isSolved = true;
  document.getElementById("nav-2").classList.remove("disabled");
  document.getElementById("nav-3").classList.remove("disabled");
  document.getElementById("steps-container").innerHTML = stepsHTML;

  // DASHBOARD
  let solution = new Array(n).fill(ZERO);
  for (let i = 0; i < m; i++)
    if (basis[i] < n) solution[basis[i]] = tableau[i][totalVars];

  let varCardsHTML = "";
  if (
    status === "UNBOUNDED" ||
    status === "INFEASIBLE" ||
    status === "ITER_LIMIT"
  ) {
    varCardsHTML = `<div style="padding: 20px; text-align: center; color: #64748b; width: 100%; font-style: italic; background: #f8fafc; border-radius: 8px;">Không thể xác định giá trị cụ thể các biến do trạng thái bài toán: <b>${status}</b>.</div>`;
  } else {
    for (let i = 0; i < n; i++) {
      varCardsHTML += `<div class="var-card active-var" ${hasInfinite ? 'style="border-color:#fcd34d; background:#fffbeb;"' : ""}><div class="var-name" ${hasInfinite ? 'style="color:#d97706;"' : ""}>x<sub>${i + 1}</sub></div><div class="var-val" ${hasInfinite ? 'style="color:#b45309;"' : ""}>${solution[i].toString()}</div></div>`;
    }
  }

  let zStr =
    status === "UNBOUNDED"
      ? isMax
        ? "+&infin;"
        : "-&infin;"
      : status === "INFEASIBLE"
        ? "Vô nghiệm"
        : status === "ITER_LIMIT"
          ? "Lỗi lặp"
          : finalDeltas[totalVars].toString();

  let heroBg =
    status === "UNBOUNDED"
      ? "background: linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%);"
      : status === "INFEASIBLE"
        ? "background: linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%);"
        : status === "ITER_LIMIT"
          ? "background: linear-gradient(135deg, #334155 0%, #64748b 100%);"
          : hasInfinite
            ? "background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%);"
            : "";

  let heroTitle =
    status === "UNBOUNDED"
      ? "⚠️ BÀI TOÁN KHÔNG GIỚI HẠN (UNBOUNDED)"
      : status === "INFEASIBLE"
        ? "❌ BÀI TOÁN VÔ NGHIỆM (INFEASIBLE)"
        : status === "ITER_LIMIT"
          ? "⚙️ VƯỢT QUÁ SỐ LẦN LẶP (DỪNG KHẨN CẤP)"
          : hasInfinite
            ? "✨ BÀI TOÁN CÓ VÔ SỐ NGHIỆM TỐI ƯU"
            : "🎉 BÀI TOÁN ĐÃ ĐƯỢC TỐI ƯU (NGHIỆM DUY NHẤT)";

  window.lastResultText =
    status === "OPTIMAL"
      ? `${type}: Z_opt = ${zStr}; ` +
        solution.map((v, i) => `x${i + 1} = ${v}`).join(", ")
      : heroTitle;
  let graphHTML =
    n === 2 && status === "OPTIMAL" ? renderGraph(window.lastLP, solution) : "";
  let extraNote =
    status === "UNBOUNDED"
      ? `<div style="font-size:15px; color:#fff; margin-top:8px; opacity:0.9;">Khu vực nghiệm mở rộng tới vô cực, hàm mục tiêu không có đỉnh dừng.</div>`
      : hasInfinite
        ? `<div style="font-size:15px; color:#fff; margin-top:8px; opacity:0.9;">(Phương án hiển thị bên dưới chỉ là một trong các điểm cực biên)</div>`
        : "";

  let btnColor =
    status === "UNBOUNDED"
      ? "background:#8b5cf6; border-color:#8b5cf6;"
      : status === "INFEASIBLE"
        ? "background:#ef4444; border-color:#ef4444;"
        : status === "ITER_LIMIT"
          ? "background:#64748b; border-color:#64748b;"
          : hasInfinite
            ? "background:#f59e0b; border-color:#f59e0b;"
            : "";

  let resultHTML = `<div class="result-container"><div class="result-hero" style="${heroBg}"><h2>${heroTitle}</h2><div class="result-zopt">Z<sub>opt</sub> = ${zStr}</div>${extraNote}</div><div class="result-body"><div class="result-section-title">${hasInfinite ? "Một phương án cực biên tối ưu" : "Giá trị các biến quyết định"}</div><div class="var-grid">${varCardsHTML}</div>${graphHTML}<div class="result-actions"><button class="btn-modern btn-outline" onclick="showView(2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Xem lại các bước</button><button class="btn-modern btn-outline" onclick="window.print()">🖨 In / Lưu PDF</button><button class="btn-modern btn-outline" onclick="copyResult()">📋 Sao chép</button><button class="btn-modern btn-primary" style="${btnColor}" onclick="location.reload()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Giải bài toán mới</button></div></div></div>`;

  document.getElementById("view-result").innerHTML = resultHTML;
  showView(2);
}

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
  opts = {},
) {
  let statusHTML = "";
  let title =
    opts.title ?? (isOptimal ? `🎉 Bảng Tối Ưu` : `🔄 Lần lặp thứ ${iter}`);

  if (opts.statusHTML !== undefined) statusHTML = opts.statusHTML;
  else if (isOptimal)
    statusHTML = `<div style="display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #059669; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-bottom: 15px; border: 1px solid #a7f3d0;">Kết luận: Đã đạt điều kiện tối ưu (không còn Δ<sub>j</sub> vi phạm).</div>`;
  else if (pivotCol === -1 && pivotRow === -1 && !isOptimal)
    statusHTML = `<div style="display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; color: #334155; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-bottom: 15px; border: 1px solid #cbd5e1;">Kết luận: Thuật toán đã dừng.</div>`;
  else
    statusHTML = `<div style="display: inline-flex; align-items: center; gap: 6px; background: #fef2f2; color: #dc2626; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; margin-bottom: 15px; border: 1px solid #fecaca;">Kết luận: Chưa tối ưu, cần tiếp tục xoay bảng.</div>`;

  let html = `<div style="margin-bottom: 40px;"><h4 style="color: ${opts.titleColor ?? (isOptimal ? "#059669" : "#0f172a")}; margin-bottom: 10px;">${title}</h4>${statusHTML}<div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;"><table class="tableau"><thead><tr><th rowspan="2">Bước</th><th rowspan="2">Hệ số C<sub>B</sub></th><th rowspan="2">Cơ sở</th><th rowspan="2">Phương án</th>`;
  for (let j = 0; j < totalVars; j++) html += `<th>${C_j[j].toString()}</th>`;
  html += `</tr><tr>`;
  for (let j = 0; j < totalVars; j++) html += `<th>${varNames[j]}</th>`;
  html += `</tr></thead><tbody>`;

  for (let i = 0; i < m; i++) {
    html += `<tr>`;
    if (i === 0)
      html += `<td rowspan="${m}" style="font-weight:900; color:#3b82f6; font-size: 16px;">${iter}</td>`;
    html += `<td>${C_j[basis[i]].toString()}</td><td><b>${varNames[basis[i]]}</b></td><td><b>${tableau[i][totalVars].toString()}</b></td>`;

    for (let j = 0; j < totalVars; j++) {
      let isPivotCell = j === pivotCol && i === pivotRow;
      let isPivotColCell = j === pivotCol && pivotRow !== -1;
      let cellClass = isPivotCell
        ? "pivot-element"
        : isPivotColCell
          ? "pivot-col"
          : "";
      html += `<td class="${cellClass}">${tableau[i][j].toString()} ${isPivotCell ? '<span class="pivot-badge">PIVOT</span>' : ""}</td>`;
    }
    html += `</tr>`;
  }

  html += `<tr class="delta-row"><td colspan="3" style="text-align:right;"><b>Δ<sub>j</sub> = Z<sub>j</sub> - C<sub>j</sub></b></td><td><b style="color:#0f172a;">F = ${deltas[totalVars].toString()}</b></td>`;
  for (let j = 0; j < totalVars; j++) {
    html += `<td class="${j === pivotCol && pivotRow !== -1 ? "pivot-col" : ""}">${deltas[j].toString()}</td>`;
  }
  html += `</tr></tbody></table></div>`;

  if (pivotCol !== -1 && pivotRow !== -1) {
    let thetaRows = "";
    for (let i = 0; i < m; i++) {
      let isMinRow = i === pivotRow;
      let thetaStr = thetas[i] !== null ? thetas[i].toString() : "-";
      let calcStr =
        thetas[i] !== null
          ? `${tableau[i][totalVars].toString()} / ${tableau[i][pivotCol].toString()}`
          : "-";
      thetaRows += `<tr class="${isMinRow ? "theta-min-row" : ""}"><td><b>${varNames[basis[i]]}</b></td><td>${calcStr}</td><td><div class="theta-val-cell"><span>${thetaStr}</span>${isMinRow ? '<span class="theta-badge-modern">★ CHỌN DÒNG NÀY</span>' : ""}</div></td></tr>`;
    }
    html += `<div class="insight-panel"><div class="insight-text">Phương án chưa tối ưu vì phát hiện <b>Δ<sub>j</sub></b> vi phạm. Theo Quy tắc Bland, cột <b>${varNames[pivotCol]}</b> được chọn làm biến vào và dòng <b>${varNames[basis[pivotRow]]}</b> làm biến ra.</div><div class="decision-flow"><div class="flow-node"><span class="flow-label">Hệ số vi phạm</span><span class="flow-value delta">${deltas[pivotCol].toString()}</span></div><svg class="flow-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg><div class="flow-node"><span class="flow-label">Biến Vào</span><span class="flow-value in" style="font-family: inherit;">${varNames[pivotCol]}</span></div><svg class="flow-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg><div class="flow-node"><span class="flow-label">Biến Ra</span><span class="flow-value out" style="font-family: inherit;">${varNames[basis[pivotRow]]}</span></div><svg class="flow-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg><div class="flow-node"><span class="flow-label">Phần tử xoay</span><span class="flow-value pivot">${tableau[pivotRow][pivotCol].toString()}</span></div></div><div class="theta-wrapper"><table class="theta-grid"><thead><tr><th>Cơ sở</th><th>Phép tính (B / Pivot)</th><th>Giá trị Theta (θ)</th></tr></thead><tbody>${thetaRows}</tbody></table></div></div>`;
  }
  return html;
}

function loadSampleProblem() {
  document.getElementById("inp-vars").value = 2;
  document.getElementById("inp-cons").value = 3;
  document.getElementById("inp-type").value = "MAX";
  generateMatrix();
  const objC = document.querySelectorAll(".obj-c");
  if (objC.length >= 2) {
    objC[0].value = "3/2";
    objC[1].value = "-5/2";
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

window.onload = function () {
  document.getElementById("view-input").classList.add("setup-mode");
};

// ========================================================
// TÍNH NĂNG MỚI: PHƯƠNG PHÁP ĐỒ THỊ (n = 2) + SAO CHÉP KẾT QUẢ
// ========================================================
function toNum(f) {
  return Number(f.n) / Number(f.d);
}

function copyResult() {
  navigator.clipboard
    .writeText(window.lastResultText || "")
    .then(() => showToast("Đã sao chép kết quả!"));
}

function clipPoly(poly, a1, a2, c, s) {
  const val = (p) => s * (a1 * p[0] + a2 * p[1] - c);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i],
      Q = poly[(i + 1) % poly.length];
    const vp = val(P),
      vq = val(Q);
    if (vp <= 1e-9) out.push(P);
    if ((vp < -1e-9 && vq > 1e-9) || (vp > 1e-9 && vq < -1e-9)) {
      const t = vp / (vp - vq);
      out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
    }
  }
  return out;
}

function lineEnds(a1, a2, c, L) {
  const pts = [],
    ok = (v) => v >= -1e-9 && v <= L + 1e-9;
  if (a2 !== 0)
    for (const x of [0, L]) {
      const y = (c - a1 * x) / a2;
      if (ok(y)) pts.push([x, y]);
    }
  if (a1 !== 0)
    for (const y of [0, L]) {
      const x = (c - a2 * y) / a1;
      if (ok(x)) pts.push([x, y]);
    }
  if (pts.length < 2) return null;
  const d = (q) => Math.hypot(q[0] - pts[0][0], q[1] - pts[0][1]);
  return [pts[0], pts.reduce((b, q) => (d(q) > d(b) ? q : b))];
}

function renderGraph(lp, sol) {
  const [sx, sy] = [toNum(sol[0]), toNum(sol[1])];
  let ref = [sx, sy, 1];
  lp.A.forEach((r, i) =>
    r.forEach((a, j) => {
      if (a !== 0 && lp.B[i] / a > 0) ref.push(lp.B[i] / a);
    }),
  );
  const L = Math.max(...ref) * 1.25;
  let poly = [
    [0, 0],
    [L, 0],
    [L, L],
    [0, L],
  ];
  lp.A.forEach((r, i) => {
    if (lp.Ops[i] !== ">=") poly = clipPoly(poly, r[0], r[1], lp.B[i], 1);
    if (lp.Ops[i] !== "<=") poly = clipPoly(poly, r[0], r[1], lp.B[i], -1);
  });
  const W = 560,
    H = 400,
    pad = 46;
  const X = (x) => pad + (x / L) * (W - pad - 16),
    Y = (y) => H - pad - (y / L) * (H - pad - 16);
  const colors = [
    "#2563eb",
    "#d97706",
    "#7c3aed",
    "#db2777",
    "#0891b2",
    "#65a30d",
  ];
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="graph-svg">`;
  for (let k = 0; k <= 5; k++) {
    const v = (L * k) / 5,
      lab = +v.toFixed(2);
    svg += `<line x1="${X(v)}" y1="${Y(0)}" x2="${X(v)}" y2="${Y(L)}" stroke="#eef2f7"/><text x="${X(v)}" y="${H - pad + 16}" font-size="11" text-anchor="middle" fill="#64748b">${lab}</text>`;
    svg += `<line x1="${X(0)}" y1="${Y(v)}" x2="${X(L)}" y2="${Y(v)}" stroke="#eef2f7"/><text x="${pad - 8}" y="${Y(v) + 4}" font-size="11" text-anchor="end" fill="#64748b">${lab}</text>`;
  }
  svg += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(L)}" y2="${Y(0)}" stroke="#94a3b8"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(L)}" stroke="#94a3b8"/>`;
  svg += `<text x="${W - 14}" y="${Y(0) - 6}" font-size="13" font-weight="700" text-anchor="end">x₁</text><text x="${X(0) + 8}" y="22" font-size="13" font-weight="700">x₂</text>`;
  if (poly.length >= 3)
    svg += `<polygon points="${poly.map((q) => X(q[0]) + "," + Y(q[1])).join(" ")}" fill="rgba(16,185,129,.22)" stroke="#10b981" stroke-width="2"/>`;
  lp.A.forEach((r, i) => {
    const e = lineEnds(r[0], r[1], lp.B[i], L);
    if (!e) return;
    const col = colors[i % colors.length];
    svg += `<line x1="${X(e[0][0])}" y1="${Y(e[0][1])}" x2="${X(e[1][0])}" y2="${Y(e[1][1])}" stroke="${col}" stroke-width="2"/><text x="${X(e[1][0]) - 4}" y="${Y(e[1][1]) + 14}" font-size="12" font-weight="700" fill="${col}">(${i + 1})</text>`;
  });
  const z = lp.C[0] * sx + lp.C[1] * sy;
  const oe = lp.C[0] || lp.C[1] ? lineEnds(lp.C[0], lp.C[1], z, L) : null;
  if (oe)
    svg += `<line x1="${X(oe[0][0])}" y1="${Y(oe[0][1])}" x2="${X(oe[1][0])}" y2="${Y(oe[1][1])}" stroke="#ef4444" stroke-width="2" stroke-dasharray="6 4"/>`;
  svg += `<circle cx="${X(sx)}" cy="${Y(sy)}" r="6" fill="#ef4444" stroke="#fff" stroke-width="2"/><text x="${X(sx) + 10}" y="${Y(sy) - 10}" font-size="12" font-weight="700" fill="#b91c1c">(${sol[0]}, ${sol[1]})</text></svg>`;
  return `<div class="graph-card"><div class="result-section-title">Minh họa hình học (phương pháp đồ thị)</div>${svg}<div class="graph-legend"><span><i style="background:#10b981"></i>Miền khả thi</span><span><i style="background:#ef4444"></i>Đường mức hàm mục tiêu &amp; điểm tối ưu</span></div></div>`;
}
