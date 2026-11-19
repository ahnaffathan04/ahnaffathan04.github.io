/* Navigation, keyboard control, name lettering and optional sound.
   No network requests are made from this file. */
(function () {
  "use strict";

  var screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));
  var items = Array.prototype.slice.call(document.querySelectorAll(".menu a"));
  var wipe = document.getElementById("wipe");
  var soundBtn = document.getElementById("sound");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = "home";
  var sel = 0;
  var busy = false;

  /* ---------- name lettering: each letter gets one of five cut-out styles ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-ransom]"), function (el, w) {
    var text = el.getAttribute("data-ransom");
    for (var i = 0; i < text.length; i++) {
      var letter = document.createElement("i");
      letter.className = "r" + ((i * 3 + w * 2) % 5);
      letter.textContent = text.charAt(i);
      letter.setAttribute("aria-hidden", "true");
      el.appendChild(letter);
    }
  });

  /* ---------- sound: short generated tones, off until the visitor turns it on ---------- */
  var soundOn = false;
  var audio = null;
  try { soundOn = localStorage.getItem("sound") === "on"; } catch (e) {}
  function paintSound() {
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.textContent = soundOn ? "Sound on" : "Sound off";
  }
  function blip(freq, length) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + length);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(); osc.stop(audio.currentTime + length);
    } catch (e) {}
  }
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    try { localStorage.setItem("sound", soundOn ? "on" : "off"); } catch (e) {}
    paintSound();
    blip(880, 0.09);
  });
  paintSound();

  /* ---------- menu selection ---------- */
  function select(i, quiet) {
    var next = (i + items.length) % items.length;
    var changed = next !== sel;
    sel = next;
    items.forEach(function (a, j) { a.classList.toggle("sel", j === sel); });
    if (changed && !quiet) blip(620, 0.05);
  }
  items.forEach(function (a, i) {
    a.addEventListener("mouseenter", function () { select(i); });
    a.addEventListener("focus", function () { select(i); });
  });

  /* ---------- screens ---------- */
  function swap(id) {
    screens.forEach(function (s) { s.classList.toggle("active", s.id === id); });
    current = id;
    window.scrollTo(0, 0);
    if (id === "home") {
      items[sel].focus({ preventScroll: true });
    } else {
      var heading = document.querySelector("#" + id + " h2");
      if (heading) heading.focus({ preventScroll: true });
    }
  }
  function go(id) {
    if (id === current || busy) return;
    if (id !== "home") {
      items.forEach(function (a, i) { if (a.hash === "#" + id) select(i, true); });
    }
    blip(id === "home" ? 330 : 990, 0.12);
    if (reduceMotion) { swap(id); return; }
    busy = true;
    wipe.classList.remove("run");
    void wipe.offsetWidth; // restart the animation
    wipe.classList.add("run");
    setTimeout(function () { swap(id); }, 270);
    setTimeout(function () { wipe.classList.remove("run"); busy = false; route(); }, 580);
  }
  function route() {
    var id = (location.hash || "#home").slice(1);
    var target = document.getElementById(id);
    if (!target || !target.classList.contains("screen")) id = "home";
    go(id);
  }
  window.addEventListener("hashchange", route);

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (current === "home") {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        select(sel + (e.key === "ArrowDown" ? 1 : -1));
        items[sel].focus({ preventScroll: true });
      } else if (e.key === "Enter" && document.activeElement === document.body) {
        location.hash = items[sel].hash;
      }
    } else if (e.key === "Escape") {
      location.hash = "#home";
    }
  });

  /* ---------- first paint: open the linked section directly, no animation ---------- */
  select(0, true);
  var first = (location.hash || "#home").slice(1);
  var firstEl = document.getElementById(first);
  if (first !== "home" && firstEl && firstEl.classList.contains("screen")) {
    items.forEach(function (a, i) { if (a.hash === "#" + first) select(i, true); });
    screens.forEach(function (s) { s.classList.toggle("active", s.id === first); });
    current = first;
  }
})();
