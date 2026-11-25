package android.opengl;

public final class Matrix {
    public static void multiplyMM(float[] r, int ro, float[] lhs, int lo, float[] rhs, int rro) {
        float[] t = new float[16];
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                float s = 0;
                for (int k = 0; k < 4; k++) {
                    s += lhs[lo + k * 4 + j] * rhs[rro + i * 4 + k];
                }
                t[i * 4 + j] = s;
            }
        }
        System.arraycopy(t, 0, r, ro, 16);
    }

    public static void multiplyMV(float[] r, int ro, float[] lhs, int lo, float[] rhs, int rro) {
        float x = rhs[rro], y = rhs[rro + 1], z = rhs[rro + 2], w = rhs[rro + 3];
        float[] t = new float[4];
        for (int j = 0; j < 4; j++) {
            t[j] = lhs[lo + j] * x + lhs[lo + 4 + j] * y + lhs[lo + 8 + j] * z + lhs[lo + 12 + j] * w;
        }
        System.arraycopy(t, 0, r, ro, 4);
    }
}
