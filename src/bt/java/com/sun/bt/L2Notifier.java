package com.sun.bt;

import java.io.IOException;
import javax.bluetooth.L2CAPConnection;
import javax.bluetooth.L2CAPConnectionNotifier;

final class L2Notifier extends Notifier implements L2CAPConnectionNotifier {
    private final int mtu;

    L2Notifier(Record record, int mtu) {
        super(record);
        this.mtu = mtu;
    }

    public L2CAPConnection acceptAndOpen() throws IOException {
        return new L2Conn(acceptLink(), mtu);
    }
}
