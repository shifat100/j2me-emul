package android.opengl;

import java.nio.Buffer;

public final class GLES20 {
    public static final int GL_ARRAY_BUFFER = 34962;
    public static final int GL_BLEND = 3042;
    public static final int GL_CLAMP_TO_EDGE = 33071;
    public static final int GL_COLOR_BUFFER_BIT = 16384;
    public static final int GL_COMPILE_STATUS = 35713;
    public static final int GL_CONSTANT_COLOR = 32769;
    public static final int GL_CULL_FACE = 2884;
    public static final int GL_DEPTH_BUFFER_BIT = 256;
    public static final int GL_DEPTH_TEST = 2929;
    public static final int GL_FALSE = 0;
    public static final int GL_FLOAT = 5126;
    public static final int GL_FRAGMENT_SHADER = 35632;
    public static final int GL_FUNC_ADD = 32774;
    public static final int GL_FUNC_REVERSE_SUBTRACT = 32779;
    public static final int GL_LEQUAL = 515;
    public static final int GL_LESS = 513;
    public static final int GL_LINEAR = 9729;
    public static final int GL_LINES = 1;
    public static final int GL_LINK_STATUS = 35714;
    public static final int GL_NEAREST = 9728;
    public static final int GL_NO_ERROR = 0;
    public static final int GL_ONE = 1;
    public static final int GL_ONE_MINUS_SRC_ALPHA = 771;
    public static final int GL_POINTS = 0;
    public static final int GL_SCISSOR_TEST = 3089;
    public static final int GL_SRC_ALPHA = 770;
    public static final int GL_STATIC_DRAW = 35044;
    public static final int GL_STREAM_DRAW = 35040;
    public static final int GL_TEXTURE0 = 33984;
    public static final int GL_TEXTURE1 = 33985;
    public static final int GL_TEXTURE2 = 33986;
    public static final int GL_TEXTURE_2D = 3553;
    public static final int GL_TEXTURE_MAG_FILTER = 10240;
    public static final int GL_TEXTURE_MIN_FILTER = 10241;
    public static final int GL_TEXTURE_WRAP_S = 10242;
    public static final int GL_TEXTURE_WRAP_T = 10243;
    public static final int GL_TRIANGLES = 4;
    public static final int GL_TRIANGLE_STRIP = 5;
    public static final int GL_TRUE = 1;
    public static final int GL_UNSIGNED_BYTE = 5121;
    public static final int GL_VERTEX_SHADER = 35633;
    public static final int GL_ZERO = 0;

    public static native void glActiveTexture(int texture);
    public static native void glAttachShader(int program, int shader);
    public static native void glBindBuffer(int target, int buffer);
    public static native void glBindTexture(int target, int texture);
    public static native void glBlendColor(float r, float g, float b, float a);
    public static native void glBlendEquation(int mode);
    public static native void glBlendFunc(int s, int d);
    public static native void glBlendFuncSeparate(int sr, int dr, int sa, int da);
    public static native void glClear(int mask);
    public static native void glClearColor(float r, float g, float b, float a);
    public static native void glCompileShader(int shader);
    public static native int glCreateProgram();
    public static native int glCreateShader(int type);
    public static native void glDeleteProgram(int program);
    public static native void glDeleteShader(int shader);
    public static native void glDepthFunc(int func);
    public static native void glDepthMask(boolean flag);
    public static native void glDetachShader(int program, int shader);
    public static native void glDisable(int cap);
    public static native void glDisableVertexAttribArray(int index);
    public static native void glDrawArrays(int mode, int first, int count);
    public static native void glEnable(int cap);
    public static native void glEnableVertexAttribArray(int index);
    public static native void glFlush();
    public static native int glGetAttribLocation(int program, String name);
    public static native int glGetError();
    public static native String glGetProgramInfoLog(int program);
    public static native String glGetShaderInfoLog(int shader);
    public static native int glGetUniformLocation(int program, String name);
    public static native boolean glIsTexture(int texture);
    public static native void glLinkProgram(int program);
    public static native void glReleaseShaderCompiler();
    public static native void glScissor(int x, int y, int w, int h);
    public static native void glShaderSource(int shader, String source);
    public static native void glTexParameteri(int target, int pname, int param);
    public static native void glUniform1f(int location, float x);
    public static native void glUniform1i(int location, int x);
    public static native void glUniform2f(int location, float x, float y);
    public static native void glUniform3f(int location, float x, float y, float z);
    public static native void glUseProgram(int program);
    public static native void glViewport(int x, int y, int w, int h);

    private static native void genObjects(int kind, int n, int[] ids, int offset);
    private static native void deleteObjects(int kind, int n, int[] ids, int offset);
    private static native void getParam(int kind, int id, int pname, int[] params, int offset);
    private static native void bufferData0(int target, int size, Object data, int offset, int usage);
    private static native void attribPointer0(int index, int size, int type, boolean normalized, int stride, Object data, int offset);
    private static native void uniformMatrix4fv0(int location, int count, float[] value, int offset);
    private static native void uniform3fv0(int location, int count, float[] value, int offset);

    public static void glGenTextures(int n, int[] ids, int offset) { genObjects(0, n, ids, offset); }
    public static void glGenBuffers(int n, int[] ids, int offset) { genObjects(1, n, ids, offset); }
    public static void glDeleteTextures(int n, int[] ids, int offset) { deleteObjects(0, n, ids, offset); }
    public static void glDeleteBuffers(int n, int[] ids, int offset) { deleteObjects(1, n, ids, offset); }
    public static void glGetShaderiv(int shader, int pname, int[] params, int offset) { getParam(0, shader, pname, params, offset); }
    public static void glGetProgramiv(int program, int pname, int[] params, int offset) { getParam(1, program, pname, params, offset); }

    public static void glBufferData(int target, int size, Buffer data, int usage) {
        bufferData0(target, size, data == null ? null : data.backingArray(), data == null ? 0 : data.position() * data.elementSize(), usage);
    }

    public static void glVertexAttribPointer(int index, int size, int type, boolean normalized, int stride, Buffer ptr) {
        attribPointer0(index, size, type, normalized, stride, ptr.backingArray(), ptr.position() * ptr.elementSize());
    }

    public static void glVertexAttribPointer(int index, int size, int type, boolean normalized, int stride, int offset) {
        attribPointer0(index, size, type, normalized, stride, null, offset);
    }

    public static void glUniformMatrix4fv(int location, int count, boolean transpose, float[] value, int offset) {
        uniformMatrix4fv0(location, count, value, offset);
    }

    public static void glUniform3fv(int location, int count, java.nio.FloatBuffer v) {
        uniform3fv0(location, count, v.array(), v.position());
    }

    public static void glUniform3fv(int location, int count, float[] v, int offset) {
        uniform3fv0(location, count, v, offset);
    }
}
