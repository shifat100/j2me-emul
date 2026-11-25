var LocalJars = (function () {
  var PREFIX = "local:";
  var db = null;

  function open() {
    if (db) return db;
    db = new Promise(function (resolve, reject) {
      var req = indexedDB.open("j2me-local", 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore("jars", { keyPath: "file" });
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
    return db;
  }

  function run(mode, fn) {
    return open().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction("jars", mode);
        var req = fn(tx.objectStore("jars"));
        tx.oncomplete = function () {
          resolve(req && req.result);
        };
        tx.onerror = tx.onabort = function () {
          reject(tx.error);
        };
      });
    });
  }

  function u16(v, i) {
    return v.getUint16(i, true);
  }

  function u32(v, i) {
    return v.getUint32(i, true);
  }

  function entries(buf) {
    var v = new DataView(buf), end = -1, i;
    for (i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
      if (u32(v, i) === 0x06054b50) {
        end = i;
        break;
      }
    }
    if (end < 0) throw new Error("not a zip");
    var out = {}, count = u16(v, end + 10), p = u32(v, end + 16);
    for (i = 0; i < count && u32(v, p) === 0x02014b50; i++) {
      var nameLen = u16(v, p + 28);
      var name = new TextDecoder().decode(new Uint8Array(buf, p + 46, nameLen));
      out[name] = { method: u16(v, p + 10), size: u32(v, p + 20), offset: u32(v, p + 42) };
      p += 46 + nameLen + u16(v, p + 30) + u16(v, p + 32);
    }
    return out;
  }

  function extract(buf, e) {
    var v = new DataView(buf);
    var start = e.offset + 30 + u16(v, e.offset + 26) + u16(v, e.offset + 28);
    var raw = new Uint8Array(buf, start, e.size);
    if (e.method === 0) return Promise.resolve(raw);
    var stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).arrayBuffer().then(function (b) {
      return new Uint8Array(b);
    });
  }

  function manifest(text) {
    var attrs = {};
    text.replace(/\r?\n /g, "").split(/\r?\n/).forEach(function (line) {
      var i = line.indexOf(":");
      if (i > 0) attrs[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return attrs;
  }

  function describe(file, buf) {
    var list = entries(buf);
    var mf = list["META-INF/MANIFEST.MF"];
    if (!mf) return Promise.reject(new Error("no manifest"));
    return extract(buf, mf).then(function (bytes) {
      var attrs = manifest(new TextDecoder().decode(bytes));
      var midlet = (attrs["MIDlet-1"] || "").split(",");
      var iconPath = (attrs["MIDlet-Icon"] || (midlet.length > 2 ? midlet[1] : "")).trim().replace(/^\//, "");
      var info = {
        file: file,
        name: midlet[0].trim() || attrs["MIDlet-Name"] || file.replace(/\.jar$/i, ""),
        vendor: attrs["MIDlet-Vendor"] || "",
        data: new Blob([buf]),
        icon: null
      };
      if (!iconPath || !list[iconPath]) return info;
      return extract(buf, list[iconPath]).then(function (img) {
        info.icon = new Blob([img], { type: "image/png" });
        return info;
      }, function () {
        return info;
      });
    });
  }

  function storageId(jar) {
    return jar.replace(/[^A-Za-z0-9._-]+/g, "_");
  }

  function clearData(jar) {
    var prefix = "/RecordStore/" + storageId(jar);
    return new Promise(function (resolve) {
      var req = indexedDB.open("asyncStorage");
      req.onsuccess = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains("fs4")) {
          d.close();
          resolve();
          return;
        }
        var tx = d.transaction("fs4", "readwrite"), store = tx.objectStore("fs4");
        store.delete(prefix);
        store.delete(IDBKeyRange.bound(prefix + "/", prefix + "/\uffff"));
        tx.oncomplete = tx.onerror = tx.onabort = function () {
          d.close();
          resolve();
        };
      };
      req.onerror = function () {
        resolve();
      };
    });
  }

  return {
    PREFIX: PREFIX,
    storageId: storageId,
    clearData: clearData,
    isLocal: function (jar) {
      return jar.indexOf(PREFIX) === 0;
    },
    add: function (file) {
      return file.arrayBuffer().then(function (buf) {
        return describe(file.name, buf);
      }).then(function (info) {
        return run("readwrite", function (s) {
          return s.put(info);
        }).then(function () {
          return info;
        });
      });
    },
    list: function () {
      return run("readonly", function (s) {
        return s.getAll();
      });
    },
    remove: function (file) {
      return run("readwrite", function (s) {
        return s.delete(file);
      });
    },
    load: function (jar) {
      return run("readonly", function (s) {
        return s.get(jar.slice(PREFIX.length));
      }).then(function (info) {
        if (!info) throw new Error(jar + " not found");
        return info.data.arrayBuffer();
      });
    }
  };
})();
