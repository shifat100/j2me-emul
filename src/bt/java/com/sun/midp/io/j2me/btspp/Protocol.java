package com.sun.midp.io.j2me.btspp;

import com.sun.bt.Url;
import com.sun.cldc.io.ConnectionBaseInterface;
import java.io.IOException;
import javax.microedition.io.Connection;

public class Protocol implements ConnectionBaseInterface {
    public Connection openPrim(String name, int mode, boolean timeouts) throws IOException {
        return Url.open(false, name);
    }
}
