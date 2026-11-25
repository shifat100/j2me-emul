(function () {
  var query = new URLSearchParams(location.search);
  config.jars = query.get("jar") || "";
  if (!config.jars) {
    location.replace("index.html");
    return;
  }
  config.args = [];
  if (query.get("gldebug") === "1") config.glDebug = true;
  config.gameId = LocalJars.storageId(config.jars.replace(/^(jar\/|local:)/, ""));
  var r = Settings.resolve(config.gameId);
  var v = r.values;
  config.urlLocked = {};
  Settings.keys.forEach(function (k) {
    if (query.has(k)) {
      v[k] = query.get(k);
      config.urlLocked[k] = true;
    }
  });
  config.screenMode = v.screen === "auto" || v.screen === "fit" ? v.screen : Settings.parse(v.screen) ? "manual" : "auto";
  config.screen = config.screenMode === "manual" ? v.screen : config.screenMode === "fit" ? "" : "240x320";
  config.scale = parseFloat(v.scale) || 1;
  config.keypad = v.keypad | 0;
  config.rotate = v.rotate | 0;
  config.jit = v.jit !== "0";
  config.fps = v.fps | 0;
  var platform = Settings.platforms[v.platform];
  config.platform = platform ? platform.ua : v.platform || Settings.platforms.se.ua;
  config.keys = (platform || Settings.platforms.se).keys;
  config.props = Settings.props(config.gameId);
})();
