/* ============================================================
 * 앱 상태 관련 모델
 *  - AppState     : 진행 상태 (몇 일차까지 완료했는지 등)
 *  - WrongNote    : 오답노트 항목
 *  - QuizResult   : 시험 결과 기록
 * 저장은 JSON, 코드 내 사용은 클래스.
 * ============================================================ */
(function () {
  "use strict";

  class AppState {
    constructor(p) {
      p = p || {};
      this.startDate = p.startDate || new Date().toISOString().slice(0, 10);
      this.completedCount = p.completedCount || 0;   // 완료한 Day 수
      this.weeklyDoneCount = p.weeklyDoneCount || 0; // 응시한 주간시험 수
    }
    /** 오늘 학습할 Day (완료한 다음 날) */
    get currentDay() {
      return this.completedCount + 1;
    }
    /** 응시 가능한 주간시험 주차. 없으면 0 */
    get pendingWeeklyWeek() {
      const weeks = Math.floor(this.completedCount / 7);
      return weeks > this.weeklyDoneCount ? this.weeklyDoneCount + 1 : 0;
    }
    static fromJSON(obj) { return new AppState(obj); }
    toJSON() {
      return {
        startDate: this.startDate,
        completedCount: this.completedCount,
        weeklyDoneCount: this.weeklyDoneCount,
      };
    }
  }

  class WrongNote {
    constructor(p) {
      this.itemId = p.itemId;
      this.wrongCount = p.wrongCount || 1;
      this.lastWrongDate = p.lastWrongDate || new Date().toISOString().slice(0, 10);
      this.sources = Array.isArray(p.sources) ? p.sources : []; // 어떤 시험에서 틀렸는지
    }
    get isFrequent() { return this.wrongCount >= 2; }
    static fromJSON(obj) { return new WrongNote(obj); }
    toJSON() {
      return {
        itemId: this.itemId,
        wrongCount: this.wrongCount,
        lastWrongDate: this.lastWrongDate,
        sources: this.sources,
      };
    }
  }

  class QuizResult {
    constructor(p) {
      this.id = p.id || "r-" + Date.now();
      this.quizType = p.quizType;           // "review7" | "review1" | "today" | "weekly" | "retry"
      this.day = p.day || null;             // 관련 Day (주간시험이면 주차)
      this.date = p.date || new Date().toISOString().slice(0, 10);
      this.score = p.score;
      this.total = p.total;
      this.wrongItemIds = Array.isArray(p.wrongItemIds) ? p.wrongItemIds : [];
    }
    static fromJSON(obj) { return new QuizResult(obj); }
    toJSON() {
      return {
        id: this.id,
        quizType: this.quizType,
        day: this.day,
        date: this.date,
        score: this.score,
        total: this.total,
        wrongItemIds: this.wrongItemIds,
      };
    }
  }

  window.Models.AppState = AppState;
  window.Models.WrongNote = WrongNote;
  window.Models.QuizResult = QuizResult;
})();
