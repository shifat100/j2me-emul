#ifndef WEB_JNI_H
#define WEB_JNI_H
#include <stddef.h>
#include <stdint.h>

typedef unsigned char jboolean;
typedef signed char jbyte;
typedef unsigned short jchar;
typedef short jshort;
typedef int jint;
typedef int jlong;
typedef float jfloat;
typedef double jdouble;
typedef jint jsize;

struct _jobject {};
typedef _jobject *jobject;
typedef jobject jclass;
typedef jobject jstring;
typedef jobject jarray;
typedef jarray jbooleanArray;
typedef jarray jbyteArray;
typedef jarray jcharArray;
typedef jarray jshortArray;
typedef jarray jintArray;
typedef jarray jlongArray;
typedef jarray jfloatArray;
typedef jarray jdoubleArray;
typedef jobject jthrowable;

#define JNI_FALSE 0
#define JNI_TRUE 1
#define JNI_COMMIT 1
#define JNI_ABORT 2
#define JNIEXPORT extern "C" __attribute__((visibility("default"), used))
#define JNICALL

extern "C" {
void *jni_get(jarray a, int elemSize);
void jni_release(jarray a, void *p, int mode);
int jni_len(jarray a);
void jni_region(jarray a, int start, int len, void *buf, int elemSize);
void jni_throw(const char *name);
}

struct JNIEnv {
    jsize GetArrayLength(jarray a) { return jni_len(a); }
    jbyte *GetByteArrayElements(jbyteArray a, jboolean *) { return (jbyte *)jni_get(a, 1); }
    jshort *GetShortArrayElements(jshortArray a, jboolean *) { return (jshort *)jni_get(a, 2); }
    jint *GetIntArrayElements(jintArray a, jboolean *) { return (jint *)jni_get(a, 4); }
    jlong *GetLongArrayElements(jlongArray a, jboolean *) { return (jlong *)jni_get(a, 4); }
    jfloat *GetFloatArrayElements(jfloatArray a, jboolean *) { return (jfloat *)jni_get(a, 4); }
    void ReleaseByteArrayElements(jbyteArray a, jbyte *p, jint m) { jni_release(a, p, m); }
    void ReleaseShortArrayElements(jshortArray a, jshort *p, jint m) { jni_release(a, p, m); }
    void ReleaseIntArrayElements(jintArray a, jint *p, jint m) { jni_release(a, p, m); }
    void ReleaseLongArrayElements(jlongArray a, jlong *p, jint m) { jni_release(a, p, m); }
    void ReleaseFloatArrayElements(jfloatArray a, jfloat *p, jint m) { jni_release(a, p, m); }
    void GetByteArrayRegion(jbyteArray a, jsize s, jsize l, jbyte *b) { jni_region(a, s, l, b, 1); }
    jclass FindClass(const char *name) { return (jclass)name; }
    jint ThrowNew(jclass c, const char *) { jni_throw((const char *)c); return 0; }
};
#endif
