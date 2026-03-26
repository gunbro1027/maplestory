const API_KEY = 'test_3c3ee9fcdbd9086a0a45c03537bc6180dd75379c7870ebbf5ce789b00a0d90e6efe8d04e6d233bd35cf2fabdeb93fb0d';
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1';
const headers = { 'x-nxopen-api-key': API_KEY };

// 어제 날짜 (API는 전날 데이터 제공)
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── 검색 ──────────────────────────────────────
document.getElementById('char-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchCharacter();
});

function searchCharacter() {
  const name = document.getElementById('char-input').value.trim();
  if (!name) return;
  try { sessionStorage.setItem('charName', name); } catch(e) {}
  window.location.href = 'character.html';
}

