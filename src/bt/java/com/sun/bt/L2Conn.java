package com.sun.bt;

import java.io.IOException;
import javax.bluetooth.L2CAPConnection;

final class L2Conn extends Link implements L2CAPConnection {
    private final int mtu;

    L2Conn(int id, int mtu) {
        super(id);
        this.mtu = mtu;
    }

    public int getTransmitMTU() throws IOException {
        check();
        return mtu;
    }

    public int getReceiveMTU() throws IOException {
        check();
        return mtu;
    }

    public void send(byte[] data) throws IOException {
        if (data == null) throw new NullPointerException();
        check();
        if (Bt.send(id, data, 0, Math.min(data.length, mtu), false) < 0) throw new IOException("connection lost");
    }

    public int receive(byte[] buf) throws IOException {
        if (buf == null) throw new NullPointerException();
        check();
        int n = Bt.recv(id, buf, 0, buf.length, false);
        if (n < 0) throw new IOException("connection lost");
        return n;
    }

    public boolean ready() throws IOException {
        check();
        return Bt.avail(id, false) != 0;
    }
}
