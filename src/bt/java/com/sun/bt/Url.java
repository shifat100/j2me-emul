package com.sun.bt;

import java.io.IOException;
import javax.bluetooth.BluetoothConnectionException;
import javax.bluetooth.UUID;
import javax.microedition.io.Connection;

public final class Url {
    final boolean l2cap;
    final boolean server;
    final String host;
    final String target;
    String name;
    int mtu = 672;

    private Url(boolean l2cap, String spec) {
        this.l2cap = l2cap;
        if (spec.startsWith("//")) spec = spec.substring(2);
        String[] parts = Bt.split(spec, ';');
        if (parts.length == 0) throw new IllegalArgumentException("bad url");
        int colon = parts[0].indexOf(':');
        if (colon < 0) throw new IllegalArgumentException("bad url");
        host = parts[0].substring(0, colon);
        target = parts[0].substring(colon + 1);
        server = host.equals("localhost");
        if (!server && host.length() != 12) throw new IllegalArgumentException("bad address");
        for (int i = 1; i < parts.length; i++) {
            int eq = parts[i].indexOf('=');
            if (eq < 0) continue;
            String k = parts[i].substring(0, eq).toLowerCase();
            String v = parts[i].substring(eq + 1);
            if (k.equals("name")) name = v;
            else if (k.equals("receivemtu") || k.equals("transmitmtu")) {
                try {
                    mtu = Math.max(48, Math.min(mtu, Integer.parseInt(v)));
                } catch (NumberFormatException e) {
                }
            }
        }
    }

    public static Connection open(boolean l2cap, String spec) throws IOException {
        Url u = new Url(l2cap, spec);
        Bt.start();
        if (u.server) {
            UUID uuid = new UUID(u.target, false);
            int port = l2cap ? Bt.psm() : Bt.channel();
            Record r = Record.local(l2cap, port, uuid, u.name);
            return l2cap ? (Connection) new L2Notifier(r, u.mtu) : new SppNotifier(r);
        }
        int port;
        try {
            port = l2cap ? Integer.parseInt(u.target, 16) : Integer.parseInt(u.target);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("bad port");
        }
        String key = (l2cap ? "L" : "S") + Integer.toHexString(port);
        int link = Bt.connect(u.host.toUpperCase(), key);
        if (link < 0) {
            throw new BluetoothConnectionException(link == -2 ? BluetoothConnectionException.UNKNOWN_PSM
                : BluetoothConnectionException.FAILED_NOINFO, "connection failed");
        }
        return l2cap ? (Connection) new L2Conn(link, u.mtu) : new SppConn(link);
    }
}
