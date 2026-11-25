package com.sun.bt;

import java.io.IOException;
import javax.microedition.io.Connection;

public abstract class Notifier implements Connection {
    public final Record record;
    private boolean closed;
    private boolean waiting;

    Notifier(Record record) {
        this.record = record;
        record.owner = this;
    }

    final int acceptLink() throws IOException {
        synchronized (this) {
            if (closed) throw new IOException("notifier is closed");
            waiting = true;
        }
        int link = Bt.accept(record.key(), record.encode());
        synchronized (this) {
            waiting = false;
        }
        if (link < 0) throw new IOException("notifier is closed");
        return link;
    }

    public final synchronized void publish() {
        if (waiting) Bt.update(record.key(), record.encode());
    }

    public final void close() {
        synchronized (this) {
            if (closed) return;
            closed = true;
        }
        Bt.unreg(record.key());
    }
}
