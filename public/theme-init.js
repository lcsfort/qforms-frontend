(function () {
  try {
    var t = localStorage.getItem("qforms-theme");
    document.documentElement.classList.toggle("dark", t === "dark");
  } catch (_) {}
})();
