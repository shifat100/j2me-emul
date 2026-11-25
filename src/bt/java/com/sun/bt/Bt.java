package com.sun.bt;

import java.util.Hashtable;
import java.util.Vector;
import javax.bluetooth.BluetoothStateException;

public final class Bt {
    static native int init();
    static native String addr();
    static native String name();
    static native int inquiry();
    static native int sdp(String addr);
    static native String result(int id);
    static native int accept(String key, String attrs);
    static native void update(String key, String attrs);
    static native void unreg(String key);
    static native int connect(String addr, String key);
    static native String peer(int link);
    static native int send(int link, byte[] b, int off, int len, boolean stream);
    static native int recv(int link, byte[] b, int off, int len, boolean stream);
    static native int avail(int link, boolean stream);
    static native void flush(int link);
    static native void close(int link);

    private static final Hashtable names = new Hashtable();
    private static int nextPsm = 0x1001;
    private static int nextChannel = 1;
    private static int nextHandle = 0x10001;

    private Bt() {}

    public static void start() throws BluetoothStateException {
        if (init() != 0) {
            throw new BluetoothStateException("Bluetooth is unavailable");
        }
    }

    public static String localAddress() {
        return addr();
    }

    public static String localName() {
        return name();
    }

    public static String nameOf(String addr) {
        return (String) names.get(addr);
    }

    static void remember(String addr, String name) {
        names.put(addr, name);
    }

    static synchronized int psm() {
        int p = nextPsm;
        nextPsm += 2;
        if ((nextPsm & 0x100) != 0) nextPsm += 0x100;
        if (nextPsm > 0xFFFF) nextPsm = 0x1001;
        return p;
    }

    static synchronized int channel() {
        int c = nextChannel;
        nextChannel = nextChannel % 30 + 1;
        return c;
    }

    static synchronized int handle() {
        return nextHandle++;
    }

    public static String[] split(String s, char sep) {
        Vector v = new Vector();
        if (s != null && s.length() > 0) {
            int from = 0;
            while (true) {
                int i = s.indexOf(sep, from);
                if (i < 0) {
                    v.addElement(s.substring(from));
                    break;
                }
                v.addElement(s.substring(from, i));
                from = i + 1;
            }
        }
        String[] out = new String[v.size()];
        v.copyInto(out);
        return out;
    }

    public static Dev[] inquire() {
        int id = inquiry();
        if (id < 0) return null;
        String[] lines = split(result(id), '\n');
        Dev[] out = new Dev[lines.length];
        for (int i = 0; i < lines.length; i++) {
            String[] f = split(lines[i], '\t');
            remember(f[0], f[2]);
            out[i] = new Dev(f[0], Integer.parseInt(f[1], 16));
        }
        return out;
    }

    public static Record[] services(Dev dev) {
        int id = sdp(dev.getBluetoothAddress());
        if (id < 0) return null;
        String[] lines = split(result(id), '\n');
        Vector v = new Vector();
        for (int i = 0; i < lines.length; i++) {
            String[] f = split(lines[i], '\t');
            try {
                v.addElement(Record.decode(dev, f[0], f[1]));
            } catch (Exception e) {
            }
        }
        Record[] out = new Record[v.size()];
        v.copyInto(out);
        return out;
    }
}
