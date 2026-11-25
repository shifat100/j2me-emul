package com.sun.bt;

import java.io.IOException;
import javax.microedition.io.StreamConnection;
import javax.microedition.io.StreamConnectionNotifier;

final class SppNotifier extends Notifier implements StreamConnectionNotifier {
    SppNotifier(Record record) {
        super(record);
    }

    public StreamConnection acceptAndOpen() throws IOException {
        return new SppConn(acceptLink());
    }
}
