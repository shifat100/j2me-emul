package com.sun.bt;

import javax.bluetooth.RemoteDevice;

public final class Dev extends RemoteDevice {
    public final int cod;

    public Dev(String addr, int cod) {
        super(addr);
        this.cod = cod;
    }
}
