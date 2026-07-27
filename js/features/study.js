/* ============================================================
 * Study — 일일 학습 플로우 + 주간시험
 * 일일 흐름:
 *   Step1  7일 전 단어 30개 복습 시험  (Day 8부터)
 *   Step2  어제 단어 30개 복습 시험    (Day 2부터)
 *   Step3  오늘 단어 30개 카드 학습
 *   Step4  오늘 단어 30개 암기 시험
 * 오늘 단어는 시작 시점에 미학습 풀에서 무작위 30개가 배정된다.
 * 주간시험: 7일 완료마다 지금까지 배운 단어 중 랜덤 50개
 * ============================================================ */
(function () {
  "use strict";

  const M = window.Models;
  const Quiz = window.Features.Quiz;
  const Speech = window.Features.Speech;

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  /* ---------- 일일 플로우 ---------- */
  function startDailyFlow(app) {
    const repo = app.repo;
    const state = app.state;
    const day = state.currentDay;

    // 오늘 단어 배정 (처음이면 무작위 30개 추출, 이후 고정)
    const todayWords = repo.ensureAssignment(day);
    if (!todayWords.length) {
      app.el.innerHTML =
        app.topbarHTML("홈") +
        '<h1 class="screen-title">모든 단어를 끝냈습니다!</h1>' +
        '<p class="screen-sub">콘텐츠 추가 화면에서 새 단어 팩을 넣으면 이어서 학습할 수 있어요.</p>' +
        '<button class="btn" id="go-import">콘텐츠 추가하러 가기</button>';
      app.bindBack("home");
      app.el.querySelector("#go-import").addEventListener("click", function () {
        app.navigate("import");
      });
      return;
    }

    // 오늘의 스텝 구성
    const steps = [];
    if (day > 7) steps.push({ type: "quiz", quizType: "review7", label: "7일 전 복습", day: day - 7 });
    if (day > 1) steps.push({ type: "quiz", quizType: "review1", label: "어제 복습", day: day - 1 });
    steps.push({ type: "learn", label: "오늘 단어 학습", day: day });
    steps.push({ type: "quiz", quizType: "today", label: "오늘 암기 시험", day: day });

    let stepIdx = 0;

    function stepsBarHTML() {
      return (
        '<div class="flow-steps">' +
        steps.map(function (s, i) {
          const cls = i < stepIdx ? "done" : i === stepIdx ? "now" : "";
          return '<span class="' + cls + '"></span>';
        }).join("") +
        "</div>"
      );
    }

    function next() {
      stepIdx += 1;
      if (stepIdx < steps.length) runStep();
      else finishDay();
    }

    function runStep() {
      const step = steps[stepIdx];
      app.el.innerHTML = app.topbarHTML("홈") + stepsBarHTML() + '<div id="step-body"></div>';
      app.bindBack("home");
      const body = app.el.querySelector("#step-body");

      if (step.type === "learn") renderLearn(body, step);
      else renderStepQuiz(body, step);
    }

    function renderStepQuiz(body, step) {
      const words = repo.getWordsForDay(step.day);
      const pool = repo.getAllWords();
      const questions = Quiz.buildWordQuiz(words, pool);
      Quiz.renderQuiz(body, {
        title: "Day " + day + " · " + step.label,
        questions: questions,
        onFinish: function (r) {
          const wrongIds = r.wrongItems.map(function (w) { return w.id; });
          if (wrongIds.length) repo.recordWrong(wrongIds, step.quizType);
          repo.addResult(new M.QuizResult({
            quizType: step.quizType, day: day, score: r.score, total: r.total, wrongItemIds: wrongIds,
          }));
          next();
        },
      });
    }

    function renderLearn(body, step) {
      const words = repo.getWordsForDay(step.day);
      let cardIdx = 0;
      let showMeaning = false;
      let listMode = false;

      function render() {
        if (listMode) {
          body.innerHTML =
            '<div class="quiz-head"><span class="t">Day ' + day + " · 오늘 단어 " + words.length + '개</span>' +
            '<span class="p">목록 보기</span></div>' +
            '<div class="card"><ul class="word-list">' +
            words.map(function (w) {
              return "<li>" + Speech.buttonHTML(w.word) +
                "<span class='w'>" + esc(w.word) + "</span><span class='m'>" +
                (w.posLabel ? "[" + esc(w.posLabel) + "] " : "") + esc(w.meaning) + "</span></li>";
            }).join("") +
            "</ul></div>" +
            '<div class="btn-row">' +
              '<button class="btn secondary" id="to-cards">카드로 보기</button>' +
              '<button class="btn" id="to-quiz">암기 시험 시작</button>' +
            "</div>";
          Speech.bindAll(body);
          body.querySelector("#to-cards").addEventListener("click", function () { listMode = false; render(); });
          body.querySelector("#to-quiz").addEventListener("click", next);
          return;
        }

        const w = words[cardIdx];
        const last = cardIdx === words.length - 1;
        body.innerHTML =
          '<div class="quiz-head"><span class="t">Day ' + day + " · 오늘 단어 학습</span>" +
          '<span class="p">' + (cardIdx + 1) + " / " + words.length + "</span></div>" +
          '<div class="flashcard" id="fc">' +
            '<div class="word-row"><div class="word">' + esc(w.word) + "</div>" + Speech.buttonHTML(w.word) + "</div>" +
            (w.phonetic ? '<p class="phonetic">' + esc(w.phonetic) + "</p>" : "") +
            (w.posLabel ? '<span class="chip pos" style="margin-top:8px">' + esc(w.posLabel) + "</span>" : "") +
            (showMeaning
              ? '<div class="meaning"><span class="hl">' + esc(w.meaning) + "</span></div>" +
                (w.example ? '<p class="hint">' + esc(w.example) + "</p>" : "")
              : '<p class="hint">탭해서 뜻 보기</p>') +
          "</div>" +
          '<div class="card-nav">' +
            '<button class="btn secondary small" id="prev"' + (cardIdx === 0 ? " disabled" : "") + ">이전</button>" +
            '<span class="count">' + (cardIdx + 1) + " / " + words.length + "</span>" +
            '<button class="btn secondary small" id="nx">' + (last ? "처음으로" : "다음") + "</button>" +
          "</div>" +
          '<div class="btn-row" style="margin-top:12px">' +
            '<button class="btn ghost" id="to-list">전체 목록</button>' +
          "</div>" +
          (last ? '<button class="btn" id="to-quiz" style="margin-top:4px">학습 완료 — 암기 시험 시작</button>' : "");

        Speech.bindAll(body);
        body.querySelector("#fc").addEventListener("click", function () {
          showMeaning = !showMeaning; render();
        });
        body.querySelector("#prev").addEventListener("click", function (e) {
          e.stopPropagation(); cardIdx -= 1; showMeaning = false; render();
        });
        body.querySelector("#nx").addEventListener("click", function () {
          cardIdx = last ? 0 : cardIdx + 1; showMeaning = false; render();
        });
        body.querySelector("#to-list").addEventListener("click", function () { listMode = true; render(); });
        const toQuiz = body.querySelector("#to-quiz");
        if (toQuiz) toQuiz.addEventListener("click", next);
      }
      render();
    }

    function finishDay() {
      state.completedCount += 1;
      repo.saveState(state);
      const weekly = state.pendingWeeklyWeek;
      app.el.innerHTML =
        app.topbarHTML("홈") +
        '<div class="card center" style="padding:30px 18px">' +
          '<div class="result-score">Day <span class="hl">' + day + "</span></div>" +
          '<p style="font-weight:700">오늘 학습 완료!</p>' +
          '<p class="muted">내일 Day ' + state.currentDay + "에서 만나요.</p>" +
        "</div>" +
        (weekly
          ? '<div class="weekly-banner"><p>' + weekly + "주차 주간시험이 열렸습니다 (랜덤 50문제)</p>" +
            '<button class="btn small" id="go-weekly">지금 응시</button></div>'
          : "") +
        '<button class="btn secondary" id="go-home">홈으로</button>';
      app.bindBack("home");
      app.el.querySelector("#go-home").addEventListener("click", function () { app.navigate("home"); });
      const gw = app.el.querySelector("#go-weekly");
      if (gw) gw.addEventListener("click", function () { startWeeklyQuiz(app); });
    }

    runStep();
  }

  /* ---------- 주간시험 ---------- */
  function startWeeklyQuiz(app) {
    const repo = app.repo;
    const state = app.state;
    const week = state.pendingWeeklyWeek;
    if (!week) { app.navigate("home"); return; }

    const learned = repo.getWordsUpToDay(state.completedCount);
    const target = Quiz.sample(learned, Math.min(50, learned.length));
    const questions = Quiz.buildWordQuiz(target, repo.getAllWords());

    app.el.innerHTML = app.topbarHTML("홈") + '<div id="weekly-body"></div>';
    app.bindBack("home");
    Quiz.renderQuiz(app.el.querySelector("#weekly-body"), {
      title: week + "주차 주간시험",
      questions: questions,
      onFinish: function (r) {
        const wrongIds = r.wrongItems.map(function (w) { return w.id; });
        if (wrongIds.length) repo.recordWrong(wrongIds, "weekly");
        repo.addResult(new M.QuizResult({
          quizType: "weekly", day: week, score: r.score, total: r.total, wrongItemIds: wrongIds,
        }));
        state.weeklyDoneCount += 1;
        repo.saveState(state);
        app.navigate("home");
      },
    });
  }

  window.Features.Study = {
    startDailyFlow: startDailyFlow,
    startWeeklyQuiz: startWeeklyQuiz,
  };
})();
