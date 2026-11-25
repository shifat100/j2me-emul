package android.opengl;

public final class GLU {
    public static String gluErrorString(int error) {
        return "GL error 0x" + Integer.toHexString(error);
    }
}
