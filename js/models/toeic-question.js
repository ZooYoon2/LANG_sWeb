/* ============================================================
 * ToeicQuestion — 토익 문제 콘텐츠 (ContentItem 상속, 확장 타입)
 * ============================================================ */
(function () {
  "use strict";

  const ContentItem = window.Models.ContentItem;

  class ToeicQuestion extends ContentItem {
    /**
     * @param {Object} p
     * @param {string} p.question     문제 지문
     * @param {string[]} p.choices    보기 (4개 권장)
     * @param {number} p.answer      정답 보기 인덱스 (0부터)
     * @param {string} [p.explanation] 해설
     */
    constructor(p) {
      super({ id: p.id, type: "toeic", tags: p.tags, createdAt: p.createdAt });
      this.question = p.question;
      this.choices = Array.isArray(p.choices) ? p.choices : [];
      this.answer = p.answer;
      this.explanation = p.explanation || "";
    }

    static fromJSON(obj) {
      return new ToeicQuestion(obj);
    }

    toJSON() {
      return Object.assign(super.toJSON(), {
        question: this.question,
        choices: this.choices,
        answer: this.answer,
        explanation: this.explanation,
      });
    }

    static validatePackItem(obj, idx) {
      if (!obj || typeof obj !== "object") return idx + "번 항목이 객체가 아닙니다.";
      if (typeof obj.question !== "string" || !obj.question.trim()) return idx + "번 항목: question이 없습니다.";
      if (!Array.isArray(obj.choices) || obj.choices.length < 2) return idx + "번 항목: choices는 2개 이상 필요합니다.";
      if (typeof obj.answer !== "number" || obj.answer < 0 || obj.answer >= obj.choices.length)
        return idx + "번 항목: answer 인덱스가 잘못되었습니다.";
      return null;
    }
  }

  window.Models.ToeicQuestion = ToeicQuestion;
})();
