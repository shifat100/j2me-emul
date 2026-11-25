package android.util;

public class SparseIntArray {
    private int[] keys;
    private int[] values;
    private int size;

    public SparseIntArray() {
        this(10);
    }

    public SparseIntArray(int capacity) {
        keys = new int[Math.max(capacity, 1)];
        values = new int[keys.length];
    }

    private int find(int key) {
        int lo = 0, hi = size - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (keys[mid] < key) lo = mid + 1;
            else if (keys[mid] > key) hi = mid - 1;
            else return mid;
        }
        return ~lo;
    }

    public int get(int key) {
        return get(key, 0);
    }

    public int get(int key, int def) {
        int i = find(key);
        return i >= 0 ? values[i] : def;
    }

    public void put(int key, int value) {
        int i = find(key);
        if (i >= 0) {
            values[i] = value;
            return;
        }
        i = ~i;
        if (size == keys.length) {
            int[] k = new int[size * 2], v = new int[size * 2];
            System.arraycopy(keys, 0, k, 0, size);
            System.arraycopy(values, 0, v, 0, size);
            keys = k;
            values = v;
        }
        System.arraycopy(keys, i, keys, i + 1, size - i);
        System.arraycopy(values, i, values, i + 1, size - i);
        keys[i] = key;
        values[i] = value;
        size++;
    }

    public void append(int key, int value) {
        put(key, value);
    }

    public int size() {
        return size;
    }

    public int keyAt(int i) {
        return keys[i];
    }

    public int valueAt(int i) {
        return values[i];
    }

    public int indexOfKey(int key) {
        int i = find(key);
        return i >= 0 ? i : -1;
    }

    public void clear() {
        size = 0;
    }
}
