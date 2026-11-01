/* 매안초 연구학교 보고회 안내 — 공통 스크립트
   · 상단 메뉴/하단 표시
   · data/content.xlsx 읽기 (수업안내 · 당일일정 · 자료실 시트)
   · 수업 소개 창 (공개수업 안내 · 학교 공간 안내 공통)
   · 한 줄 소감                                                      */
(function(){
const CFG = window.APP_CONFIG || {};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch(e){ return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

/* ---------- 참관 확인 열림 여부 ---------- */
function kstToday(){ return new Date(Date.now() + 9*3600e3).toISOString().slice(0,10); }
function checkinOpen(){
  const m = String(CFG.CHECKIN_MODE || "closed").toLowerCase();
  if (m === "open") return true;
  if (m === "auto") return !!CFG.EVENT_DATE && kstToday() === CFG.EVENT_DATE;
  return false;
}

/* ---------- 상단/하단 ---------- */
const NAV = [
  ["classes.html", "공개수업 안내"],
  ["index.html#schedule", "당일 일정"],
  ["campus.html", "주차 및 학교 공간 안내"],
  ["checkin.html", "참관 확인"],
];
function registerButton(){
  if (CFG.REGISTER_URL && CFG.REGISTER_OPEN !== false)
    return `<a class="btn btn-primary btn-register" href="${esc(CFG.REGISTER_URL)}" target="_blank" rel="noopener noreferrer">연구학교 참관 신청 <span aria-hidden="true">↗</span><span class="sr-only"> (새 창)</span></a>`;
  return `<span class="btn btn-register off">${CFG.REGISTER_URL ? "참관 신청 마감" : "참관 신청 · 준비 중"}</span>`;
}
function renderChrome(active){
  const h = document.createElement("header"); h.className = "site";
  h.innerHTML = `<div class="wrap nav">
    <a class="brand" href="index.html"><span class="mark" aria-hidden="true">🏫</span><span class="brand-text"><span>${esc(CFG.SCHOOL_NAME||"")}</span><small>연구학교 보고회 안내</small></span></a>
    <nav class="nav-links" aria-label="주 메뉴">${NAV.map(([href, t]) => `<a href="${href}" class="${active===href?"on":""}">${t}</a>`).join("")}</nav>
    ${registerButton()}
  </div>`;
  document.body.prepend(h);
  const f = document.createElement("footer"); f.className = "site";
  f.innerHTML = `<div class="wrap"><div class="fname">${esc(CFG.SCHOOL_NAME||"")}</div><div>${esc(CFG.RESEARCH_TOPIC || "연구학교 운영 결과 보고회")}</div></div>`;
  document.body.append(f);
}

/* ---------- 엑셀 콘텐츠 ---------- */
let contentPromise = null;
function cell(r, ...names){ for (const n of names){ if (r[n] != null && String(r[n]).trim() !== "") return String(r[n]).trim(); } return ""; }
function loadContent(){
  if (contentPromise) return contentPromise;
  contentPromise = (async () => {
    let wb;
    if (window.CONTENT_XLSX_BASE64){            // 미리보기용: 엑셀을 스크립트에 넣어 둔 경우
      wb = XLSX.read(window.CONTENT_XLSX_BASE64, { type: "base64" });
    } else {
      const res = await fetch((CFG.CONTENT_XLSX || "data/content.xlsx") + "?v=" + Date.now());
      if (!res.ok) throw new Error("콘텐츠 파일을 찾지 못했습니다 (" + res.status + ")");
      wb = XLSX.read(await res.arrayBuffer(), { type: "array" });
    }
    const sheet = name => wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "", raw: false }) : [];
    const classes = sheet("수업안내").map(r => {
      const code = cell(r, "교실코드");
      if (!code) return null;
      const m = /^(\d)-(\d+)$/.exec(code);
      return {
        code,
        grade: cell(r, "학년") || (m ? m[1] : ""),
        cls: cell(r, "반") || (m ? m[2] : ""),
        subject: cell(r, "교과"),
        unit: cell(r, "단원"),
        title: cell(r, "수업 주제"),
        teacher: cell(r, "수업자"),
        place: cell(r, "장소"),
        point: cell(r, "참관 포인트"),
        plan: cell(r, "수업안 파일"),
        open: !/^(x|아니오|n|no|비공개)$/i.test(cell(r, "공개")),
        floor: (cell(r, "장소").match(/(\d)\s*층/) || [])[1] || "",
      };
    }).filter(Boolean);
    const schedule = sheet("당일일정").map(r => ({
      time: [cell(r, "시작"), cell(r, "종료")].filter(Boolean).join("–"),
      what: cell(r, "내용"), where: cell(r, "장소"),
    })).filter(r => r.what);
    const files = sheet("자료실").map(r => ({
      group: cell(r, "구분"), title: cell(r, "제목"), file: cell(r, "파일"), desc: cell(r, "설명"),
    })).filter(r => r.title && r.file);
    return { classes, schedule, files, byCode: Object.fromEntries(classes.map(c => [c.code, c])) };
  })();
  return contentPromise;
}
function loadError(el, e){
  el.innerHTML = `<div class="admin-hint">⚠️ ${esc(e.message)}<br>파일을 컴퓨터에서 바로 열면(file://) 엑셀을 읽을 수 없습니다. GitHub Pages 주소로 확인해 주세요.</div>`;
}

/* ---------- 파일 경로 ---------- */
function fileUrl(p, folder){
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (p.includes("/")) return p;
  return folder + encodeURIComponent(p);
}
function planUrl(c){ return fileUrl(c.plan || (c.code + ".pdf"), "files/lessons/"); }
async function exists(url){
  if (/^https?:\/\//i.test(url) && !url.startsWith(location.origin)) return true;  // 외부 링크(드라이브 등)는 확인 생략
  try { const r = await fetch(url, { method: "HEAD", cache: "no-cache" }); return r.ok; } catch(e){ return false; }
}

/* ---------- 한 줄 소감 · 참관 기록 (Supabase) ----------
   본인 확인: 소감을 등록할 때 이 기기에 무작위 열쇠(token)를 저장하고, 서버에는 그 해시만 저장합니다.
   같은 기기(브라우저)에서만 내 소감을 수정·삭제할 수 있습니다.                         */
const SB = CFG.SUPABASE_URL && CFG.SUPABASE_KEY ? CFG.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" : "";
const sbHeaders = () => ({ apikey: CFG.SUPABASE_KEY, "Content-Type": "application/json" });
const MINE_KEY = "maean-mine";
const mine = () => lsGet(MINE_KEY, {});
function newToken(){
  const a = new Uint8Array(32); crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
}
async function rpc(fn, args){
  const r = await fetch(SB + "rpc/" + fn, { method: "POST", headers: sbHeaders(), body: JSON.stringify(args) });
  if (!r.ok) throw new Error(fn + " 실패 " + r.status);
  return r.json();
}
async function listComments(room){
  if (!SB) return lsGet("maean-cmt-" + room, []);
  const r = await fetch(SB + "maean_comments?select=id,created_at,updated_at,text,who&room=eq." + encodeURIComponent(room) + "&order=created_at.desc&limit=200",
                        { headers: { apikey: CFG.SUPABASE_KEY } });
  if (!r.ok) throw new Error("소감 불러오기 실패 " + r.status);
  return (await r.json()).map(i => ({ id: i.id, t: i.created_at, edited: !!i.updated_at, text: i.text, who: i.who }));
}
async function addComment(room, text, who){
  text = text.slice(0, 100); who = (who || "").slice(0, 20);
  const token = newToken(), m = mine();
  if (!SB){
    const a = lsGet("maean-cmt-" + room, []), id = Date.now();
    a.unshift({ id, room, text, who, t: new Date().toISOString() }); lsSet("maean-cmt-" + room, a);
    m[id] = token; lsSet(MINE_KEY, m); return;
  }
  const id = await rpc("maean_add_comment", { p_room: room, p_text: text, p_who: who, p_token: token });
  m[id] = token; lsSet(MINE_KEY, m);
}
async function updateComment(room, id, text){
  text = text.slice(0, 100);
  if (!SB){
    const a = lsGet("maean-cmt-" + room, []), it = a.find(x => x.id === id);
    if (it){ it.text = text; it.edited = true; lsSet("maean-cmt-" + room, a); } return true;
  }
  return rpc("maean_update_comment", { p_id: id, p_token: mine()[id] || "", p_text: text });
}
async function deleteComment(room, id){
  const m = mine();
  if (!SB){ lsSet("maean-cmt-" + room, lsGet("maean-cmt-" + room, []).filter(x => x.id !== id)); }
  else if (!(await rpc("maean_delete_comment", { p_id: id, p_token: m[id] || "" }))) return false;
  delete m[id]; lsSet(MINE_KEY, m); return true;
}
async function logCheckin(org, name){
  if (!SB) return;
  try { await fetch(SB + "maean_checkins", { method: "POST", headers: { ...sbHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ org: org.slice(0, 30), name: name.slice(0, 15) }) }); } catch(e){}
}
function fmtTime(t){ try { const d = new Date(t); return `${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } catch(e){ return ""; } }

/* ---------- 수업 소개 창 ---------- */
let modal, lastFocus;
function ensureModal(){
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "mbg"; modal.hidden = true;
  modal.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cmTitle">
    <div class="mhead"><span class="mtag" id="cmTag"></span><button class="mclose" id="cmClose" aria-label="닫기">✕</button></div>
    <h2 id="cmTitle"></h2><div id="cmBody" style="display:flex;flex-direction:column;gap:14px"></div></div>`;
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
  $("#cmTag").textContent = c ? [c.grade && c.cls ? `${c.grade}학년 ${c.cls}반` : c.code, c.subject].filter(Boolean).join(" · ")
                              : (room && room.floor ? `${room.floor}층` : "학교 공간");
  $("#cmTitle").textContent = (c && c.title) || (isClass ? `${name} 교실` : name);
  const body = $("#cmBody"); let h = "";
  if (c && (c.unit || c.teacher || c.place)){
    h += `<dl class="rows">${[["단원", c.unit], ["수업자", c.teacher], ["장소", c.place]].filter(x => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
  }
  if (c && c.point) h += `<div class="note"><b>참관 포인트</b>${esc(c.point)}</div>`;
  if (!c || !c.title) h += `<p class="empty-txt">${esc(name)} 소개는 준비 중입니다.</p>`;
  if (c){
    h += `<div class="plan" id="cmPlan"><div class="fic">PDF</div><div class="meta"><b>수업안</b><span>확인 중…</span></div><div class="acts"></div></div>`;
  }
  const links = [];
  if (c && c.floor && !location.pathname.endsWith("campus.html")) links.push(`<a class="btn btn-ghost" href="campus.html#f${c.floor}">📍 위치 보기 (${c.floor}층)</a>`);
  if (links.length) h += `<div class="mlinks">${links.join("")}</div>`;
  if (c || isClass){
    h += `<div class="cmt"><h3>💬 한 줄 참관 소감 <span class="cnt" id="cmCnt"></span></h3>
      <form class="cmt-form" id="cmForm" autocomplete="off">
        <input class="who" id="cmWho" maxlength="20" placeholder="소속·이름 (선택)" aria-label="소속·이름 (선택)">
        <input id="cmText" maxlength="100" required placeholder="수업을 보고 느낀 점을 한 줄로 남겨 주세요" aria-label="참관 소감">
        <button class="btn btn-primary" type="submit">등록</button>
      </form>
      <ul class="cmt-list" id="cmList"></ul>
      <p class="cmt-hint">${SB ? "내가 쓴 소감은 이 기기에서 수정·삭제할 수 있습니다." : "미리보기 모드: 소감이 이 기기에만 저장됩니다."}</p>
    </div>`;
  }
  body.innerHTML = h;
  lastFocus = document.activeElement; modal.hidden = false; document.body.style.overflow = "hidden";
  $("#cmClose").focus();

  if (c){
    const url = planUrl(c), ok = await exists(url), box = $("#cmPlan");
    if (box){
      box.querySelector(".meta span").textContent = ok ? "누르면 바로 열립니다" : "수업안은 준비 중입니다";
      box.querySelector(".acts").innerHTML = ok
        ? `<a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener">보기</a><a class="btn btn-ghost" href="${esc(url)}" download>내려받기</a>`
        : `<span class="btn off">준비 중</span>`;
    }
  }
  if (c || isClass){
    const room = code;
    const draw = async () => {
      const list = $("#cmList"); if (!list) return;
      list.innerHTML = `<li class="empty-txt">불러오는 중…</li>`;
      let items = []; try { items = await listComments(room); } catch(e){ list.innerHTML = `<li class="empty-txt">소감을 불러오지 못했습니다.</li>`; return; }
      $("#cmCnt").textContent = items.length ? items.length + "개" : "";
      const my = mine();
      list.innerHTML = items.length ? items.map(i => `<li data-id="${i.id}">
          <span class="tx">${esc(i.text)}</span><span class="w">${esc(i.who || "")} ${fmtTime(i.t)}${i.edited ? " · 수정됨" : ""}</span>
          ${my[i.id] ? `<span class="own"><button type="button" data-act="edit">수정</button><button type="button" data-act="del">삭제</button></span>` : ""}
        </li>`).join("") : `<li class="empty-txt">첫 소감을 남겨 주세요.</li>`;
    };
    $("#cmList").addEventListener("click", async e => {
      const b = e.target.closest("button[data-act]"); if (!b) return;
      const li = b.closest("li"), id = Number(li.dataset.id), act = b.dataset.act;
      if (act === "edit"){
        const cur = li.querySelector(".tx").textContent;
        li.innerHTML = `<form class="cmt-edit"><input maxlength="100" required aria-label="소감 수정"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-ghost" type="button" data-act="cancel">취소</button></form>`;
        const inp = li.querySelector("input"); inp.value = cur; inp.focus();
        li.querySelector("form").addEventListener("submit", async ev => {
          ev.preventDefault(); const t = inp.value.trim(); if (!t) return;
          try { (await updateComment(room, id, t)) ? toast("소감을 고쳤습니다.") : toast("고칠 수 없는 소감입니다."); } catch(err){ toast("수정하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
          draw();
        });
      } else if (act === "cancel"){ draw(); }
      else if (act === "del"){
        li.querySelector(".own").innerHTML = `<span class="ask">삭제할까요?</span><button type="button" data-act="del-yes">삭제</button><button type="button" data-act="cancel">취소</button>`;
      } else if (act === "del-yes"){
        try { (await deleteComment(room, id)) ? toast("소감을 삭제했습니다.") : toast("삭제할 수 없는 소감입니다."); } catch(err){ toast("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
        draw();
      }
    });
    draw();
    const who = $("#cmWho"); who.value = lsGet("maean-who", "");
    $("#cmForm").addEventListener("submit", async e => {
      e.preventDefault();
      const t = $("#cmText").value.trim(); if (!t) return;
      const btn = e.target.querySelector("button"); btn.disabled = true;
      lsSet("maean-who", who.value.trim());
      try { await addComment(room, t, who.value.trim()); $("#cmText").value = ""; toast("소감이 등록되었습니다. 감사합니다!"); }
      catch(err){ toast("등록하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
      btn.disabled = false; draw();
    });
  }
}

function toast(msg){
  document.querySelectorAll(".toast").forEach(x => x.remove());
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
  document.body.append(t); setTimeout(() => t.remove(), 2400);
}

window.Maean = { CFG, esc, renderChrome, loadContent, loadError, openClassModal, checkinOpen, fileUrl, logCheckin, toast, kstToday };
window.openClassModal = openClassModal;   // 3D 뷰어(iframe)가 이 함수를 부릅니다
})();
