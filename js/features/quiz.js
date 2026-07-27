/* ============================================================
 * Quiz — 시험 기능
 *  - buildWordQuiz : 단어 목록 → 문제 배열 (절반 4지선다, 절반 타이핑)
 *  - renderQuiz    : 재사용 가능한 시험 화면 (일일/주간/오답 재시험 공용)
 * 새 콘텐츠 타입의 시험이 필요하면 build 함수를 추가하는 구조.
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 유틸 ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function sample(arr, n) {
    return shuffle(arr).slice(0, n);
  }
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  /* ---------- 문제 생성 ---------- */
  /**
   * 단어 시험 문제 생성. 절반은 [영→뜻 4지선다], 절반은 [뜻→영 타이핑]
   * @param {WordEntry[]} words      출제 대상
   * @param {WordEntry[]} pool       오답 보기를 뽑을 전체 풀
   * @returns {Array} questions
   */
  function buildWordQuiz(words, pool) {
    const shuffled = shuffle(words);
    const half = Math.ceil(shuffled.length / 2);
    const questions = shuffled.map((w, idx) => {
      if (idx < half) {
        // 영→뜻 4지선다
        const wrongMeanings = sample(
          pool.filter((p) => p.id !== w.id && p.meaning !== w.meaning),
          3
        ).map((p) => p.meaning);
        const choices = shuffle([w.meaning].concat(wrongMeanings));
        return {
          kind: "mc",
          item: w,
          prompt: w.word,
          choices: choices,
          answerIndex: choices.indexOf(w.meaning),
        };
      }
      // 뜻→영 타이핑
      return {
        kind: "type",
        item: w,
        prompt: w.meaning,
        answerText: w.word,
      };
    });
    return shuffle(questions);
  }

  /* ---------- 시험 화면 (재사용 컴포넌트) ---------- */
  /**
   * @param {HTMLElement} container
   * @param {Object} cfg
   * @param {string} cfg.title            시험 이름
   * @param {Array}  cfg.questions        buildWordQuiz 결과
   * @param {Function} cfg.onFinish       (result:{score,total,wrongItems:WordEntry[]}) => void
   */
  function renderQuiz(container, cfg) {
    let idx = 0;
    let score = 0;
    const wrongItems = [];

    function renderQuestion() {
      const q = cfg.questions[idx];
      const isMC = q.kind === "mc";
      container.innerHTML =
        '<div class="quiz-head">' +
          '<span class="t">' + esc(cfg.title) + "</span>" +
          '<span class="p">' + (idx + 1) + " / " + cfg.questions.length + "</span>" +
        "</div>" +
        '<div class="card q-card">' +
          '<div class="q-prompt-label">' + (isMC ? "이 단어의 뜻은?" : "이 뜻의 영단어를 입력") + "</div>" +
          '<div class="q-prompt' + (isMC ? "" : " kr") + '">' + esc(q.prompt) + "</div>" +
          (q.item.posLabel ? '<span class="chip pos">' + esc(q.item.posLabel) + "</span>" : "") +
          (isMC
            ? '<ul class="choices">' +
                q.choices.map(function (c, i) {
                  return '<li><button data-i="' + i + '">' + esc(c) + "</button></li>";
                }).join("") +
              "</ul>"
            : '<div class="type-box">' +
                '<input type="text" id="type-answer" autocomplete="off" autocapitalize="off" ' +
                'autocorrect="off" spellcheck="false" placeholder="영단어 입력">' +
              "</div>") +
          '<div id="q-feedback"></div>' +
        "</div>" +
        '<button class="btn" id="q-next" disabled>다음</button>';

      const nextBtn = container.querySelector("#q-next");
      const feedback = container.querySelector("#q-feedback");

      function finishQuestion(correct, correctLabel) {
        const Speech = window.Features.Speech;
        const listenHTML = " " + Speech.buttonHTML(q.item.word); // 채점 후에만 노출
        if (correct) {
          score += 1;
          feedback.innerHTML = '<div class="feedback ok">정답!' + listenHTML + "</div>";
        } else {
          wrongItems.push(q.item);
          feedback.innerHTML =
            '<div class="feedback no">오답 — 정답: <span class="ans">' + esc(correctLabel) + "</span>" +
            listenHTML + "</div>";
        }
        Speech.bindAll(feedback);
        nextBtn.disabled = false;
        nextBtn.textContent = idx + 1 === cfg.questions.length ? "결과 보기" : "다음";
        nextBtn.focus();
      }

      if (isMC) {
        container.querySelectorAll(".choices button").forEach(function (btn) {
          btn.addEventListener("click", function () {
            const chosen = parseInt(btn.dataset.i, 10);
            container.querySelectorAll(".choices button").forEach(function (b, i) {
              b.disabled = true;
              if (i === q.answerIndex) b.classList.add("correct");
            });
            if (chosen !== q.answerIndex) btn.classList.add("wrong");
            finishQuestion(chosen === q.answerIndex, q.choices[q.answerIndex]);
          });
        });
      } else {
        const input = container.querySelector("#type-answer");
        input.focus();
        function submit() {
          if (input.disabled) return;
          const val = input.value.trim().toLowerCase();
          if (!val) return;
          input.disabled = true;
          const ok = val === q.answerText.trim().toLowerCase();
          finishQuestion(ok, q.answerText);
        }
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") submit();
        });
        // 입력 후 화면 아무 곳 대신 명시적 확인 버튼 제공
        const box = container.querySelector(".type-box");
        const okBtn = document.createElement("button");
        okBtn.className = "btn small";
        okBtn.style.marginTop = "10px";
        okBtn.textContent = "확인";
        okBtn.addEventListener("click", submit);
        box.appendChild(okBtn);
      }

      nextBtn.addEventListener("click", function () {
        idx += 1;
        if (idx < cfg.questions.length) renderQuestion();
        else renderResult();
      });
    }

    function renderResult() {
      const total = cfg.questions.length;
      container.innerHTML =
        '<div class="quiz-head"><span class="t">' + esc(cfg.title) + " 결과</span></div>" +
        '<div class="card center">' +
          '<div class="result-score"><span class="hl">' + score + "</span> / " + total + "</div>" +
          '<p class="muted">' + (wrongItems.length ? "틀린 단어는 오답노트에 기록됩니다." : "전부 정답! 완벽합니다.") + "</p>" +
        "</div>" +
        (wrongItems.length
          ? '<div class="card"><p class="muted" style="margin-bottom:6px">틀린 단어</p><ul class="wrong-list">' +
              wrongItems.map(function (w) {
                return "<li>" + window.Features.Speech.buttonHTML(w.word) +
                  "<span class='w'>" + esc(w.word) + "</span><span class='m'>" + esc(w.meaning) + "</span></li>";
              }).join("") +
            "</ul></div>"
          : "") +
        '<button class="btn" id="q-done">계속</button>';
      window.Features.Speech.bindAll(container);
      container.querySelector("#q-done").addEventListener("click", function () {
        cfg.onFinish({ score: score, total: total, wrongItems: wrongItems });
      });
    }

    renderQuestion();
  }

  window.Features = window.Features || {};
  window.Features.Quiz = {
    buildWordQuiz: buildWordQuiz,
    renderQuiz: renderQuiz,
    shuffle: shuffle,
    sample: sample,
  };
})();
