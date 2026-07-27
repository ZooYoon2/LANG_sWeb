/* ============================================================
 * Changelog — 버전별 릴리즈 노트 화면
 * 데이터는 window.VocaData.RELEASE_NOTES에서만 관리한다.
 * 배열의 맨 앞이 최신 버전이라고 가정한다.
 * ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function render(app) {
    const notes = (window.VocaData && window.VocaData.RELEASE_NOTES) || [];
    const current = window.VocaData ? window.VocaData.APP_VERSION : "";

    const body = notes.length
      ? notes.map(function (entry, i) {
          const isCurrent = entry.version === current;
          return (
            '<div class="card release">' +
              '<div class="release-head">' +
                '<span class="release-ver">v' + esc(entry.version) + "</span>" +
                (isCurrent ? '<span class="chip freq" style="background:var(--hl-soft);color:var(--ink);border:0">현재</span>' : "") +
                '<span class="release-date">' + esc(entry.date || "") + "</span>" +
              "</div>" +
              '<ul class="release-notes">' +
                (Array.isArray(entry.notes) ? entry.notes : []).map(function (n) {
                  return "<li>" + esc(n) + "</li>";
                }).join("") +
              "</ul>" +
            "</div>"
          );
        }).join("")
      : '<div class="card center" style="padding:26px 18px">' +
          '<p class="muted">등록된 릴리즈 노트가 없습니다.</p>' +
        "</div>";

    app.el.innerHTML =
      app.topbarHTML("홈") +
      '<h1 class="screen-title">릴리즈 노트</h1>' +
      '<p class="screen-sub">최신 버전이 위에 표시됩니다. 현재 실행 중인 버전은 <span class="hl">v' + esc(current) + "</span></p>" +
      body;
    app.bindBack("home");
  }

  window.Features = window.Features || {};
  window.Features.Changelog = { render: render };
})();
