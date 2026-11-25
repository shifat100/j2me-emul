package java.nio;

public final class ByteOrder {
    public static final ByteOrder BIG_ENDIAN = new ByteOrder();
    public static final ByteOrder LITTLE_ENDIAN = new ByteOrder();

    private ByteOrder() {
    }

    public static ByteOrder nativeOrder() {
        return LITTLE_ENDIAN;
    }
}
