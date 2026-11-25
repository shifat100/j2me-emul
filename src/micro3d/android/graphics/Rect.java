package android.graphics;

public final class Rect {
    public int left;
    public int top;
    public int right;
    public int bottom;

    public void set(int l, int t, int r, int b) {
        left = l;
        top = t;
        right = r;
        bottom = b;
    }

    public void set(Rect r) {
        set(r.left, r.top, r.right, r.bottom);
    }

    public int width() {
        return right - left;
    }

    public int height() {
        return bottom - top;
    }

    public boolean isEmpty() {
        return left >= right || top >= bottom;
    }

    public boolean intersect(int l, int t, int r, int b) {
        if (left < r && l < right && top < b && t < bottom) {
            if (left < l) left = l;
            if (top < t) top = t;
            if (right > r) right = r;
            if (bottom > b) bottom = b;
            return true;
        }
        return false;
    }

    public boolean intersect(Rect r) {
        return intersect(r.left, r.top, r.right, r.bottom);
    }
}
