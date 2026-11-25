package android.opengl;

import android.graphics.Bitmap;

public final class GLUtils {
    private static native void texImage0(int target, int image, Object graphics);

    public static void texImage2D(int target, int level, Bitmap bitmap, int border) {
        texImage0(target, bitmap.image, bitmap.graphics);
    }
}
