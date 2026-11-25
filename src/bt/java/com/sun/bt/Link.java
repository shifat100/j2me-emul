package com.sun.bt;

import java.io.IOException;
import javax.microedition.io.Connection;

public abstract class Link implements Connection {
    final int id;
    private boolean closed;
    private Dev peer;

    Link(int id) {
        this.id = id;
    }

    final void check() throws IOException {
        if (closed) throw new IOException("connection is closed");
    }

    public final Dev peer() throws IOException {
        check();
        if (peer == null) {
            String[] f = Bt.split(Bt.peer(id), '\t');
            Bt.remember(f[0], f[1]);
            peer = new Dev(f[0], 0x5a020c);
        }
        return peer;
    }

    public void close() {
        if (closed) return;
        closed = true;
        Bt.close(id);
    }
}
