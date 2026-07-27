/* ============================================================
 * StorageProvider — 저장소 추상 인터페이스
 * 지금은 LocalStorageProvider 하나지만, 나중에 Firebase 등
 * 클라우드 저장소로 교체할 때 이 인터페이스만 구현하면 된다.
 * (개인 홈페이지 + API 연동 확장을 대비한 결합도 분리)
 * ============================================================ */
(function () {
  "use strict";

  class StorageProvider {
    /** @param {string} key @returns {Object|null} 파싱된 JSON */
    get(key) { throw new Error("StorageProvider.get 미구현"); }
    /** @param {string} key @param {Object} value JSON 직렬화 가능한 값 */
    set(key, value) { throw new Error("StorageProvider.set 미구현"); }
    /** @param {string} key */
    remove(key) { throw new Error("StorageProvider.remove 미구현"); }
  }

  window.Storage2 = window.Storage2 || {};
  window.Storage2.StorageProvider = StorageProvider;
})();
