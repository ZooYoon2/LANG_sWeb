/* ============================================================
 * WrongNote — 오답노트
 *  - 틀린 횟수순 정렬, 2회 이상 "자주 틀림" 배지
 *  - 오답 재시험 (맞히면 카운트 감소, 1회짜리는 노트에서 제거)
 * ============================================================ */
(function () {
  "use strict";

  const M = window.Models;
  const Quiz = window.Features.Quiz;

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  const SOURCE_LABEL = {
    review7: "7일 전 복습",
    review1: "어제 복습",
    today: "당일 시험",
    weekly: "주간시험",
    retry: "재시험",
  };

  function render(app) {
    const repo = app.repo;
    const notes = repo.loadWrongNotes().sort(function (a, b) {
      return b.wrongCount - a.wrongCount || (a.lastWrongDate < b.lastWrongDate ? 1 : -1);
    });
    const wordMap = repo.getWordMap();
    const valid = notes.filter(function (n) { return wordMap[n.itemId]; });

    app.el.innerHTML =
      app.topbarHTML("홈") +
      '<h1 class="screen-title">오답노트</h1>' +
      '<p class="screen-sub">틀린 횟수가 많은 순서. 2회 이상은 <span class="chip freq">자주 틀림</span></p>' +
      (valid.length
        ? '<button class="btn" id="retry-btn">오답 재시험 (' + Math.min(valid.length, 30) + "문제)</button>" +
          '<div class="card" style="margin-top:12px">' +
          valid.map(function (n) {
            const w = wordMap[n.itemId];
            return (
              '<div class="note-item">' +
                "<div><div class='w'>" + esc(w.word) + "</div>" +
                "<div class='m'>" + esc(w.meaning) +
                (n.sources.length ? " · " + n.sources.map(function (s) { return SOURCE_LABEL[s] || s; }).join(", ") : "") +
                "</div></div>" +
                '<div class="right">' +
                  (n.isFrequent ? '<span class="chip freq">자주 틀림</span><br>' : "") +
                  '<span class="cnt">' + n.wrongCount + "회</span>" +
                "</div>" +
              "</div>"
            );
          }).join("") +
          "</div>"
        : '<div class="card center" style="padding:34px 18px">' +
            '<p style="font-weight:700">오답노트가 비어 있습니다</p>' +
            '<p class="muted">시험에서 틀린 단어가 여기에 자동으로 기록됩니다.</p>' +
          "</div>");
    app.bindBack("home");

    const retryBtn = app.el.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        startRetryQuiz(app, valid.slice(0, 30).map(function (n) { return wordMap[n.itemId]; }));
      });
    }
  }

  function startRetryQuiz(app, words) {
    const repo = app.repo;
    const questions = Quiz.buildWordQuiz(words, repo.getAllWords());
    app.el.innerHTML = app.topbarHTML("오답노트") + '<div id="retry-body"></div>';
    app.bindBack("wrongnote");
    Quiz.renderQuiz(app.el.querySelector("#retry-body"), {
      title: "오답 재시험",
      questions: questions,
      onFinish: function (r) {
        const wrongIds = r.wrongItems.map(function (w) { return w.id; });
        const correctIds = words
          .map(function (w) { return w.id; })
          .filter(function (id) { return wrongIds.indexOf(id) === -1; });
        if (correctIds.length) repo.resolveWrong(correctIds); // 맞힌 건 카운트 감소
        if (wrongIds.length) repo.recordWrong(wrongIds, "retry");
        repo.addResult(new M.QuizResult({
          quizType: "retry", score: r.score, total: r.total, wrongItemIds: wrongIds,
        }));
        app.navigate("wrongnote");
      },
    });
  }

  window.Features.WrongNote = { render: render };
})();
