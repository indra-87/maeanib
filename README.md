# 매안초등학교 연구학교 보고회 안내 웹 앱

서버·DB 없이 **GitHub Pages**로 돌아가는 정적 사이트입니다. (무료, 항상 켜짐)

```
index.html          첫 화면 (바로가기 · 당일 일정 · 자료실)
classes.html        공개수업 안내 (학년별 카드 → 수업 소개 · 수업안 PDF · 한 줄 소감)
campus.html         주차 및 학교 공간 안내 (3D 배치도, 교실 클릭 → 같은 수업 소개 창)
checkin.html        참관 확인 (소속 · 이름 · 손 서명 → 참관증 → PDF 저장 / 인쇄)
space/3d.html       매안초 3D 뷰어
assets/config.js    ★ 설정 (참관 신청 링크, 참관 확인 열기/닫기 등)
assets/seal.png     ★ 학교장 직인 이미지 (올리면 참관증에 자동 반영)
data/content.xlsx   ★ 콘텐츠 엑셀 (수업 소개 · 당일 일정 · 자료실)
files/lessons/      ★ 수업안 PDF (1-1.pdf, 1-2.pdf … 교실코드 이름)
files/reports/      ★ 연구보고서 등 내려받을 파일
```

## 1. GitHub에 올려서 사이트 열기 (처음 한 번)

1. github.com 로그인 → 오른쪽 위 **＋ → New repository** → 이름 예: `maean-report` → **Public** → Create
2. 저장소 화면에서 **uploading an existing file** 클릭 → 이 폴더 안의 파일·폴더를 **전부** 끌어다 놓기 → **Commit changes**
3. 저장소 **Settings → Pages** → Source: **Deploy from a branch**, Branch: **main / (root)** → Save
4. 1~2분 뒤 `https://아이디.github.io/maean-report/` 로 접속

## 2. 자주 바꾸는 설정 — `assets/config.js`

GitHub에서 파일 열기 → ✏️ 연필 → 수정 → Commit changes

| 항목 | 설명 |
|---|---|
| `REGISTER_URL` | 참관 신청 폼 주소. 넣으면 상단 '연구학교 참관 신청' 버튼이 켜집니다 |
| `REGISTER_OPEN` | `false` → '참관 신청 마감' |
| `CHECKIN_MODE` | `"open"` 열림 / `"closed"` 닫힘 / `"auto"` 보고회 당일(`EVENT_DATE`)에만 자동 열림 |
| `EVENT_DATE`, `EVENT_DATE_LABEL` | 보고회 날짜 (`"2026-11-20"`), 화면 표시용 (`"2026. 11. 20.(금)"`) |
| `RESEARCH_TOPIC`, `HERO_BADGES` | 첫 화면 제목(연구 주제)과 배지 |
| `CERT_TITLE`, `CERT_BODY`, `CERT_SIGNER` | 참관증 제목 · 본문 · 발급자 |
| `SUPABASE_URL`, `SUPABASE_KEY` | 한 줄 소감 · 참관 기록 저장소 (아래 4번, 이미 설정됨) |

> 초안은 확인용으로 `CHECKIN_MODE: "open"` 입니다. 실제 배포 때는 `"auto"`(당일 자동) 또는 `"closed"`로 바꿔 주세요.

## 3. 콘텐츠 올리기

- **수업 소개 · 일정 · 자료실**: `data/content.xlsx`를 고쳐서 같은 이름으로 `data` 폴더에 다시 업로드 (덮어쓰기). 작성법은 엑셀 첫 시트에 있습니다.
- **수업안 PDF**: `files/lessons` 폴더에 `1-1.pdf`처럼 **교실코드 이름**으로 여러 개를 한 번에 끌어다 놓기. 엑셀을 고칠 필요 없이 수업 소개 창에 '보기 · 내려받기'가 생깁니다.
- **연구보고서 등**: `files/reports`에 올리고, 엑셀 '자료실' 시트에 제목과 파일 이름 한 줄 추가.
- **직인**: 배경이 투명한 PNG를 `assets/seal.png` 이름으로 업로드.
- 파일 하나는 25MB 이하 (웹 업로드 제한). 동영상처럼 큰 파일은 구글 드라이브·NAS 링크를 엑셀 '파일' 칸에 `https://…`로 적으면 됩니다.

## 4. 한 줄 소감 · 참관 기록 (Supabase, 이미 연결됨)

ibgrow 프로젝트에 테이블 2개가 만들어져 있고, `config.js`에 주소와 공개용 키가 들어 있습니다.

| 테이블 | 내용 | 사이트(방문자) 권한 |
|---|---|---|
| `maean_comments` | 교실별 한 줄 소감 (room = 교실코드) | 쓰기 · 읽기 · 본인 것만 수정·삭제 (숨긴 것은 안 보임) |
| `maean_checkins` | 참관증 발급자 소속 · 성명 · 시간 | 쓰기만 (명단은 관리 화면에서만 보임) |

- **본인 소감 수정·삭제:** 소감을 쓴 그 기기(브라우저)에서만 '수정 · 삭제' 버튼이 보입니다. 다른 기기에서 쓰거나 브라우저 기록을 지운 경우에는 관리자가 대신 숨김·삭제해 주세요.
- **소감 숨기기:** Supabase 대시보드 → Table Editor → `maean_comments` → 해당 줄 `hidden`을 `true`로
- **참관자 명단 받기:** Table Editor → `maean_checkins` → 오른쪽 위 Export → CSV
- **보고회가 끝난 뒤:** 두 테이블을 CSV로 백업하고 필요하면 삭제
- 무료 프로젝트는 7일간 사용이 없으면 일시정지됩니다. ibgrow는 다른 앱들과 함께 쓰여 활동이 계속 있겠지만, 보고회 2~3일 전에 소감을 한 번 등록해 보세요.

## 5. QR 코드 팁

- 교실 문 앞 QR: `…/classes.html#1-3` → 그 수업 소개가 바로 열림
- 층별 안내 QR: `…/campus.html#f3` → 3층 배치도로 바로 열림
- 참관 확인 QR: `…/checkin.html`
