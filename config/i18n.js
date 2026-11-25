var RU = /^(ru|uk|be|kk)\b/i.test(navigator.language || "");

function tr(ru, en) {
  return RU ? ru : en;
}

document.documentElement.lang = RU ? "ru" : "en";
document.addEventListener("DOMContentLoaded", function () {
  if (RU) return;
  document.querySelectorAll("[data-en]").forEach(function (e) {
    e.textContent = e.dataset.en;
  });
  document.querySelectorAll("[data-en-title]").forEach(function (e) {
    e.title = e.dataset.enTitle;
  });
});
