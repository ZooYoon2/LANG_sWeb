/* ============================================================
 * main.js — 앱 초기화 · 화면 라우팅 · 홈 화면
 * ============================================================ */
(function () {
  "use strict";

  const S = window.Storage2;
  const F = window.Features;

  const App = {
    el: null,
    repo: null,
    state: null,

    /* ---------- 라우팅 ---------- */
    navigate: function (name) {
      window.scrollTo(0, 0);
      switch (name) {
        case "home": renderHome(); break;
        case "study": F.Study.startDailyFlow(App); break;
        case "weekly": F.Study.startWeeklyQuiz(App); break;
        case "wrongnote": F.WrongNote.render(App); break;
        case "import": F.ContentImport.render(App); break;
        case "library": F.ContentImport.renderLibrary(App); break;
        case "backup": F.Backup.render(App); break;
        default: renderHome();
      }
    },

    /* ---------- 공통 상단 바 ---------- */
    topbarHTML: function (backLabel) {
      return (
        '<div class="topbar">' +
          (backLabel ? '<button class="back" id="topbar-back">← ' + backLabel + "</button>" : "<span></span>") +
          '<span class="brand">Voca<span class="hl">Loop</span></span>' +
        "</div>"
      );
    },
    bindBack: function (screenName) {
      const b = App.el.querySelector("#topbar-back");
      if (b) b.addEventListener("click", function () { App.navigate(screenName); });
    },
  };

  /* ---------- 홈 화면 ---------- */
  function renderHome() {
    const repo = App.repo;
    const state = App.state;
    const totalDays = repo.getTotalDays();
    const day = state.currentDay;
    const allDone = day > totalDays;
    const progress = totalDays ? Math.min(100, Math.round((state.completedCount / totalDays) * 100)) : 0;
    const wrongCount = repo.loadWrongNotes().length;
    const results = repo.loadResults();
    const recent = results.slice(-10);
    const recentRate = recent.length
      ? Math.round(
          (recent.reduce(function (s, r) { return s + r.score; }, 0) /
           recent.reduce(function (s, r) { return s + r.total; }, 0)) * 100
        )
      : null;
    const weekly = state.pendingWeeklyWeek;

    // 오늘의 스텝 미리보기
    const preview = [];
    if (!allDone) {
      if (day > 7) preview.push("7일 전 단어 30개 복습 시험");
      if (day > 1) preview.push("어제 단어 30개 복습 시험");
      preview.push("오늘 단어 30개 학습");
      preview.push("오늘 암기 시험");
    }

    App.el.innerHTML =
      App.topbarHTML(null) +
      '<div class="card day-hero">' +
        '<div class="eyebrow">TOEIC · TOEFL VOCAB</div>' +
        '<div class="day-num">' + (allDone ? "완주!" : "Day " + day) + "</div>" +
        '<div class="progress-track"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
        '<p class="muted">' + state.completedCount + " / " + totalDays + "일 완료 · " + progress + "%</p>" +
      "</div>" +
      '<div class="stat-row">' +
        '<div class="stat"><div class="num">' + (state.completedCount * 30) + '</div><div class="lbl">누적 학습 단어</div></div>' +
        '<div class="stat"><div class="num">' + (recentRate === null ? "—" : recentRate + "%") + '</div><div class="lbl">최근 정답률</div></div>' +
        '<div class="stat"><div class="num">' + wrongCount + '</div><div class="lbl">오답노트</div></div>' +
      "</div>" +
      (weekly
        ? '<div class="weekly-banner"><p>' + weekly + "주차 주간시험 응시 가능 (지금까지 배운 단어 랜덤 50)</p>" +
          '<button class="btn small" id="btn-weekly">응시하기</button></div>'
        : "") +
      (!allDone
        ? '<div class="card">' +
            '<p class="muted" style="margin-bottom:4px">오늘의 순서</p>' +
            '<ul class="step-preview">' +
              preview.map(function (p, i) {
                return '<li><span class="n">' + (i + 1) + "</span>" + p + "</li>";
              }).join("") +
            "</ul>" +
          "</div>" +
          '<button class="btn" id="btn-start">Day ' + day + " 시작</button>"
        : '<div class="card center" style="padding:26px 18px">' +
            '<p style="font-weight:800">준비된 단어를 모두 끝냈습니다</p>' +
            '<p class="muted">콘텐츠 추가에서 새 단어 팩을 넣어 이어가세요.</p>' +
          "</div>") +
      '<div class="card" style="margin-top:12px">' +
        '<ul class="menu-list">' +
          '<li><button data-nav="wrongnote">오답노트' + (wrongCount ? " (" + wrongCount + ")" : "") + '<span class="arrow">›</span></button></li>' +
          '<li><button data-nav="import">콘텐츠 추가 (Claude 팩 가져오기)<span class="arrow">›</span></button></li>' +
          '<li><button data-nav="library">라이브러리 (문법 · 토익)<span class="arrow">›</span></button></li>' +
          '<li><button data-nav="backup">백업 · 설정<span class="arrow">›</span></button></li>' +
        "</ul>" +
      "</div>";

    const startBtn = App.el.querySelector("#btn-start");
    if (startBtn) startBtn.addEventListener("click", function () { App.navigate("study"); });
    const weeklyBtn = App.el.querySelector("#btn-weekly");
    if (weeklyBtn) weeklyBtn.addEventListener("click", function () { App.navigate("weekly"); });
    App.el.querySelectorAll("[data-nav]").forEach(function (b) {
      b.addEventListener("click", function () { App.navigate(b.dataset.nav); });
    });
  }

  /* ---------- 초기화 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    App.el = document.getElementById("app");
    App.repo = new S.Repository(new S.LocalStorageProvider());
    App.state = App.repo.loadState();
    App.repo.saveState(App.state); // 최초 실행 시 시작일 기록
    App.navigate("home");
  });

  window.App = App;
})();
