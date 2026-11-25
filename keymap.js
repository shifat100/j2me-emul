(function () {
  var KEYS = {
    ArrowUp: -1, ArrowDown: -2, ArrowLeft: -3, ArrowRight: -4,
    Enter: -5,
    SoftLeft: -6, Escape: -6,
    SoftRight: -7,
    Backspace: -8, Delete: -8,
    "*": 42, Asterisk: 42, Multiply: 42,
    "#": 35, Hash: 35
  };
  var ROTATE = {
    "90": { "-1": -3, "-4": -1, "-2": -4, "-3": -2, "50": 52, "54": 50, "56": 54, "52": 56 },
    "-90": { "-1": -4, "-3": -1, "-2": -3, "-4": -2, "50": 54, "52": 50, "56": 52, "54": 56 }
  };
  var NAMES = {
    "-1": "up", "-2": "down", "-3": "left", "-4": "right",
    "-5": "ok", "-6": "soft1", "-7": "soft2", "-8": "clear", "-11": "back"
  };
  var CODES = {
    KeyQ: -6,
    KeyE: -7,
    NumpadMultiply: 42,
    NumpadDivide: 35
  };

  for (var d = 0; d <= 9; d++) {
    KEYS[String(d)] = 48 + d;
  }

  var down = {}, physicalDown = {}, softHeldAt = {};

  function closest(el, selector) {
    while (el && el.nodeType === 1) {
      if (el.matches) {
        if (el.matches(selector)) return el;
      } else if (el.mozMatchesSelector) {
        if (el.mozMatchesSelector(selector)) return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function isVisibleOverlay(id) {
    var el = document.getElementById(id);
    return !!(el && !el.hidden && el.style.display !== "none");
  }

  function isOverlayOpen() {
    return (window.Panel && Panel.isOpen && Panel.isOpen()) ||
      (window.Files && Files.isOpen && Files.isOpen()) ||
      (window.BtRoom && BtRoom.isOpen && BtRoom.isOpen()) ||
      isVisibleOverlay("panel") ||
      isVisibleOverlay("files") ||
      isVisibleOverlay("btroom") ||
      isVisibleOverlay("midlet-chooser");
  }

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
  }

  function rotated(code) {
    var rot = typeof config !== "undefined" && config ? config.rotate : 0;
    var map = ROTATE[rot];
    if (map && map[code] !== undefined) code = map[code];
    if (NAMES[code] && typeof config !== "undefined" && config && config.keys && config.keys[NAMES[code]] !== undefined) {
      return config.keys[NAMES[code]];
    }
    return code;
  }

  function setTimer(fn, ms) {
    return typeof vmSetTimeout === "function" ? vmSetTimeout(fn, ms) : setTimeout(fn, ms);
  }

  function clearTimer(id) {
    if (!id) return;
    if (typeof vmClearTimeout === "function") vmClearTimeout(id);
    else clearTimeout(id);
  }

  function sendPress(code) {
    if (typeof MIDP !== "undefined" && MIDP.sendKeyPress) MIDP.sendKeyPress(code);
  }

  function sendRelease(code) {
    if (typeof MIDP !== "undefined" && MIDP.sendKeyRelease) MIDP.sendKeyRelease(code);
  }

  function sendRepeat(code) {
    if (typeof MIDP !== "undefined" && MIDP.sendKeyRepeat) MIDP.sendKeyRepeat(code);
  }

  function press(code) {
    code = rotated(code);
    var d = down[code];
    if (d && d.timer) {
      clearTimer(d.timer);
      sendRelease(code);
    }
    var frames = typeof MIDP !== "undefined" ? (MIDP.frames | 0) : 0;
    down[code] = { frame: frames, time: performance.now() };
    sendPress(code);
  }

  function release(code) {
    code = rotated(code);
    var d = down[code];
    if (!d) return sendRelease(code);
    (function check() {
      var frames = typeof MIDP !== "undefined" ? (MIDP.frames | 0) : 0;
      if (frames - d.frame < 2 && performance.now() - d.time < 250) {
        d.timer = setTimer(check, 16);
        return;
      }
      if (down[code] === d) delete down[code];
      sendRelease(code);
    })();
  }

  function releaseAll() {
    Object.keys(physicalDown).forEach(function (tok) {
      delete physicalDown[tok];
    });
    Object.keys(down).forEach(function (c) {
      if (!down[c].timer) {
        delete down[c];
        sendRelease(+c);
      }
    });
    softHeldAt = {};
  }

  function toggleMenu() {
    releaseAll();
    if (window.Panel && Panel.toggle) Panel.toggle();
  }

  function keyToken(e) {
    if (e.code && e.code !== "N/A" && e.code !== "Unidentified") return e.code;
    if (e.keyCode) return "kc:" + e.keyCode + ":" + (e.location || 0);
    return "key:" + e.key;
  }

  function keyOf(e) {
    if (e.code && e.code in CODES) return CODES[e.code];
    if (e.code === "Numpad5" && e.key === "Clear") return -5;
    if (e.key && e.key in KEYS) return KEYS[e.key];
    if (!e.key || e.key === "Unidentified") {
      var kc = e.keyCode;
      if (kc >= 48 && kc <= 57) return kc;
      if (kc >= 96 && kc <= 105) return 48 + (kc - 96);
      if (kc === 170 || kc === 106) return 42;
      if (kc === 163 || kc === 111) return 35;
      if (kc === 37) return -3;
      if (kc === 38) return -1;
      if (kc === 39) return -4;
      if (kc === 40) return -2;
      if (kc === 13) return -5;
      if (kc === 8) return -8;
      if (kc === 27) return -6;
    }
    return null;
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "EndCall" || e.key === "MicrophoneToggle") return;

    if (e.key === "Call" || e.key === "F10" || e.key === "ContextMenu" || e.key === "Tab") {
      e.preventDefault();
      if (!e.repeat) toggleMenu();
      return;
    }

    if (isOverlayOpen()) return;

    if (isEditable(e.target)) {
      if (closest(e.target, "#editor-layer") && (e.key === "SoftLeft" || e.key === "Escape" || e.key === "SoftRight") && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        var sk = (e.key === "SoftLeft" || e.key === "Escape") ? -6 : -7;
        var skTok = keyToken(e);
        if (e.repeat) sendRepeat(rotated(sk));
        else {
          physicalDown[skTok] = sk;
          press(sk);
        }
      }
      return;
    }

    var k = keyOf(e);
    if (k === null) return;

    e.preventDefault();

    if (!e.repeat && (k === -6 || k === -7)) {
      var now = performance.now();
      softHeldAt[k] = now;
      var other = k === -6 ? -7 : -6;
      if (softHeldAt[other] && now - softHeldAt[other] < 350) {
        toggleMenu();
        return;
      }
    }

    var tok = keyToken(e);
    if (e.repeat) {
      sendRepeat(rotated(physicalDown[tok] !== undefined ? physicalDown[tok] : k));
    } else {
      physicalDown[tok] = k;
      press(k);
    }
  });

  window.addEventListener("keyup", function (e) {
    if (e.key === "EndCall" || e.key === "MicrophoneToggle") return;
    var tok = keyToken(e);
    if (tok in physicalDown) {
      var pressed = physicalDown[tok];
      delete physicalDown[tok];
      if (pressed === -6 || pressed === -7) delete softHeldAt[pressed];
      if (rotated(pressed) in down) release(pressed);
      return;
    }
    if (isOverlayOpen() || isEditable(e.target)) return;
    var k = keyOf(e);
    if (k !== null && rotated(k) in down) release(k);
  }, true);

  window.addEventListener("blur", releaseAll);
})();