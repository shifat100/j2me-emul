package java.nio;

public final class ByteBuffer extends Buffer {
    final byte[] hb;
    private boolean little = true;

    ByteBuffer(int capacity) {
        super(capacity);
        hb = new byte[capacity];
    }

    public static ByteBuffer allocate(int capacity) {
        return new ByteBuffer(capacity);
    }

    public static ByteBuffer allocateDirect(int capacity) {
        return new ByteBuffer(capacity);
    }

    public static ByteBuffer wrap(byte[] data) {
        ByteBuffer b = new ByteBuffer(data.length);
        System.arraycopy(data, 0, b.hb, 0, data.length);
        return b;
    }

    public Object backingArray() {
        return hb;
    }

    public int elementSize() {
        return 1;
    }

    public byte[] array() {
        return hb;
    }

    public ByteBuffer order(ByteOrder o) {
        little = o == ByteOrder.LITTLE_ENDIAN;
        return this;
    }

    public FloatBuffer asFloatBuffer() {
        return new FloatBuffer((capacity - position) / 4);
    }

    public ByteBuffer put(byte b) {
        hb[position++] = b;
        return this;
    }

    public ByteBuffer put(int i, byte b) {
        hb[i] = b;
        return this;
    }

    public ByteBuffer put(byte[] src) {
        return put(src, 0, src.length);
    }

    public ByteBuffer put(byte[] src, int off, int len) {
        System.arraycopy(src, off, hb, position, len);
        position += len;
        return this;
    }

    public byte get() {
        return hb[position++];
    }

    public byte get(int i) {
        return hb[i];
    }

    private void putIntAt(int i, int v) {
        if (little) {
            hb[i] = (byte) v;
            hb[i + 1] = (byte) (v >> 8);
            hb[i + 2] = (byte) (v >> 16);
            hb[i + 3] = (byte) (v >> 24);
        } else {
            hb[i] = (byte) (v >> 24);
            hb[i + 1] = (byte) (v >> 16);
            hb[i + 2] = (byte) (v >> 8);
            hb[i + 3] = (byte) v;
        }
    }

    private int getIntAt(int i) {
        if (little) {
            return (hb[i] & 255) | (hb[i + 1] & 255) << 8 | (hb[i + 2] & 255) << 16 | hb[i + 3] << 24;
        }
        return hb[i] << 24 | (hb[i + 1] & 255) << 16 | (hb[i + 2] & 255) << 8 | (hb[i + 3] & 255);
    }

    public ByteBuffer putInt(int v) {
        putIntAt(position, v);
        position += 4;
        return this;
    }

    public ByteBuffer putInt(int i, int v) {
        putIntAt(i, v);
        return this;
    }

    public int getInt() {
        int v = getIntAt(position);
        position += 4;
        return v;
    }

    public int getInt(int i) {
        return getIntAt(i);
    }

    public ByteBuffer putFloat(float f) {
        return putInt(Float.floatToIntBits(f));
    }

    public ByteBuffer putFloat(int i, float f) {
        return putInt(i, Float.floatToIntBits(f));
    }

    public float getFloat() {
        return Float.intBitsToFloat(getInt());
    }

    public float getFloat(int i) {
        return Float.intBitsToFloat(getIntAt(i));
    }
}
