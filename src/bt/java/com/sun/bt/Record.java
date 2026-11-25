package com.sun.bt;

import com.sun.jsr082.bluetooth.DataElementSerializer;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Hashtable;
import javax.bluetooth.DataElement;
import javax.bluetooth.RemoteDevice;
import javax.bluetooth.ServiceRecord;
import javax.bluetooth.UUID;

public final class Record implements ServiceRecord {
    static final UUID L2CAP = new UUID(0x0100L);
    static final UUID RFCOMM = new UUID(0x0003L);

    private final Hashtable attrs = new Hashtable();
    private final Dev host;
    final boolean l2cap;
    final int port;
    Notifier owner;

    private Record(Dev host, boolean l2cap, int port) {
        this.host = host;
        this.l2cap = l2cap;
        this.port = port;
    }

    static Record local(boolean l2cap, int port, UUID uuid, String name) {
        Record r = new Record(null, l2cap, port);
        r.put(0x0000, new DataElement(DataElement.U_INT_4, Bt.handle()));
        DataElement cls = new DataElement(DataElement.DATSEQ);
        cls.addElement(new DataElement(DataElement.UUID, uuid));
        r.put(0x0001, cls);
        DataElement proto = new DataElement(DataElement.DATSEQ);
        DataElement l = new DataElement(DataElement.DATSEQ);
        l.addElement(new DataElement(DataElement.UUID, L2CAP));
        if (l2cap) {
            l.addElement(new DataElement(DataElement.U_INT_2, port));
            proto.addElement(l);
        } else {
            proto.addElement(l);
            DataElement c = new DataElement(DataElement.DATSEQ);
            c.addElement(new DataElement(DataElement.UUID, RFCOMM));
            c.addElement(new DataElement(DataElement.U_INT_1, port));
            proto.addElement(c);
        }
        r.put(0x0004, proto);
        if (name != null) r.put(0x0100, new DataElement(DataElement.STRING, name));
        return r;
    }

    static Record decode(Dev host, String key, String hex) throws IOException {
        Record r = new Record(host, key.charAt(0) == 'L', Integer.parseInt(key.substring(1), 16));
        byte[] b = new byte[hex.length() / 2];
        for (int i = 0; i < b.length; i++) {
            b[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        Enumeration e = (Enumeration) new DataElementSerializer().restore(b).getValue();
        while (e.hasMoreElements()) {
            int id = (int) ((DataElement) e.nextElement()).getLong();
            r.put(id, (DataElement) e.nextElement());
        }
        return r;
    }

    public void publish() {
        if (owner != null) owner.publish();
    }

    String key() {
        return (l2cap ? "L" : "S") + Integer.toHexString(port);
    }

    String encode() {
        DataElement seq = new DataElement(DataElement.DATSEQ);
        Enumeration e = attrs.keys();
        while (e.hasMoreElements()) {
            Integer id = (Integer) e.nextElement();
            seq.addElement(new DataElement(DataElement.U_INT_2, id.intValue()));
            seq.addElement((DataElement) attrs.get(id));
        }
        byte[] b;
        try {
            b = new DataElementSerializer().serialize(seq);
        } catch (IOException x) {
            b = new byte[0];
        }
        StringBuffer sb = new StringBuffer(b.length * 2);
        for (int i = 0; i < b.length; i++) {
            sb.append("0123456789abcdef".charAt((b[i] >> 4) & 15));
            sb.append("0123456789abcdef".charAt(b[i] & 15));
        }
        return sb.toString();
    }

    public boolean has(UUID[] set) {
        for (int i = 0; i < set.length; i++) {
            boolean found = false;
            Enumeration e = attrs.elements();
            while (!found && e.hasMoreElements()) {
                found = contains((DataElement) e.nextElement(), set[i]);
            }
            if (!found) return false;
        }
        return true;
    }

    private static boolean contains(DataElement d, UUID u) {
        int t = d.getDataType();
        if (t == DataElement.UUID) return u.equals(d.getValue());
        if (t == DataElement.DATSEQ || t == DataElement.DATALT) {
            Enumeration e = (Enumeration) d.getValue();
            while (e.hasMoreElements()) {
                if (contains((DataElement) e.nextElement(), u)) return true;
            }
        }
        return false;
    }

    private void put(int id, DataElement v) {
        attrs.put(new Integer(id), v);
    }

    private static void check(int id) {
        if (id < 0 || id > 0xFFFF) throw new IllegalArgumentException("attrID out of range");
    }

    public DataElement getAttributeValue(int id) {
        check(id);
        return (DataElement) attrs.get(new Integer(id));
    }

    public RemoteDevice getHostDevice() {
        return host;
    }

    public synchronized int[] getAttributeIDs() {
        int[] ids = new int[attrs.size()];
        Enumeration e = attrs.keys();
        for (int i = 0; e.hasMoreElements(); i++) {
            ids[i] = ((Integer) e.nextElement()).intValue();
        }
        return ids;
    }

    public boolean populateRecord(int[] ids) throws IOException {
        if (host == null) throw new RuntimeException("local service record");
        if (ids == null) throw new NullPointerException();
        if (ids.length == 0) throw new IllegalArgumentException();
        for (int i = 0; i < ids.length; i++) check(ids[i]);
        return true;
    }

    public String getConnectionURL(int security, boolean master) {
        if (security < 0 || security > 2) throw new IllegalArgumentException("bad security");
        String addr = host == null ? Bt.localAddress() : host.getBluetoothAddress();
        return (l2cap ? "btl2cap://" : "btspp://") + addr + ":"
            + (l2cap ? hex4(port) : String.valueOf(port))
            + ";authenticate=" + (security != NOAUTHENTICATE_NOENCRYPT)
            + ";encrypt=" + (security == AUTHENTICATE_ENCRYPT)
            + ";master=" + master;
    }

    private static String hex4(int v) {
        String s = Integer.toHexString(v);
        while (s.length() < 4) s = "0" + s;
        return s;
    }

    public void setDeviceServiceClasses(int classes) {
        if (host != null) throw new RuntimeException("remote service record");
    }

    public synchronized boolean setAttributeValue(int id, DataElement v) {
        check(id);
        if (host != null) throw new RuntimeException("remote service record");
        if (id == 0x0000) throw new IllegalArgumentException("ServiceRecordHandle is read-only");
        if (v == null) attrs.remove(new Integer(id));
        else put(id, v);
        return true;
    }
}
