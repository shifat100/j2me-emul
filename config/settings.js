var Settings = (function () {
  var GLOBAL = "j2me.settings";
  var GAME = "j2me.game.";
  var DEFAULTS = {
    screen: "auto",
    scale: "100",
    keypad: "0",
    rotate: "0",
    fps: "0",
    jit: "1",
    platform: "se"
  };
  var STD = { up: -1, down: -2, left: -3, right: -4, ok: -5, soft1: -6, soft2: -7, clear: -8, back: -11 };
  var PLATFORMS = {
    se: { ua: "SonyEricssonK800i/R1KG001", keys: STD },
    nokia: { ua: "Nokia6300/07.21", keys: STD },
    samsung: { ua: "SAMSUNG-SGH-E250", keys: STD },
    siemens: { ua: "SIE-S65/50", keys: { up: -59, down: -60, left: -61, right: -62, ok: -26, soft1: -1, soft2: -4, clear: -8, back: -12 } },
    motorola: { ua: "MOT-V3/08.B7.58R", keys: { up: -1, down: -6, left: -2, right: -5, ok: -20, soft1: -21, soft2: -22, clear: -8, back: -11 } },
    lg: { ua: "LG-KG800", keys: { up: -1, down: -2, left: -3, right: -4, ok: -5, soft1: -202, soft2: -203, clear: -204, back: -11 } }
  };
  var OPTIONS = {
    scale: {
      label: tr("Масштаб", "Scale"),
      items: [
        ["100", tr("На весь экран (пропорц.)", "Fullscreen (Fit)")],
        ["101", tr("Растянуть на весь экран", "Fullscreen (Stretch)")],
        ["1", "×1"],
        ["0.5", "×0.5"],
        ["0.75", "×0.75"],
        ["1.5", "×1.5"],
        ["2", "×2"],
        ["3", "×3"],
        ["99", tr("Максимальный", "Maximum")]
      ]
    },
    rotate: {
      label: tr("Поворот", "Rotation"),
      items: [["0", tr("Нет", "None")], ["90", tr("90° по часовой", "90° clockwise")], ["-90", tr("90° против часовой", "90° counter-clockwise")]]
    },
    keypad: {
      label: tr("Клавиатура", "Keypad"),
      items: [["0", tr("Скрыта", "Hidden")]]
    },
    fps: {
      label: tr("Частота кадров", "Frame rate"),
      items: [["0", tr("Без ограничения", "Unlimited")], ["15", "15"], ["20", "20"], ["25", "25"], ["30", "30"]]
    },
    jit: {
      label: tr("Ускорение", "Acceleration"),
      items: [["1", tr("Включено", "On")], ["0", tr("Выключено", "Off")]]
    },
    platform: {
      label: tr("Платформа", "Platform"),
      items: [["se", "Sony Ericsson"], ["nokia", "Nokia"], ["samsung", "Samsung"], ["siemens", "Siemens"], ["motorola", "Motorola"], ["lg", "LG"]]
    }
  };
  var SYSPROPS = [
    "microedition.locale", "microedition.platform", "microedition.encoding", "microedition.profiles", "microedition.configuration",
    "com.sun.cldc.util.j2me.TimeZoneImpl.timezone", "fileconn.dir.memorycard", "fileconn.dir.photos", "com.nokia.mid.imei", "com.nokia.mid.imsi", "com.nokia.mid.batterylevel"
  ];
  var PORTRAIT = [
    [96, 65], [101, 80], [128, 128], [128, 160], [132, 176], [176, 204], [176, 208], [176, 220], [208, 208],
    [240, 260], [240, 320], [240, 400], [240, 432], [320, 480], [352, 416], [360, 640], [480, 640], [480, 800]
  ];
  var PRESETS = [
    { title: tr("Кнопочные", "Keypad phones"), items: ["128x128", "128x160", "176x208", "176x220", "208x208", "240x320", "352x416"] },
    { title: tr("Альбомные", "Landscape"), items: ["220x176", "320x240", "400x240", "416x352", "640x360", "800x480"] },
    { title: tr("Сенсорные", "Touch"), items: ["240x400", "240x432", "320x480", "360x640", "480x640", "480x800"] }
  ];

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      return {};
    }
  }

  function write(key, v) {
    try {
      if (v && Object.keys(v).length) localStorage.setItem(key, JSON.stringify(v));
      else localStorage.removeItem(key);
    } catch (e) {}
  }

  function global() {
    var stored = read(GLOBAL), out = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      out[k] = k in stored ? String(stored[k]) : DEFAULTS[k];
    });
    out.screen = DEFAULTS.screen;
    return out;
  }

  function game(id) {
    return id ? read(GAME + id) : {};
  }

  function resolve(id) {
    var g = global(), own = game(id), out = {}, mine = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      mine[k] = k in own;
      out[k] = mine[k] ? String(own[k]) : g[k];
    });
    return { values: out, own: mine };
  }

  function setGame(id, key, value) {
    var own = game(id);
    if (value == null) delete own[key];
    else own[key] = String(value);
    write(GAME + id, own);
  }

  function resetGame(id) {
    write(GAME + id, null);
  }

  function props(id) {
    return game(id).props || {};
  }

  function setProp(id, key, value) {
    var own = game(id), p = own.props || {};
    if (value == null) delete p[key];
    else p[key] = String(value);
    if (Object.keys(p).length) own.props = p;
    else delete own.props;
    write(GAME + id, own);
  }

  function resetProps(id) {
    var own = game(id);
    delete own.props;
    write(GAME + id, own);
  }

  function makeGlobal(values) {
    write(GLOBAL, values);
  }

  function parse(v) {
    var m = /^(\d{2,4})x(\d{2,4})$/.exec(v || "");
    return m ? [+m[1], +m[2]] : null;
  }

  return {
    keys: Object.keys(DEFAULTS), options: OPTIONS, platforms: PLATFORMS, defaults: DEFAULTS, presets: PRESETS, portrait: PORTRAIT,
    global: global, game: game, resolve: resolve, setGame: setGame, resetGame: resetGame, makeGlobal: makeGlobal, parse: parse,
    props: props, setProp: setProp, resetProps: resetProps, sysprops: SYSPROPS
  };
})();