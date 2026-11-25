#ifndef WEB_ZLIB_H
#define WEB_ZLIB_H
#ifdef __cplusplus
extern "C" {
#endif
typedef unsigned char Bytef;
typedef unsigned long uLong;
typedef unsigned long uLongf;
#define Z_OK 0
#define Z_DATA_ERROR (-3)
int uncompress(Bytef *dest, uLongf *destLen, const Bytef *source, uLong sourceLen);
#ifdef __cplusplus
}
#endif
#endif
