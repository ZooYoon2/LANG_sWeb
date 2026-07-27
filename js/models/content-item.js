/* ============================================================
 * ContentItem — 모든 학습 콘텐츠(단어/문법/토익문제)의 부모 클래스
 * 새 콘텐츠 타입 추가 시 이 클래스를 상속한다.
 * ============================================================ */
(function () {
  "use strict";

  class ContentItem {
    /**
     * @param {Object} p
     * @param {string} p.id        고유 ID
     * @param {string} p.type      "word" | "grammar" | "toeic" ...
     * @param {string[]} [p.tags]  분류 태그
     * @param {string} [p.createdAt] ISO 날짜
     */
    constructor(p) {
      this.id = p.id;
      this.type = p.type;
      this.tags = Array.isArray(p.tags) ? p.tags : [];
      this.createdAt = p.createdAt || new Date().toISOString();
    }

    toJSON() {
      return {
        id: this.id,
        type: this.type,
        tags: this.tags,
        createdAt: this.createdAt,
      };
    }
  }

  window.Models = window.Models || {};
  window.Models.ContentItem = ContentItem;
})();
