package java.nio;

public final class FloatBuffer extends Buffer {
    final float[] hb;

    FloatBuffer(int capacity) {
        super(capacity);
        hb = new float[capacity];
    }

    public static FloatBuffer allocate(int capacity) {
        return new FloatBuffer(capacity);
    }

    public static FloatBuffer wrap(float[] data) {
        FloatBuffer b = new FloatBuffer(data.length);
        System.arraycopy(data, 0, b.hb, 0, data.length);
        return b;
    }

    public Object backingArray() {
        return hb;
    }

    public int elementSize() {
        return 4;
    }

    public float[] array() {
        return hb;
    }

    public FloatBuffer put(float f) {
        hb[position++] = f;
        return this;
    }

    public FloatBuffer put(int i, float f) {
        hb[i] = f;
        return this;
    }

    public FloatBuffer put(float[] src) {
        return put(src, 0, src.length);
    }

    public FloatBuffer put(float[] src, int off, int len) {
        System.arraycopy(src, off, hb, position, len);
        position += len;
        return this;
    }

    public FloatBuffer put(FloatBuffer src) {
        int n = src.remaining();
        System.arraycopy(src.hb, src.position, hb, position, n);
        src.position += n;
        position += n;
        return this;
    }

    public float get() {
        return hb[position++];
    }

    public float get(int i) {
        return hb[i];
    }

    public FloatBuffer get(float[] dst) {
        return get(dst, 0, dst.length);
    }

    public FloatBuffer get(float[] dst, int off, int len) {
        System.arraycopy(hb, position, dst, off, len);
        position += len;
        return this;
    }
}
