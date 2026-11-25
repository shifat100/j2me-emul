#!/bin/bash
set -e
cd "$(dirname "$0")"
ROOT=../..
JAR=$ROOT/java/classes.jar

./build_wasm.sh

CLS=$(mktemp -d)
javac -source 8 -target 8 -nowarn -encoding UTF-8 -bootclasspath "$JAR" -d "$CLS" java/javax/microedition/m3g/*.java 2>&1 | grep -v "^warning: \[options\]\|^1 warning" || true
(cd "$CLS" && zip -qr - javax) > "$CLS/m3g.zip"
TMP=$(mktemp -d)
cp "$JAR" "$TMP/classes.jar"
zip -qd "$TMP/classes.jar" 'javax/microedition/m3g/*' >/dev/null 2>&1 || true
(cd "$CLS" && zip -qr "$TMP/classes.jar" javax/microedition/m3g)
cp "$TMP/classes.jar" "$JAR"

LIST=""
for c in "$CLS"/javax/microedition/m3g/*.class; do
  n=$(basename "$c" .class)
  LIST="$LIST$(javap -s -p "$c" | awk -v cls="$n" '/ native /{line=$0; getline d; sub(/.*descriptor: /,"",d); sub(/\(.*/,"",line); m=line; sub(/.* /,"",m); printf "%s|%s|%s ", cls, m, d}')"
done
sed -i "s#^  var NATIVES = \".*\";#  var NATIVES = \"${LIST% }\";#" $ROOT/bld/m3g.js

rm -rf "$CLS" "$TMP"
echo "OK: bld/m3g.wasm, bld/m3g.js, java/classes.jar"
