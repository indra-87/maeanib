/* ============================================================
   매안초 연구학교 보고회 안내 — 설정 파일
   GitHub에서 이 파일을 열고 연필(✏️) 버튼 → 값 수정 → Commit changes
   1~2분 뒤 사이트에 반영됩니다.
============================================================ */
window.APP_CONFIG = {
  SCHOOL_NAME: "매안초등학교",
  SITE_TITLE: "매안초등학교 연구학교 보고회",

  /* 연구 주제 (비워 두면 기본 환영 문구가 보입니다) */
  RESEARCH_TOPIC: "",
  RESEARCH_SUB: "",

  /* 보고회 날짜: "2026-11-20" 형식. 참관 확인 'auto' 모드에서 이 날짜에만 열립니다 */
  EVENT_DATE: "",
  EVENT_DATE_LABEL: "",           // 화면 표시용 예: "2026. 11. 20.(금)"

  /* 상단 배지 (비워 두면 숨김) 예: ["📅 2026. 11. 20.(금)", "🏫 공개수업 41학급"] */
  HERO_BADGES: [],

  /* ── 참관 신청 ── */
  REGISTER_URL: "",               // 참관 신청 폼 주소 (구글폼, MS Forms 등)
  REGISTER_OPEN: true,            // false 로 바꾸면 '참관 신청 마감'으로 표시

  /* ── 참관 확인(참관증 발급) ──
     "open"   : 항상 열림
     "closed" : 닫힘
     "auto"   : EVENT_DATE 당일(한국 시간)에만 자동으로 열림           */
  CHECKIN_MODE: "open",           // 초안 미리보기용으로 열어 둠. 배포 후 "closed" 또는 "auto" 권장

  /* 참관증 본문 (추후 입력). 비워 두면 표시하지 않습니다 */
  CERT_TITLE: "참 관 증",
  CERT_BODY: "",
  CERT_SIGNER: "매안초등학교장",
  SEAL_IMAGE: "assets/seal.png",  // 이 경로에 직인 이미지를 올리면 자동 반영 (없으면 '직인 자리' 표시)

  /* ── 한 줄 소감 · 참관 확인 기록 저장소 (Supabase · ibgrow 프로젝트) ──
     maean_comments(소감) · maean_checkins(참관증 발급 기록) 테이블에 저장됩니다.
     아래 키는 사이트에 공개되어도 되는 '공개용(publishable) 키'입니다.
     두 값을 비우면 '미리보기 모드'(소감이 그 기기에만 저장)로 동작합니다.        */
  SUPABASE_URL: "https://pqjuvuflinnrpemqcafl.supabase.co",
  SUPABASE_KEY: "sb_publishable_cLJMfWR5mhDiNte918PA3g_dYD_XGd3",

  /* 당일 일정 아래 안내 문구 */
  SCHEDULE_NOTE: "※ 현재 일정은 화면 구성을 보기 위한 예시입니다.",

  /* 콘텐츠 엑셀 파일 경로 (수업 소개 · 당일 일정 · 자료실) */
  CONTENT_XLSX: "data/content.xlsx",
};
