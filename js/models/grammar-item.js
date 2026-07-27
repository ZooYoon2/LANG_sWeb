/* ============================================================
 * GrammarItem — 문법 콘텐츠 (ContentItem 상속, 확장 타입)
 * ============================================================ */
(function () {
  "use strict";

  const ContentItem = window.Models.ContentItem;

  class GrammarItem extends ContentItem {
    /**
     * @param {Object} p
     * @param {string} p.title        문법 항목 제목 (예: "가정법 과거")
     * @param {string} p.explanation  설명
     * @param {string[]} [p.examples] 예문 목록
     */
    constructor(p) {
      super({ id: p.id, type: "grammar", tags: p.tags, createdAt: p.createdAt });
      this.title = p.title;
      this.explanation = p.explanation;
      this.examples = Array.isArray(p.examples) ? p.examples : [];
    }

    static fromJSON(obj) {
      return new GrammarItem(obj);
    }

    toJSON() {
      return Object.assign(super.toJSON(), {
        title: this.title,
        explanation: this.explanation,
        examples: this.examples,
      });
    }

    static validatePackItem(obj, idx) {
      if (!obj || typeof obj !== "object") return idx + "번 항목이 객체가 아닙니다.";
      if (typeof obj.title !== "string" || !obj.title.trim()) return idx + "번 항목: title이 없습니다.";
      if (typeof obj.explanation !== "string" || !obj.explanation.trim()) return idx + "번 항목: explanation이 없습니다.";
      return null;
    }
  }

  window.Models.GrammarItem = GrammarItem;
})();
