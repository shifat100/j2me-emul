#!/bin/bash
set -e
cd "$(dirname "$0")"
OUT=../../bld/m3g.wasm
mkdir -p obj
FLAGS="--target=wasm32-wasi -O2 -DM3G_TARGET_GENERIC -DM3G_GL_ES_1_1 -DM3G_WEB -Iweb -Inative/inc -Inative -Wno-everything"
clang $FLAGS -c native/src/m3g_core.c -o obj/core.o
clang $FLAGS -c web/web_glue.c -o obj/glue.o
clang $FLAGS -c web/tinflate.c -o obj/tinflate.o
clang $FLAGS -c web/tinfzlib.c -o obj/tinfzlib.o
clang $FLAGS -c web/adler32.c -o obj/adler32.o
clang++ $FLAGS -fno-exceptions -fno-rtti -fno-threadsafe-statics -nostdinc++ -c native/m3g_android_java_api.cpp -o obj/api.o
clang++ $FLAGS -fno-exceptions -fno-rtti -fno-threadsafe-statics -nostdinc++ -c web/CSynchronization.cpp -o obj/sync.o
clang++ --target=wasm32-wasi -O2 -nostartfiles -nostdlib++ -Wl,--no-entry -Wl,--allow-undefined -Wl,--export-dynamic \
  -Wl,--export=malloc -Wl,--export=free -Wl,--strip-all -Wl,-z,stack-size=262144 \
  obj/core.o obj/glue.o obj/tinflate.o obj/tinfzlib.o obj/adler32.o obj/api.o obj/sync.o -o $OUT
rm -rf obj
ls -l $OUT
