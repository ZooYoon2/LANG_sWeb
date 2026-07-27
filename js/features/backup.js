/* ============================================================
 * Backup — 학습 데이터 백업/복원 (기기 간 수동 이동용)
 * localStorage는 기기별 저장이므로, JSON 파일로 내보내서
 * 다른 기기에서 불러오는 방식으로 동기화한다.
 * ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function render(app) {
    const repo = app.repo;
    app.el.innerHTML =
      app.topbarHTML("홈") +
      '<h1 class="screen-title">백업 · 설정</h1>' +
      '<p class="screen-sub">학습 기록은 이 기기 브라우저에만 저장됩니다. 다른 기기로 옮기려면 백업 파일을 사용하세요.</p>' +
      '<div class="card stack">' +
        '<p class="muted">진행 상태, 오답노트, 시험 기록, 추가한 콘텐츠를 모두 파일로 저장합니다.</p>' +
        '<button class="btn" id="do-export">백업 파일 내려받기</button>' +
      "</div>" +
      '<div class="card stack">' +
        '<p class="muted">백업 파일을 불러오면 현재 기기의 데이터를 덮어씁니다.</p>' +
        '<input type="file" id="import-file" accept=".json,application/json" style="font-size:14px">' +
        '<button class="btn secondary" id="do-import">백업 파일 불러오기</button>' +
        '<div id="backup-msg"></div>' +
      "</div>" +
      '<div class="card stack">' +
        '<p class="muted">모든 학습 데이터를 지우고 처음부터 시작합니다. 되돌릴 수 없습니다.</p>' +
        '<button class="btn danger" id="do-reset">전체 초기화</button>' +
      "</div>" +
      '<button class="version-link" id="to-changelog" aria-label="릴리즈 노트 보기">' +
        "현재 실행 중인 버전: v" + window.VocaData.APP_VERSION +
        " (" + window.VocaData.APP_VERSION_DATE + ") ›" +
      "</button>";
    app.bindBack("home");

    app.el.querySelector("#do-export").addEventListener("click", function () {
      const data = repo.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "vocaloop-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    });

    app.el.querySelector("#do-import").addEventListener("click", function () {
      const fileInput = app.el.querySelector("#import-file");
      const msgEl = app.el.querySelector("#backup-msg");
      const file = fileInput.files && fileInput.files[0];
      if (!file) { msgEl.innerHTML = '<p class="msg no">파일을 먼저 선택해 주세요.</p>'; return; }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          repo.importAll(JSON.parse(reader.result));
          app.state = repo.loadState();
          msgEl.innerHTML = '<p class="msg ok">복원 완료! 홈으로 이동합니다.</p>';
          setTimeout(function () { app.navigate("home"); }, 900);
        } catch (e) {
          msgEl.innerHTML = '<p class="msg no">' + esc(e.message || "복원에 실패했습니다.") + "</p>";
        }
      };
      reader.readAsText(file);
    });

    app.el.querySelector("#do-reset").addEventListener("click", function () {
      if (!confirm("정말 모든 학습 데이터를 지울까요? 되돌릴 수 없습니다.")) return;
      repo.resetAll();
      app.state = repo.loadState();
      app.navigate("home");
    });
    app.el.querySelector("#to-changelog").addEventListener("click", function () {
      app.navigate("changelog");
    });
  }

  window.Features.Backup = { render: render };
})();
