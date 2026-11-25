var Files = (function () {
  var T9_MAP = {
    "0": "0 ",
    "1": "1._-",
    "2": "abc2абвг",
    "3": "def3дежз",
    "4": "ghi4ийкл",
    "5": "jkl5мноп",
    "6": "mno6рсту",
    "7": "pqrs7фхцч",
    "8": "tuv8шщъы",
    "9": "wxyz9ьэюя"
  };

  var overlay = el("div", "", { id: "files", hidden: true });
  var box = el("div", "panel-box fm-box", { tabIndex: -1 });
  var picker = el("input", "", { type: "file", multiple: true, hidden: true });
  var optMenu = el("div", "kai-opt-overlay", { hidden: true });
  var skBar = el("div", "kai-softkeys", { id: "files-softkeys" });
  var skLeft = el("span", "sk-l");
  var skCenter = el("span", "sk-c");
  var skRight = el("span", "sk-r");

  var cwd = "/", making = false, error = "", url = null;
  var focusTargetKey = null, selectedEntry = null, menuState = null;
  var t9Query = "", t9Timer = 0;

  append(skBar, skLeft, skCenter, skRight);
  append(overlay, box, picker, optMenu, skBar);

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

  function join(dir, name) {
    return (dir === "/" ? "" : dir) + "/" + name;
  }

  function human(n) {
    if (n < 1024) return n + tr(" Б", " B");
    if (n < 1048576) return (n / 1024).toFixed(1) + tr(" КБ", " KB");
    return (n / 1048576).toFixed(1) + tr(" МБ", " MB");
  }

  function flushSafe() {
    if (typeof myflushAll === "function") myflushAll();
  }

  function entries(dir) {
    return fs.list(dir).map(function (n) {
      var isDir = n.slice(-1) === "/";
      var name = isDir ? n.slice(0, -1) : n;
      var st = fs.stat(join(dir, name)) || {};
      return { name: name, path: join(dir, name), isDir: isDir, size: st.size || 0, mtime: st.mtime };
    }).sort(function (a, b) {
      return a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name);
    });
  }

  function remove(path) {
    var st = fs.stat(path);
    if (st && st.isDir) {
      fs.list(path).forEach(function (n) {
        remove(join(path, n.replace(/\/$/, "")));
      });
    }
    return fs.remove(path);
  }

  function act(fn) {
    error = "";
    fn();
    fs.syncStore();
    render();
  }

  function download(path) {
    flushSafe();
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(fs.getBlob(path));
    var a = el("a", "", { href: url, download: path.slice(path.lastIndexOf("/") + 1) });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function upload(list) {
    act(function () {
      Array.prototype.forEach.call(list, function (f) {
        var path = join(cwd, f.name), st = fs.stat(path);
        if (st && st.isDir) error = tr("Здесь уже есть папка «" + f.name + "»", "There is already a folder “" + f.name + "” here");
        else if (st && !fs.remove(path)) error = tr("«" + f.name + "» сейчас открыт игрой", "“" + f.name + "” is open by the game");
        else fs.create(path, f);
      });
    });
  }

  function folder(name) {
    name = name.trim();
    if (!name || /[\/\\]/.test(name)) return render(tr("Недопустимое имя папки", "Invalid folder name"));
    act(function () {
      if (!fs.mkdir(join(cwd, name))) error = tr("Не удалось создать папку", "Could not create folder");
      making = false;
      focusTargetKey = null;
    });
  }

  function scrollIntoBox(container, target) {
    if (!target || !container) return;
    var bRect = container.getBoundingClientRect();
    var tRect = target.getBoundingClientRect();
    if (tRect.top < bRect.top + 4) container.scrollTop -= (bRect.top + 4 - tRect.top);
    else if (tRect.bottom > bRect.bottom - 32) container.scrollTop += (tRect.bottom - (bRect.bottom - 32));
  }

  function focusables() {
    var list = Array.prototype.slice.call(box.querySelectorAll(".kai-item, input:not(:disabled)"));
    return list.filter(function (node) { return node.offsetParent !== null; });
  }

  function setFocusEl(target) {
    var list = focusables();
    for (var i = 0; i < list.length; i++) list[i].classList.remove("kbd-focus");
    if (!target) return;
    target.classList.add("kbd-focus");
    if (target.dataset && target.dataset.fk) focusTargetKey = target.dataset.fk;
    selectedEntry = target._entry || null;
    scrollIntoBox(box, target);
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

  function updateSoftkeys() {
    if (menuState) {
      skLeft.textContent = tr("Назад", "Back");
      skCenter.textContent = tr("ВЫБРАТЬ", "SELECT");
      skRight.textContent = tr("Закрыть", "Close");
      return;
    }
    if (making) {
      skLeft.textContent = tr("Отмена", "Cancel");
      skCenter.textContent = tr("СОЗДАТЬ", "CREATE");
      skRight.textContent = tr("Закрыть", "Close");
      return;
    }
    skLeft.textContent = cwd === "/" ? tr("Закрыть", "Close") : tr("Наверх", "Up");
    skCenter.textContent = tr("ОТКРЫТЬ", "OPEN");
    skRight.textContent = tr("Опции", "Options");
  }

  function render(msg) {
    if (msg) error = msg;
    var list;
    try {
      list = entries(cwd);
    } catch (e) {
      if (cwd !== "/") return cd("/");
      list = [];
      error = tr("Файловая система ещё не готова", "File system is not ready yet");
    }
    var scroll = box.scrollTop;
    box.textContent = "";

    var head = el("div", "pb-head");
    var title = el("div", "pb-title");
    append(title,
      txt("b", "", tr("Файлы телефона", "Phone files")),
      txt("span", "", cwd));
    head.appendChild(title);

    var tools = el("section", "fm-tools");
    if (making) {
      var form = el("form", "fm-new");
      var name = el("input", "", { placeholder: tr("Имя папки", "Folder name"), maxLength: 64, spellcheck: false, autocapitalize: "none" });
      name.dataset.fk = "new:name";
      form.appendChild(name);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        folder(name.value);
      });
      tools.appendChild(form);
    }
    if (error) tools.appendChild(txt("div", "bt-error", error));

    var rows = el("section", "fm-list");
    if (cwd !== "/") {
      var up = el("div", "kai-item fm-row fm-dir", { tabIndex: 0 });
      up.dataset.fk = "row:up";
      up._activate = function () { cd(fs.dirname(cwd)); };
      append(up, txt("span", "fm-icon", "↩"), txt("span", "fm-label", ".."));
      rows.appendChild(up);
    }
    list.forEach(function (e) {
      var r = el("div", "kai-item fm-row" + (e.isDir ? " fm-dir" : ""), { tabIndex: 0 });
      r.dataset.fk = "open:" + e.path;
      r.dataset.entryName = e.name;
      r._entry = e;
      r._activate = function () {
        if (e.isDir) cd(e.path);
        else download(e.path);
      };
      append(r, txt("span", "fm-icon", e.isDir ? "📁" : "📄"), txt("span", "fm-label", e.name));
      if (!e.isDir) r.appendChild(txt("span", "fm-meta", human(e.size)));
      rows.appendChild(r);
    });
    if (!list.length) rows.appendChild(txt("div", "sub fm-empty", tr("Папка пуста. Опции (RSK) → Загрузить.", "Folder is empty. Options (RSK) → Upload.")));

    append(box, head);
    if (making || error) box.appendChild(tools);
    box.appendChild(rows);
    box.scrollTop = scroll;
    updateSoftkeys();
    if (!overlay.hidden && !menuState) restoreFocus();
  }

  function closeOptions() {
    if (!menuState) return;
    optMenu.hidden = true;
    optMenu.textContent = "";
    menuState = null;
    updateSoftkeys();
    restoreFocus();
  }

  function focusMenuIndex(idx) {
    if (!menuState || !menuState.items.length) return;
    var n = menuState.items.length;
    menuState.idx = ((idx % n) + n) % n;
    for (var i = 0; i < n; i++) {
      menuState.items[i].classList.toggle("kbd-focus", i === menuState.idx);
    }
    var target = menuState.items[menuState.idx];
    if (target.focus) {
      try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
    }
    scrollIntoBox(menuState.box, target);
  }

  function openOptions() {
    closeOptions();
    var mbox = el("div", "opt-box");
    mbox.appendChild(txt("div", "opt-title", selectedEntry ? selectedEntry.name : tr("Файлы", "Files")));
    var items = [];

    function addOpt(label, confirmLabel, fn) {
      var item = el("div", "opt-item", { tabIndex: 0, textContent: label });
      item._activate = function () {
        if (confirmLabel && !item.classList.contains("confirm")) {
          item.classList.add("confirm");
          item.textContent = confirmLabel;
          return;
        }
        closeOptions();
        fn();
      };
      item.addEventListener("click", function (ev) {
        ev.preventDefault();
        item._activate();
      });
      mbox.appendChild(item);
      items.push(item);
    }

    if (selectedEntry) {
      var e = selectedEntry;
      addOpt(e.isDir ? tr("Открыть папку", "Open folder") : tr("Скачать файл", "Download file"), null, function () {
        if (e.isDir) cd(e.path);
        else download(e.path);
      });
    }
    addOpt(tr("Загрузить сюда", "Upload here"), null, function () {
      picker.click();
    });
    addOpt(tr("Новая папка", "New folder"), null, function () {
      making = true;
      focusTargetKey = "new:name";
      render();
    });
    if (selectedEntry) {
      var delEntry = selectedEntry;
      addOpt(tr("Удалить", "Delete"), tr("Точно удалить? (OK)", "Confirm delete? (OK)"), function () {
        act(function () {
          if (!remove(delEntry.path)) error = tr("«" + delEntry.name + "» сейчас открыт игрой", "“" + delEntry.name + "” is open by the game");
          else focusTargetKey = null;
        });
      });
    }
    addOpt(tr("Закрыть менеджер", "Close manager"), null, function () {
      close();
    });

    optMenu.textContent = "";
    optMenu.appendChild(mbox);
    optMenu.hidden = false;
    menuState = { box: mbox, items: items, idx: 0 };
    focusMenuIndex(0);
    updateSoftkeys();
  }

  function cd(path) {
    cwd = path;
    making = false;
    error = "";
    focusTargetKey = null;
    selectedEntry = null;
    box.scrollTop = 0;
    render();
  }

  function open() {
    flushSafe();
    overlay.hidden = false;
    render();
  }

  function close() {
    closeOptions();
    overlay.hidden = true;
    making = false;
    error = "";
    focusTargetKey = null;
    if (overlay.contains(document.activeElement)) document.activeElement.blur();
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
    if (idx < 0) idx = 0;
    else idx = (idx + (dir === "down" || dir === "right" ? 1 : -1) + list.length) % list.length;
    setFocusEl(list[idx]);
  }

  function jumpT9(digit) {
    if (t9Timer) clearTimeout(t9Timer);
    t9Query += digit;
    t9Timer = setTimeout(function () { t9Query = ""; t9Timer = 0; }, 1200);
    var parts = [];
    for (var i = 0; i < t9Query.length; i++) {
      var chars = T9_MAP[t9Query.charAt(i)] || t9Query.charAt(i);
      parts.push("[" + chars.replace(/[\\\]^-]/g, "\\$&") + "]");
    }
    var re = new RegExp(parts.join(""), "i");
    var list = focusables();
    for (var j = 0; j < list.length; j++) {
      var name = list[j].dataset && list[j].dataset.entryName;
      if (name && re.test(name)) {
        setFocusEl(list[j]);
        return;
      }
    }
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
    return false;
  }

  box.addEventListener("focusin", function (e) {
    if (e.target && e.target !== box && e.target.dataset && e.target.dataset.fk) {
      var list = focusables();
      for (var i = 0; i < list.length; i++) list[i].classList.remove("kbd-focus");
      e.target.classList.add("kbd-focus");
      focusTargetKey = e.target.dataset.fk;
      selectedEntry = e.target._entry || null;
    }
  });

  picker.addEventListener("change", function () {
    upload(picker.files);
    picker.value = "";
  });
  overlay.addEventListener("dragover", function (e) {
    e.preventDefault();
    overlay.classList.add("drop");
  });
  overlay.addEventListener("dragleave", function (e) {
    if (!e.relatedTarget || !overlay.contains(e.relatedTarget)) overlay.classList.remove("drop");
  });
  overlay.addEventListener("drop", function (e) {
    e.preventDefault();
    overlay.classList.remove("drop");
    upload(e.dataTransfer.files);
  });

  window.addEventListener("keydown", function (e) {
    if (overlay.hidden || higherModalOpen()) return;
    if (e.key === "EndCall" || e.key === "MicrophoneToggle") return;

    if (menuState) {
      if (e.key === "ArrowDown") {
        stopEvent(e);
        focusMenuIndex(menuState.idx + 1);
      } else if (e.key === "ArrowUp") {
        stopEvent(e);
        focusMenuIndex(menuState.idx - 1);
      } else if (e.key === "Enter") {
        stopEvent(e);
        menuState.items[menuState.idx]._activate();
      } else if (e.key === "SoftLeft" || e.key === "Escape" || e.key === "SoftRight" || e.key === "Backspace") {
        stopEvent(e);
        closeOptions();
      }
      return;
    }

    if (e.key === "SoftRight") {
      stopEvent(e);
      if (making) close();
      else openOptions();
      return;
    }
    if (e.key === "SoftLeft" || e.key === "Escape") {
      stopEvent(e);
      if (making) {
        making = false;
        focusTargetKey = null;
        render();
      } else if (cwd !== "/") {
        cd(fs.dirname(cwd));
      } else {
        close();
      }
      return;
    }

    var active = document.activeElement;
    if (e.key === "Backspace") {
      if (active && active.tagName === "INPUT" && (active.value || "").length > 0) return;
      stopEvent(e);
      if (making) {
        making = false;
        focusTargetKey = null;
        render();
      } else if (cwd !== "/") {
        cd(fs.dirname(cwd));
      } else {
        close();
      }
      return;
    }
    if (e.key === "Enter") {
      stopEvent(e);
      if (making) {
        var inp = box.querySelector('input[data-fk="new:name"]');
        if (inp) folder(inp.value);
        return;
      }
      if (active && active._activate) active._activate();
      else if (selectedEntry) {
        if (selectedEntry.isDir) cd(selectedEntry.path);
        else download(selectedEntry.path);
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
    if ((!active || active.tagName !== "INPUT") && e.key >= "0" && e.key <= "9" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      stopEvent(e);
      jumpT9(e.key);
    }
  }, true);

  window.addEventListener("keyup", function (e) {
    if (overlay.hidden || higherModalOpen()) return;
    if (e.key === "EndCall" || e.key === "MicrophoneToggle") return;
    if (e.key === "SoftLeft" || e.key === "Escape" || e.key === "SoftRight") {
      e.stopPropagation();
    }
  }, true);

  function mount() {
    document.body.appendChild(overlay);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  return {
    open: open,
    close: close,
    isOpen: function () { return !overlay.hidden; }
  };
})();