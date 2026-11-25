package java.nio;

public abstract class Buffer {
    int position;
    int limit;
    final int capacity;

    Buffer(int capacity) {
        this.capacity = capacity;
        this.limit = capacity;
    }

    public final int capacity() {
        return capacity;
    }

    public final int position() {
        return position;
    }

    public final Buffer position(int p) {
        position = p;
        return this;
    }

    public final int limit() {
        return limit;
    }

    public final Buffer limit(int l) {
        limit = l;
        if (position > l) position = l;
        return this;
    }

    public final Buffer rewind() {
        position = 0;
        return this;
    }

    public final Buffer clear() {
        position = 0;
        limit = capacity;
        return this;
    }

    public final Buffer flip() {
        limit = position;
        position = 0;
        return this;
    }

    public final int remaining() {
        return limit - position;
    }

    public final boolean hasRemaining() {
        return position < limit;
    }

    public abstract Object backingArray();

    public abstract int elementSize();
}
