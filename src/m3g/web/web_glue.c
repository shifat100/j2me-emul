#include <stdlib.h>
#include <string.h>
#include "m3g_defs.h"
#include "m3g_gl.h"
#include "zlib.h"
#include "tinf.h"

void web_surface(int w, int h);
void web_log(const char *msg);

int uncompress(Bytef *dest, uLongf *destLen, const Bytef *source, uLong sourceLen)
{
    unsigned int dl = (unsigned int)*destLen;
    if (tinf_zlib_uncompress(dest, &dl, source, (unsigned int)sourceLen) != TINF_OK) return Z_DATA_ERROR;
    *destLen = dl;
    return Z_OK;
}

M3Gsizei m3gSymbianInflateBlock(M3Gsizei srcLength, const M3Gubyte *src, M3Gsizei dstLength, M3Gubyte *dst)
{
    uLongf len = (uLongf)dstLength;
    if (uncompress(dst, &len, src, (uLong)srcLength) != Z_OK) return 0;
    return (M3Gsizei)len;
}

void m3gLogMessage(const char *format, ...) { web_log(format); }
void m3gBeginLog(void) {}
void m3gEndLog(void) {}
void m3gAssertFailed(const char *filename, int line) { web_log(filename); }

M3Gbool m3gglLockNativeBitmap(M3GNativeBitmap bitmap, M3Gubyte **ptr, M3Gsizei *stride) { return M3G_FALSE; }
void m3gglReleaseNativeBitmap(M3GNativeBitmap bitmap) {}
M3Gbool m3gglGetNativeBitmapParams(M3GNativeBitmap bitmap, M3GPixelFormat *format, M3Gint *width, M3Gint *height, M3Gint *pixels) { return M3G_FALSE; }
M3Gbool m3gglGetNativeWindowParams(M3GNativeWindow wnd, M3GPixelFormat *format, M3Gint *width, M3Gint *height) { return M3G_FALSE; }

typedef struct { EGLint w, h; } WebSurface;

static EGLSurface curSurface;
static EGLContext curContext;
static int nextContext = 1;

EGLDisplay eglGetDisplay(NativeDisplayType d) { return (EGLDisplay)1; }
EGLBoolean eglInitialize(EGLDisplay d, EGLint *ma, EGLint *mi) { if (ma) *ma = 1; if (mi) *mi = 1; return EGL_TRUE; }
EGLBoolean eglTerminate(EGLDisplay d) { return EGL_TRUE; }
EGLBoolean eglBindAPI(EGLenum api) { return EGL_TRUE; }
EGLenum eglQueryAPI(void) { return EGL_OPENGL_ES_API; }

EGLBoolean eglChooseConfig(EGLDisplay d, const EGLint *a, EGLConfig *c, EGLint n, EGLint *num)
{
    if (c && n > 0) c[0] = (EGLConfig)1;
    if (num) *num = 1;
    return EGL_TRUE;
}

EGLBoolean eglGetConfigs(EGLDisplay d, EGLConfig *c, EGLint n, EGLint *num)
{
    return eglChooseConfig(d, NULL, c, n, num);
}

EGLBoolean eglGetConfigAttrib(EGLDisplay d, EGLConfig c, EGLint a, EGLint *v)
{
    switch (a) {
    case EGL_CONFIG_ID: *v = 1; break;
    case EGL_CONFIG_CAVEAT: *v = EGL_NONE; break;
    case EGL_RED_SIZE: case EGL_GREEN_SIZE: case EGL_BLUE_SIZE: case EGL_ALPHA_SIZE: *v = 8; break;
    case EGL_BUFFER_SIZE: *v = 32; break;
    case EGL_DEPTH_SIZE: *v = 16; break;
    case EGL_SURFACE_TYPE: *v = EGL_PBUFFER_BIT; break;
    default: *v = 0;
    }
    return EGL_TRUE;
}

EGLContext eglCreateContext(EGLDisplay d, EGLConfig c, EGLContext s, const EGLint *a) { return (EGLContext)(intptr_t)nextContext++; }
EGLBoolean eglDestroyContext(EGLDisplay d, EGLContext c) { return EGL_TRUE; }

EGLSurface eglCreatePbufferSurface(EGLDisplay d, EGLConfig c, const EGLint *a)
{
    WebSurface *s = (WebSurface *)malloc(sizeof(WebSurface));
    s->w = s->h = 1;
    while (a && *a != EGL_NONE) {
        if (a[0] == EGL_WIDTH) s->w = a[1];
        else if (a[0] == EGL_HEIGHT) s->h = a[1];
        a += 2;
    }
    return (EGLSurface)s;
}

EGLSurface eglCreatePixmapSurface(EGLDisplay d, EGLConfig c, NativePixmapType p, const EGLint *a) { return NULL; }
EGLSurface eglCreateWindowSurface(EGLDisplay d, EGLConfig c, NativeWindowType w, const EGLint *a) { return NULL; }

EGLBoolean eglDestroySurface(EGLDisplay d, EGLSurface s)
{
    if (s == curSurface) curSurface = NULL;
    free(s);
    return EGL_TRUE;
}

EGLBoolean eglMakeCurrent(EGLDisplay d, EGLSurface dr, EGLSurface rd, EGLContext c)
{
    curSurface = dr;
    curContext = c;
    if (dr) web_surface(((WebSurface *)dr)->w, ((WebSurface *)dr)->h);
    return EGL_TRUE;
}

EGLBoolean eglQuerySurface(EGLDisplay d, EGLSurface s, EGLint a, EGLint *v)
{
    if (a == EGL_WIDTH) *v = ((WebSurface *)s)->w;
    else if (a == EGL_HEIGHT) *v = ((WebSurface *)s)->h;
    else *v = 1;
    return EGL_TRUE;
}

EGLBoolean eglQueryContext(EGLDisplay d, EGLContext c, EGLint a, EGLint *v) { *v = 1; return EGL_TRUE; }
EGLContext eglGetCurrentContext(void) { return curContext; }
EGLDisplay eglGetCurrentDisplay(void) { return (EGLDisplay)1; }
EGLSurface eglGetCurrentSurface(EGLint rd) { return curSurface; }
EGLBoolean eglCopyBuffers(EGLDisplay d, EGLSurface s, NativePixmapType t) { return EGL_FALSE; }
EGLBoolean eglSwapBuffers(EGLDisplay d, EGLSurface s) { return EGL_TRUE; }
EGLBoolean eglWaitGL(void) { return EGL_TRUE; }
EGLBoolean eglWaitNative(EGLint e) { return EGL_TRUE; }
EGLint eglGetError(void) { return EGL_SUCCESS; }
const char *eglQueryString(EGLDisplay d, EGLint n) { return "1.1"; }
