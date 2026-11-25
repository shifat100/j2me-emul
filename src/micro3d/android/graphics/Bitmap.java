package android.graphics;

public final class Bitmap {
    public final int image;
    public final Object graphics;
    private final int width;
    private final int height;

    public Bitmap(int image, Object graphics, int width, int height) {
        this.image = image;
        this.graphics = graphics;
        this.width = width;
        this.height = height;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public void setHasAlpha(boolean alpha) {
    }
}
