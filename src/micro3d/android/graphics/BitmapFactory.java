package android.graphics;

public final class BitmapFactory {
    private static native int decode0(byte[] data, int offset, int length);
    private static native int size0(int image, boolean height);

    public static Bitmap decodeByteArray(byte[] data, int offset, int length) {
        int id = decode0(data, offset, length);
        return id == 0 ? null : new Bitmap(id, null, size0(id, false), size0(id, true));
    }
}
