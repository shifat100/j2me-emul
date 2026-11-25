#!/bin/bash
set -e
cd "$(dirname "$0")"
JAR=../../java/classes.jar
CLS=$(mktemp -d)
javac -source 8 -target 8 -nowarn -encoding UTF-8 -bootclasspath "$JAR" -d "$CLS" $(find java -name '*.java') 2>&1 | grep -v "^warning: \[options\]\|^1 warning" || true
TMP=$(mktemp -d)
cp "$JAR" "$TMP/classes.jar"
zip -qd "$TMP/classes.jar" 'com/sun/bt/*' 'javax/bluetooth/LocalDevice*' 'javax/bluetooth/DiscoveryAgent*' 'javax/bluetooth/RemoteDevice*' \
  'com/sun/midp/io/j2me/btl2cap/*' 'com/sun/midp/io/j2me/btspp/*' >/dev/null 2>&1 || true
(cd "$CLS" && zip -qr "$TMP/classes.jar" .)
cp "$TMP/classes.jar" "$JAR"
rm -rf "$CLS" "$TMP"
echo "OK: java/classes.jar"
