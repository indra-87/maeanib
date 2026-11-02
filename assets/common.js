/* 매안초 연구학교 보고회 안내 — 공통 스크립트
   · 내용은 Supabase(maean_content)에서 읽습니다. 편집은 admin.html
   · 수업 소개 창 (공개수업 안내 · 학교 공간 안내 공통)
   · 한 줄 소감 (본인 것만 수정·삭제)                                   */
(function(){
/* ---------- 모든 페이지 공통 머리 부분: 글꼴 · 탭 아이콘 ----------
   글꼴이나 아이콘을 바꿀 때는 여기만 고치면 됩니다. (각 HTML 파일은 고칠 필요 없음) */
const FONTS = "https://fonts.googleapis.com/css2?family=Do+Hyeon&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Nanum+Myeongjo:wght@400;700;800&display=swap";
[["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" }],
 ["link", { rel: "stylesheet", href: FONTS }],
 ["link", { rel: "icon", type: "image/png", href: "assets/favicon.png" }],
 ["link", { rel: "apple-touch-icon", href: "assets/apple-touch-icon.png" }],
 ["meta", { name: "theme-color", content: "#1c2347" }],
].forEach(([tag, attrs]) => { const el = document.createElement(tag); Object.assign(el, attrs); document.head.appendChild(el); });

const BASE = window.APP_CONFIG || {};
const CFG = { ...BASE };                       // 편집 페이지의 '사이트 설정'이 불러온 뒤 합쳐집니다
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch(e){ return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
const SBURL = (BASE.SUPABASE_URL || "").replace(/\/$/, "");
const REST = SBURL ? SBURL + "/rest/v1/" : "";
const KEY = BASE.SUPABASE_KEY || "";

/* 층 정보 (3D 배치도 기준) */
const FLOOR_EXTRA = { 1: "중앙현관, 시청각실, 교무실", 2: "도서관, 체육관", 3: "컴퓨터실, SW미래교실", 4: "과학실", 5: "음악실, 옥상텃밭" };
const floorOf = c => c.floor || ((c.place || "").match(/(\d)\s*층/) || [])[1] || "";

/* ---------- 파일 주소 ---------- */
function fileUrl(p){
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${SBURL}/storage/v1/object/public/${BASE.STORAGE_BUCKET || "maean"}/${p.split("/").map(encodeURIComponent).join("/")}`;
}
function downloadUrl(p, name){
  const u = fileUrl(p); if (!u || /^https?:\/\//i.test(p)) return u;
  return u + "?download=" + encodeURIComponent(name || p.split("/").pop());
}

/* ---------- 내용 불러오기 ---------- */
let contentPromise = null;
function loadContent(){
  if (contentPromise) return contentPromise;
  contentPromise = (async () => {
    let rows;
    try {
      const r = await fetch(REST + "maean_content?select=key,data,version", { headers: { apikey: KEY }, cache: "no-store" });
      if (!r.ok) throw new Error("내용을 불러오지 못했습니다 (" + r.status + ")");
      rows = await r.json();
    } catch(e){
      if (window.CONTENT_FALLBACK) rows = window.CONTENT_FALLBACK; else throw e;
    }
    const by = Object.fromEntries(rows.map(r => [r.key, r.data]));
    Object.assign(CFG, by.settings || {});
    const classes = (by.classes || []).map(c => ({ ...c, floor: floorOf(c) }));
    return {
      settings: by.settings || {}, classes, schedule: by.schedule || [], files: by.files || [],
      byCode: Object.fromEntries(classes.map(c => [c.code, c])),
    };
  })();
  return contentPromise;
}
function loadError(el, e){
  el.innerHTML = `<p class="notice">${esc(e.message)} 잠시 뒤 새로고침해 주세요.</p>`;
}

/* ---------- 참관 확인 열림 여부 ---------- */
function kstToday(){ return new Date(Date.now() + 9*3600e3).toISOString().slice(0,10); }
function checkinOpen(){
  const m = String(CFG.CHECKIN_MODE || "closed").toLowerCase();
  if (m === "open") return true;
  if (m === "auto") return !!CFG.EVENT_DATE && kstToday() === CFG.EVENT_DATE;
  return false;
}

/* ---------- 머리말 / 꼬리말 ---------- */
const NAV = [
  ["classes.html", "공개수업"],
  ["index.html#schedule", "당일 일정"],
  ["campus.html", "주차 · 학교 공간"],
  ["checkin.html", "참관 확인"],
];
function registerHtml(){
  if (CFG.REGISTER_URL && CFG.REGISTER_OPEN !== false)
    return `<a class="btn btn-act" href="${esc(CFG.REGISTER_URL)}" target="_blank" rel="noopener noreferrer">참관 신청<span class="sr-only"> (새 창)</span></a>`;
  return `<span class="btn btn-off">${CFG.REGISTER_URL ? "참관 신청 마감" : "참관 신청 준비 중"}</span>`;
}
function renderChrome(active){
  const h = document.createElement("header"); h.className = "top";
  h.innerHTML = `<div class="wrap top-in">
    <a class="brand" href="index.html" aria-label="${esc(BASE.SCHOOL_NAME)} 연구학교 보고회 첫 화면">
      <img class="brand-logo" src="assets/logo.png" alt="" width="44" height="44">
      <span class="brand-name">${esc(BASE.SCHOOL_NAME || "")}<small>연구학교 보고회</small></span>
    </a>
    <nav class="menu" aria-label="주 메뉴">${NAV.map(([href, t]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
    <div class="reg" id="regSlot">${registerHtml()}</div>
  </div>`;
  document.body.prepend(h);
  const f = document.createElement("footer"); f.className = "foot";
  f.innerHTML = `<div class="wrap"><b>${esc(BASE.SCHOOL_NAME || "")}</b><span id="footTopic">연구학교 운영 결과 보고회</span></div>`;
  document.body.append(f);
  loadContent().then(() => {
    $("#regSlot").innerHTML = registerHtml();
    if (CFG.RESEARCH_TOPIC) $("#footTopic").textContent = CFG.RESEARCH_TOPIC;
  }).catch(() => {});
}

/* ---------- 한 줄 소감 (Supabase) ---------- */
const sbHeaders = () => ({ apikey: KEY, "Content-Type": "application/json" });
const MINE_KEY = "maean-mine";
const mine = () => lsGet(MINE_KEY, {});
function newToken(){ const a = new Uint8Array(32); crypto.getRandomValues(a); return Array.from(a, b => b.toString(16).padStart(2, "0")).join(""); }
async function rpc(fn, args){
  const r = await fetch(REST + "rpc/" + fn, { method: "POST", headers: sbHeaders(), body: JSON.stringify(args) });
  if (!r.ok) throw new Error(fn + " 실패 " + r.status);
  return r.json();
}
async function listComments(room){
  const r = await fetch(REST + "maean_comments?select=id,created_at,updated_at,text,who&room=eq." + encodeURIComponent(room) + "&order=created_at.desc&limit=200", { headers: { apikey: KEY } });
  if (!r.ok) throw new Error("소감 불러오기 실패 " + r.status);
  return (await r.json()).map(i => ({ id: i.id, t: i.created_at, edited: !!i.updated_at, text: i.text, who: i.who }));
}
async function addComment(room, text, who){
  const token = newToken();
  const id = await rpc("maean_add_comment", { p_room: room, p_text: text.slice(0, 100), p_who: (who || "").slice(0, 20), p_token: token });
  const m = mine(); m[id] = token; lsSet(MINE_KEY, m);
}
const updateComment = (id, text) => rpc("maean_update_comment", { p_id: id, p_token: mine()[id] || "", p_text: text.slice(0, 100) });
async function deleteComment(id){
  const m = mine(); if (!(await rpc("maean_delete_comment", { p_id: id, p_token: m[id] || "" }))) return false;
  delete m[id]; lsSet(MINE_KEY, m); return true;
}
async function logCheckin(org, name, sig){
  const body = { org: org.slice(0, 30), name: name.slice(0, 15) };
  if (sig && sig.length < 150000) body.sig = sig;      // 참관 등록부에 들어갈 서명 (작게 줄인 PNG)
  try { await fetch(REST + "maean_checkins", { method: "POST", headers: { ...sbHeaders(), Prefer: "return=minimal" }, body: JSON.stringify(body) }); } catch(e){}
}
function fmtTime(t){ try { const d = new Date(t); return `${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } catch(e){ return ""; } }

/* ---------- 수업 소개 창 ---------- */
let modal, lastFocus;
function ensureModal(){
  if (modal) return modal;
  modal = document.createElement("div"); modal.className = "scrim"; modal.hidden = true;
  modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cmTitle">
    <div class="sheet-head"><span class="plate" id="cmPlate"></span><div class="sheet-tag" id="cmTag"></div><button class="x" id="cmClose" aria-label="닫기">✕</button></div>
    <h2 id="cmTitle"></h2><div class="sheet-body" id="cmBody"></div></div>`;
  document.body.append(modal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  $("#cmClose").addEventListener("click", closeModal);
  addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  return modal;
}
function closeModal(){ modal.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus?.(); }

async function openClassModal(code, room){
  ensureModal();
  let data = null; try { data = await loadContent(); } catch(e){}
  const c = data && data.byCode[code];
  const name = (room && room.name) || code;
  const isClass = /^\d-\d+$/.test(code);
  const fl = (c && c.floor) || (room && room.floor) || "";
  modal.querySelector(".sheet").dataset.floor = fl;
  $("#cmPlate").textContent = isClass ? code : (fl ? fl + "층" : "");
  $("#cmPlate").hidden = !$("#cmPlate").textContent;
  $("#cmTag").innerHTML = c ? [c.grade && c.cls ? `${c.grade}학년 ${c.cls}반` : "", c.subject].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("")
                            : (fl ? `<span>${fl}층</span>` : "");
  $("#cmTitle").textContent = (c && c.title) || (isClass ? `${name} 교실` : name);
  let h = "";
  if (c && (c.unit || c.teacher || c.place)){
    h += `<dl class="facts">${[["단원", c.unit], ["수업자", c.teacher], ["장소", c.place]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
  }
  if (c && c.point) h += `<div class="point"><b>참관 포인트</b><p>${esc(c.point)}</p></div>`;
  if (!c || !c.title) h += `<p class="muted">${esc(name)} 소개는 준비 중입니다.</p>`;
  if (c){
    h += c.plan
      ? `<div class="doc"><span class="doc-ic" aria-hidden="true">PDF</span><div class="doc-meta"><b>수업안</b><span>${esc(c.planName || "수업안")}</span></div>
           <div class="doc-acts"><a class="btn btn-act" href="${esc(fileUrl(c.plan))}" target="_blank" rel="noopener">열기</a><a class="btn btn-line" href="${esc(downloadUrl(c.plan, c.planName))}">내려받기</a></div></div>`
      : `<div class="doc off"><span class="doc-ic" aria-hidden="true">PDF</span><div class="doc-meta"><b>수업안</b><span>준비 중입니다</span></div></div>`;
  }
  if (c && c.floor && !location.pathname.endsWith("campus.html")) h += `<a class="btn btn-line wide locate" href="campus.html#f${c.floor}" data-floor="${c.floor}"><svg class="ic-pin" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>${c.floor}층 배치도에서 위치 보기</a>`;
  if (c || isClass){
    h += `<section class="talk" aria-labelledby="cmTalk">
      <h3 id="cmTalk">한 줄 참관 소감 <span id="cmCnt"></span></h3>
      <form class="talk-form" id="cmForm" autocomplete="off">
        <input class="who" id="cmWho" maxlength="20" placeholder="소속·이름 (선택)" aria-label="소속·이름 (선택)">
        <input id="cmText" maxlength="100" required placeholder="수업을 보고 느낀 점을 한 줄로" aria-label="참관 소감">
        <button class="btn btn-act" type="submit">등록</button>
      </form>
      <ul class="talk-list" id="cmList"></ul>
      <p class="hint">내가 쓴 소감은 이 기기에서 고치거나 지울 수 있습니다.</p>
    </section>`;
  }
  $("#cmBody").innerHTML = h;
  lastFocus = document.activeElement; modal.hidden = false; document.body.style.overflow = "hidden";
  $("#cmClose").focus();
  if (!(c || isClass)) return;

  const draw = async () => {
    const list = $("#cmList"); if (!list) return;
    list.innerHTML = `<li class="muted">불러오는 중…</li>`;
    let items = []; try { items = await listComments(code); } catch(e){ list.innerHTML = `<li class="muted">소감을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</li>`; return; }
    $("#cmCnt").textContent = items.length ? items.length + "개" : "";
    const my = mine();
    list.innerHTML = items.length ? items.map(i => `<li data-id="${i.id}"><span class="tx">${esc(i.text)}</span>
        <span class="by">${esc(i.who || "")} ${fmtTime(i.t)}${i.edited ? " (수정됨)" : ""}</span>
        ${my[i.id] ? `<span class="own"><button type="button" data-act="edit">수정</button><button type="button" data-act="del">삭제</button></span>` : ""}</li>`).join("")
      : `<li class="muted">첫 소감을 남겨 주세요.</li>`;
  };
  draw();
  $("#cmList").addEventListener("click", async e => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const li = b.closest("li"), id = Number(li.dataset.id), act = b.dataset.act;
    if (act === "edit"){
      const cur = li.querySelector(".tx").textContent;
      li.innerHTML = `<form class="talk-edit"><input maxlength="100" required aria-label="소감 고치기"><button class="btn btn-act" type="submit">저장</button><button class="btn btn-line" type="button" data-act="cancel">취소</button></form>`;
      const inp = li.querySelector("input"); inp.value = cur; inp.focus();
      li.querySelector("form").addEventListener("submit", async ev => {
        ev.preventDefault(); const t = inp.value.trim(); if (!t) return;
        try { toast((await updateComment(id, t)) ? "소감을 고쳤습니다." : "이 소감은 고칠 수 없습니다."); } catch(err){ toast("고치지 못했습니다. 잠시 뒤 다시 시도해 주세요."); }
        draw();
      });
    } else if (act === "cancel") draw();
    else if (act === "del") li.querySelector(".own").innerHTML = `<span class="ask">지울까요?</span><button type="button" data-act="del-yes">지우기</button><button type="button" data-act="cancel">취소</button>`;
    else if (act === "del-yes"){
      try { toast((await deleteComment(id)) ? "소감을 지웠습니다." : "이 소감은 지울 수 없습니다."); } catch(err){ toast("지우지 못했습니다. 잠시 뒤 다시 시도해 주세요."); }
      draw();
    }
  });
  const who = $("#cmWho"); who.value = lsGet("maean-who", "");
  $("#cmForm").addEventListener("submit", async e => {
    e.preventDefault();
    const t = $("#cmText").value.trim(); if (!t) return;
    const btn = e.target.querySelector("button"); btn.disabled = true;
    lsSet("maean-who", who.value.trim());
    try { await addComment(code, t, who.value.trim()); $("#cmText").value = ""; toast("소감을 등록했습니다. 고맙습니다."); }
    catch(err){ toast("등록하지 못했습니다. 잠시 뒤 다시 시도해 주세요."); }
    btn.disabled = false; draw();
  });
}

function toast(msg){
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
  document.body.append(t); setTimeout(() => t.remove(), 2600);
}

window.Maean = { CFG, BASE, esc, renderChrome, loadContent, loadError, openClassModal, checkinOpen, fileUrl, downloadUrl, logCheckin, toast, kstToday, FLOOR_EXTRA, floorOf };
window.openClassModal = openClassModal;   // 3D 뷰어(iframe)가 이 함수를 부릅니다
})();
