/* ============================================================
 * LocalStorageProvider — 브라우저 localStorage 구현체
 * ============================================================ */
(function () {
  "use strict";

  const StorageProvider = window.Storage2.StorageProvider;

  class LocalStorageProvider extends StorageProvider {
    get(key) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : JSON.parse(raw);
      } catch (e) {
        console.error("저장소 읽기 실패:", key, e);
        return null;
      }
    }
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("저장소 쓰기 실패:", key, e);
        alert("저장 공간이 가득 찼거나 저장에 실패했습니다. 백업 후 데이터를 정리해 주세요.");
      }
    }
    remove(key) {
      localStorage.removeItem(key);
    }
  }

  window.Storage2.LocalStorageProvider = LocalStorageProvider;
})();
