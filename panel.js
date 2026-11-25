(function () {
  var id = config.gameId;
  var panel = el("div", "", { id: "panel", hidden: true });
  var box = el("div", "panel-box", { tabIndex: -1 });
  var skBar = el("div", "kai-softkeys", { id: "panel-softkeys" });
  var skLeft = el("span", "sk-l");
  var skCenter = el("span", "sk-c");
  var skRight = el("span", "sk-r");
  var toast = el("div", "", { id: "kaios-toast", hidden: true });

  append(skBar, skLeft, skCenter, skRight);
  append(panel, box, skBar);
  append(document.body, panel, toast);

  var startSize = null, btKey = "", btStatus = null, page = "main";
  var state = Settings.resolve(id);
  var focusTargetKey = null;
  var toastTimer = 0;

  function el(tag, cls, props) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (props) Object.keys(props).forEach(function (k) { e[k] = props[k]; });
    return e;
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i++) {
      var child = arguments[i];
      if (child != null) {
        parent.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      }
    }
    return parent;
  }

  function txt(tag, cls, text) {
    return el(tag, cls, { textContent: text });
  }

  function queryParam(name) {
    var q = location.search;
    if (!q || q.length < 2) return null;
    var parts = q.slice(1).split("&");
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf("=");
      var k = decodeURIComponent((eq >= 0 ? parts[i].slice(0, eq) : parts[i]).replace(/\+/g, " "));
      if (k === name) return eq >= 0 ? decodeURIComponent(parts[i].slice(eq + 1).replace(/\+/g, " ")) : "";
    }
    return null;
  }

  function pretty(s) {
    return s ? s.replace("x", " × ") : tr("По окну", "Window");
  }

  function canvasSize() {
    var c = document.getElementById("canvas");
    return c.width + "x" + c.height;
  }

  function save(key, value) {
    Settings.setGame(id, key, value);
    state = Settings.resolve(id);
  }

  function setScreen(mode, size) {
    config.screenMode = mode;
    if (mode === "manual") config.screen = size;
    save("screen", mode === "manual" ? size : mode);
    ScreenSetup.apply();
    render();
  }

  var apply = {
    scale: function (v) {
      config.scaleMode = v === "101" ? "stretch" : v === "100" ? "fit" : "num";
      config.scale = parseFloat(v) || 1;
      ScreenSetup.refit();
    },
    rotate: function (v) {
      config.rotate = v | 0;
      ScreenSetup.refit();
    },
    fps: function (v) {
      config.fps = v | 0;
    },
    jit: function () {
      location.reload();
    },
    platform: function () {
      location.reload();
    }
  };

  function showToast(text, ms) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = text;
    toast.hidden = false;
    toastTimer = setTimeout(function () {
      toast.hidden = true;
      toastTimer = 0;
    }, ms || 2600);
  }

  function scrollIntoBox(target) {
    if (!target || !box) return;
    var bRect = box.getBoundingClientRect();
    var tRect = target.getBoundingClientRect();
    if (tRect.top < bRect.top + 4) box.scrollTop -= (bRect.top + 4 - tRect.top);
    else if (tRect.bottom > bRect.bottom - 32) box.scrollTop += (tRect.bottom - (bRect.bottom - 32));
  }

  function focusables() {
    var list = Array.prototype.slice.call(box.querySelectorAll(".kai-item:not(.disabled), select:not(:disabled), input:not(:disabled)"));
    return list.filter(function (node) { return node.offsetParent !== null; });
  }

  function setFocusEl(target) {
    var list = focusables();
    for (var i = 0; i < list.length; i++) list[i].classList.remove("kbd-focus");
    if (!target) return;
    target.classList.add("kbd-focus");
    if (target.dataset && target.dataset.fk) focusTargetKey = target.dataset.fk;
    scrollIntoBox(target);
    if (target.focus) {
      try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
    }
  }

  function restoreFocus() {
    var list = focusables();
    if (!list.length) return;
    var match = null;
    if (focusTargetKey) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].dataset && list[i].dataset.fk === focusTargetKey) {
          match = list[i];
          break;
        }
      }
    }
    setFocusEl(match || list[0]);
  }

  function kaiItem(label, fk, cls, fn) {
    var item = el("div", "kai-item" + (cls ? " " + cls : ""), { tabIndex: 0, textContent: label });
    item.dataset.fk = fk;
    item._activate = fn;
    item.addEventListener("click", function (e) {
      e.preventDefault();
      fn(item);
    });
    return item;
  }

  function updateSoftkeys() {
    if (page === "props") {
      skLeft.textContent = tr("Назад", "Back");
      skCenter.textContent = tr("ВЫБРАТЬ", "SELECT");
      skRight.textContent = tr("Закрыть", "Close");
    } else {
      skLeft.textContent = tr("Файлы", "Files");
      skCenter.textContent = tr("ВЫБРАТЬ", "SELECT");
      skRight.textContent = tr("Закрыть", "Close");
    }
  }

  function head(title, sub) {
    var r = ScreenSetup.result();
    var h = el("div", "pb-head");
    var t = el("div", "pb-title");
    append(t,
      txt("b", "", title || (r && r.name) || config.jars.replace(/^.*[\/:]/, "").replace(/\.jar$/i, "")),
      txt("span", "", sub || tr("Настройки игры · Вызов/RSK — закрыть", "Game settings · Call/RSK — close")));
    h.appendChild(t);
    return h;
  }

  function go(v) {
    page = v;
    focusTargetKey = null;
    box.scrollTop = 0;
    render();
  }

  function back() {
    if (page !== "main") go("main");
    else toggle(false);
  }

  function propDefault(key) {
    var v = typeof systemProperty === "function" ? systemProperty(key) : null;
    return v == null ? "" : String(v);
  }

  function propsChanged() {
    return JSON.stringify(Settings.props(id)) !== JSON.stringify(config.props || {});
  }

  function propRow(key, own) {
    var row = el("label", "prop");
    var name = el("span", "opt-name");
    name.appendChild(txt("span", "prop-key", key));
    if (key in own) name.appendChild(txt("span", "own-tag", tr("своё", "custom")));
    var def = propDefault(key);
    var input = el("input", "", { value: key in own ? own[key] : "", placeholder: def || tr("не задано", "not set"), spellcheck: false, autocomplete: "off", autocapitalize: "none" });
    input.dataset.fk = "prop:" + key;
    input.addEventListener("change", function () {
      Settings.setProp(id, key, input.value === "" ? null : input.value);
      render();
    });
    append(row, name, input);
    return row;
  }

  function propsView() {
    var own = Settings.props(id);
    var keys = Settings.sysprops.slice();
    Object.keys(own).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    var sec = el("section");
    if (propsChanged()) {
      var bar = el("div", "restart");
      bar.appendChild(txt("span", "", tr("Свойства применятся после перезапуска игры.", "Properties apply after the game restarts.")));
      bar.appendChild(kaiItem(tr("Перезапустить игру", "Restart game"), "props:restart", "kai-btn", function () { location.reload(); }));
      sec.appendChild(bar);
    }
    var list = el("div", "props");
    keys.forEach(function (k) { list.appendChild(propRow(k, own)); });
    sec.appendChild(list);

    var add = el("form", "prop-add");
    var k = el("input", "", { placeholder: tr("Свойство", "Property"), spellcheck: false, autocomplete: "off", autocapitalize: "none" });
    k.dataset.fk = "prop-add:k";
    var v = el("input", "", { placeholder: tr("Значение", "Value"), spellcheck: false, autocomplete: "off", autocapitalize: "none" });
    v.dataset.fk = "prop-add:v";
    var submitAdd = function () {
      var key = k.value.trim();
      if (!key) { setFocusEl(k); return; }
      Settings.setProp(id, key, v.value);
      render();
    };
    add.addEventListener("submit", function (e) { e.preventDefault(); submitAdd(); });
    append(add, k, v, kaiItem(tr("Добавить свойство", "Add property"), "prop-add:ok", "kai-btn", submitAdd));
    append(sec, txt("h3", "", tr("Своё свойство", "Custom property")), add);
    append(box, head(tr("Системные свойства", "System properties"), tr("LSK/Esc — назад · RSK — закрыть", "LSK/Esc — back · RSK — close")), sec);

    if (Object.keys(own).length) {
      var f = el("div", "pb-foot");
      f.appendChild(kaiItem(tr("Сбросить все свойства", "Reset all properties"), "props:reset", "kai-btn ghost", function (item) {
        if (!item.classList.contains("confirm")) {
          item.classList.add("confirm");
          item.textContent = tr("Точно сбросить? (OK)", "Confirm reset? (OK)");
          return;
        }
        Settings.resetProps(id);
        render();
      }));
      box.appendChild(f);
    }
  }

  function screenSection() {
    var sec = el("section");
    var r = ScreenSetup.result();
    var curSize = config.screenMode === "fit" ? canvasSize() : ScreenSetup.current();
    var src = config.urlLocked.screen ? tr("Задано в URL", "Set in URL")
      : config.screenMode === "manual" ? tr("Выбрано вручную", "Manual")
      : config.screenMode === "fit" ? tr("По окну", "Fit window")
      : !r ? tr("Определяется…", "Detecting…")
      : tr("Авто", "Auto");

    var now = el("div", "scr-now");
    append(now, txt("div", "scr-size", pretty(curSize)), txt("div", "scr-src", src));

    var row = el("label", "opt");
    row.appendChild(txt("span", "opt-name", tr("Разрешение игры", "Game resolution")));
    var sel = el("select");
    sel.dataset.fk = "scr:select";

    var items = [
      ["auto", tr("Автоопределение", "Auto detect")],
      ["fit", tr("По экрану устройства", "Fit device window")],
      ["128x128", "128 × 128"],
      ["128x160", "128 × 160"],
      ["176x208", "176 × 208"],
      ["176x220", "176 × 220"],
      ["208x208", "208 × 208"],
      ["240x320", "240 × 320"],
      ["320x240", "320 × 240"],
      ["352x416", "352 × 416"],
      ["360x640", "360 × 640"],
      ["400x240", "400 × 240"]
    ];
    if (r && r.candidates) {
      r.candidates.forEach(function (c) {
        if (!items.some(function (it) { return it[0] === c.size; })) {
          items.push([c.size, pretty(c.size)]);
        }
      });
    }
    if (r && r.observed && !items.some(function (it) { return it[0] === r.observed; })) {
      items.push([r.observed, pretty(r.observed)]);
    }

    var currentKey = config.screenMode === "manual" ? config.screen : config.screenMode;
    if (config.screenMode === "manual" && !items.some(function (it) { return it[0] === currentKey; })) {
      items.push([currentKey, pretty(currentKey)]);
    }

    items.forEach(function (it) {
      sel.appendChild(el("option", "", { value: it[0], textContent: it[1] }));
    });
    sel.value = currentKey;
    sel.disabled = !!config.urlLocked.screen;
    sel.addEventListener("change", function () {
      var v = sel.value;
      if (v === "auto" || v === "fit") setScreen(v);
      else setScreen("manual", v);
    });
    row.appendChild(sel);

    append(sec, txt("h3", "", tr("Экран (Keyscreen)", "Screen (Keyscreen)")), now, row);

    if (!config.urlLocked.screen) {
      var cur = Settings.parse(config.screen) || [240, 320];
      var cForm = el("form", "custom");
      var w = el("input", "", { type: "tel", value: String(cur[0]), inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 });
      w.dataset.fk = "custom:w";
      var h = el("input", "", { type: "tel", value: String(cur[1]), inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 });
      h.dataset.fk = "custom:h";
      var applyCustom = function () {
        var a = Math.max(64, Math.min(2048, parseInt(w.value, 10) || 240));
        var b = Math.max(64, Math.min(2048, parseInt(h.value, 10) || 320));
        setScreen("manual", a + "x" + b);
      };
      cForm.addEventListener("submit", function (e) { e.preventDefault(); applyCustom(); });
      append(cForm,
        w, txt("span", "", "×"), h,
        kaiItem("⇄", "custom:swap", "ghost", function () { setScreen("manual", cur[1] + "x" + cur[0]); }),
        kaiItem(tr("Задать", "Set"), "custom:ok", "kai-btn", applyCustom));
      sec.appendChild(cForm);
    }

    if (startSize && startSize !== canvasSize()) {
      var bar = el("div", "restart");
      bar.appendChild(txt("span", "", tr("Запущено в " + pretty(startSize) + ". Перезапустите для нового размера.", "Started at " + pretty(startSize) + ". Restart to apply.")));
      bar.appendChild(kaiItem(tr("Перезапустить игру", "Restart game"), "scr:restart", "kai-btn", function () { location.reload(); }));
      sec.appendChild(bar);
    }

    return sec;
  }

  function selects() {
    var wrap = el("div", "opts");
    ["scale", "rotate", "fps", "jit", "platform"].forEach(function (key) {
      var opt = Settings.options[key];
      var row = el("label", "opt");
      var name = el("span", "opt-name");
      name.appendChild(txt("span", "", opt.label));
      if (state.own[key]) name.appendChild(txt("span", "own-tag", tr("своё", "custom")));

      var sel = el("select");
      sel.dataset.fk = "opt:" + key;
      opt.items.forEach(function (it) {
        sel.appendChild(el("option", "", { value: it[0], textContent: it[1] }));
      });
      if (config.urlLocked[key]) {
        sel.value = key === "jit" ? (config.jit ? "1" : "0") : key === "platform" ? (queryParam("platform") || "") : String(config[key]);
      } else {
        sel.value = state.values[key];
      }
      sel.disabled = !!config.urlLocked[key];
      sel.addEventListener("change", function () {
        save(key, sel.value);
        apply[key](sel.value);
        render();
      });
      append(row, name, sel);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function linkText(st) {
    var link = !st.peers ? tr("нет связи", "no connection") : st.via === "P2P" ? "P2P" : st.via === "TURN" ? "TURN" : tr("сервер", "server");
    return tr("Игроков: ", "Players: ") + st.peers + " · " + link + (st.via && st.rtt ? " · " + st.rtt + " ms" : "");
  }

  function roomKey(st) {
    return st.room ? [st.room.mode, st.room.room, st.room.pass].join("\n") : "";
  }

  function bluetooth() {
    var st = BtRoom.state();
    btKey = roomKey(st);
    btStatus = null;
    if (!st.room) return null;
    var sec = el("section");
    var info = el("div", "bt-info");
    if (st.room.mode === "near") {
      info.appendChild(txt("b", "", tr("Рядом", "Nearby")));
    } else {
      [[tr("Комната", "Room"), st.room.room], [tr("Пароль", "Password"), st.room.pass]].forEach(function (p) {
        var line = el("div", "bt-line");
        append(line, txt("span", "muted", p[0]), txt("b", "bt-sel", p[1]));
        info.appendChild(line);
      });
    }
    btStatus = txt("span", "muted", linkText(st));
    info.appendChild(btStatus);
    var actions = el("div", "bt-actions");
    actions.appendChild(kaiItem(tr("Сменить комнату", "Change room"), "bt:change", "kai-btn ghost", function () {
      toggle(false);
      BtRoom.change();
    }));
    if (st.room.mode !== "near") {
      actions.appendChild(kaiItem(tr("Скопировать", "Copy"), "bt:copy", "kai-btn ghost", function (item) { BtRoom.copy(item); }));
    }
    append(sec, txt("h3", "", tr("Сетевая игра", "Multiplayer")), info, actions);
    return sec;
  }

  function footer() {
    var f = el("div", "pb-foot");
    f.appendChild(kaiItem(tr("Сбросить настройки игры", "Reset game settings"), "foot:reset", "kai-btn ghost", function (item) {
      if (!item.classList.contains("confirm")) {
        item.classList.add("confirm");
        item.textContent = tr("Точно сбросить? (OK)", "Confirm reset? (OK)");
        return;
      }
      var hadJit = state.own.jit || state.own.platform || Object.keys(Settings.props(id)).length;
      Settings.resetGame(id);
      if (hadJit) {
        location.reload();
        return;
      }
      state = Settings.resolve(id);
      config.screenMode = state.values.screen === "fit" ? "fit" : Settings.parse(state.values.screen) ? "manual" : "auto";
      if (config.screenMode === "manual") config.screen = state.values.screen;
      ["scale", "rotate", "fps"].forEach(function (k) { apply[k](state.values[k]); });
      ScreenSetup.apply();
      render();
    }));
    return f;
  }

  function render() {
    if (panel.hidden) return;
    var scroll = box.scrollTop;
    box.textContent = "";
    if (page === "props") {
      propsView();
      box.scrollTop = scroll;
      updateSoftkeys();
      restoreFocus();
      return;
    }

    var nav = el("section");
    nav.appendChild(kaiItem(tr("← Выйти к списку игр", "← Exit to games list"), "nav:home", "kai-btn ghost", function () {
      if (typeof myflushAll === "function") myflushAll();
      location.href = "index.html";
    }));

    var view = el("section");
    append(view, txt("h3", "", tr("Масштаб и система", "Scaling and system")), selects());

    var files = el("section");
    var n = Object.keys(Settings.props(id)).length;
    append(files,
      txt("h3", "", tr("Файлы и свойства", "Files and properties")),
      kaiItem(tr("Файлы телефона", "Phone files"), "files:open", "kai-btn", function () {
        toggle(false);
        Files.open();
      }),
      kaiItem(tr("Системные свойства", "System properties") + (n ? " (" + n + ")" : ""), "props:open", "kai-btn ghost", function () {
        go("props");
      }));

    box.appendChild(head());
    var bt = bluetooth();
    if (bt) box.appendChild(bt);
    append(box, nav, screenSection(), view, files, footer());
    box.scrollTop = scroll;
    updateSoftkeys();
    restoreFocus();
  }

  function toggle(open) {
    if (open === undefined) open = panel.hidden;
    if (!open) {
      page = "main";
      focusTargetKey = null;
    }
    panel.hidden = !open;
    if (open) render();
    else if (panel.contains(document.activeElement)) document.activeElement.blur();
  }

  function moveFocus(dir) {
    var list = focusables();
    if (!list.length) return;
    var active = document.activeElement;
    var idx = list.indexOf(active);
    if (idx < 0) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].classList.contains("kbd-focus")) { idx = i; break; }
      }
    }
    if (idx < 0) {
      setFocusEl(list[0]);
      return;
    }
    if (dir === "left" || dir === "right") {
      idx = (idx + (dir === "right" ? 1 : -1) + list.length) % list.length;
      setFocusEl(list[idx]);
      return;
    }
    var rects = list.map(function (el) {
      var r = el.getBoundingClientRect();
      return { el: el, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
    });
    var c = rects[idx];
    var bestIdx = -1, bestScore = Infinity;
    for (var j = 0; j < rects.length; j++) {
      if (j === idx) continue;
      var dy = dir === "down" ? (rects[j].cy - c.cy) : (c.cy - rects[j].cy);
      if (dy <= 10) continue;
      var score = dy * 2 + Math.abs(rects[j].cx - c.cx);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    if (bestIdx < 0) bestIdx = dir === "down" ? 0 : list.length - 1;
    setFocusEl(list[bestIdx]);
  }

  function stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function higherModalOpen() {
    var mc = document.getElementById("midlet-chooser");
    if (mc && mc.style.display !== "none") return true;
    if (window.BtRoom && BtRoom.isOpen && BtRoom.isOpen()) return true;
    if (window.Files && Files.isOpen && Files.isOpen()) return true;
    return false;
  }

  box.addEventListener("focusin", function (e) {
    if (e.target && e.target !== box && e.target.dataset && e.target.dataset.fk) {
      var list = focusables();
      for (var i = 0; i < list.length; i++) list[i].classList.remove("kbd-focus");
      e.target.classList.add("kbd-focus");
      focusTargetKey = e.target.dataset.fk;
    }
  });

  BtRoom.watch(function (st) {
    if (panel.hidden) return;
    if (btStatus && roomKey(st) === btKey) btStatus.textContent = linkText(st);
    else render();
  });
  ScreenSetup.onChange(render);

  var origStarted = ScreenSetup.started;
  ScreenSetup.started = function () {
    startSize = canvasSize();
    origStarted();
    showToast(tr("Вызов / LSK+RSK — настройки", "Call / LSK+RSK — settings"), 2800);
  };

  window.addEventListener("keydown", function (e) {
    if (panel.hidden || higherModalOpen()) return;
    if (e.key === "EndCall" || e.key === "MicrophoneToggle") return;

    if (e.key === "Call" || e.key === "F10" || e.key === "ContextMenu" || e.key === "Tab") {
      stopEvent(e);
      if (!e.repeat) toggle(false);
      return;
    }
    if (e.key === "SoftLeft" || e.key === "Escape") {
      stopEvent(e);
      if (page === "props") back();
      else {
        toggle(false);
        Files.open();
      }
      return;
    }
    if (e.key === "SoftRight") {
      stopEvent(e);
      toggle(false);
      return;
    }

    var active = document.activeElement;
    if (e.key === "Backspace") {
      if (active && active.tagName === "INPUT" && (active.value || "").length > 0) return;
      stopEvent(e);
      back();
      return;
    }
    if (e.key === "Enter") {
      if (active && active.tagName === "SELECT") return;
      if (active && active._activate) {
        stopEvent(e);
        active._activate(active);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      stopEvent(e);
      moveFocus("up");
      return;
    }
    if (e.key === "ArrowDown") {
      stopEvent(e);
      moveFocus("down");
      return;
    }
    if (e.key === "ArrowLeft") {
      if (active && active.tagName === "INPUT" && typeof active.selectionStart === "number" && active.selectionStart > 0) return;
      if (active && active.tagName === "SELECT" && active.selectedIndex > 0) {
        stopEvent(e);
        active.selectedIndex--;
        var ev1 = document.createEvent("Event");
        ev1.initEvent("change", true, true);
        active.dispatchEvent(ev1);
        return;
      }
      stopEvent(e);
      moveFocus("left");
      return;
    }
    if (e.key === "ArrowRight") {
      if (active && active.tagName === "INPUT" && typeof active.selectionStart === "number" && active.selectionStart < (active.value || "").length) return;
      if (active && active.tagName === "SELECT" && active.selectedIndex < active.options.length - 1) {
        stopEvent(e);
        active.selectedIndex++;
        var ev2 = document.createEvent("Event");
        ev2.initEvent("change", true, true);
        active.dispatchEvent(ev2);
        return;
      }
      stopEvent(e);
      moveFocus("right");
    }
  }, true);

  window.addEventListener("keyup", function (e) {
    if (panel.hidden || higherModalOpen()) return;
    if (e.key === "EndCall" || e.key === "MicrophoneToggle") return;
    if (e.key === "SoftLeft" || e.key === "Escape" || e.key === "SoftRight" || e.key === "Call") {
      e.stopPropagation();
    }
  }, true);

  window.Panel = {
    toggle: toggle,
    open: function () { toggle(true); },
    close: function () { toggle(false); },
    isOpen: function () { return !panel.hidden; }
  };
})();