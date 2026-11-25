package javax.bluetooth;

import com.sun.bt.Bt;
import com.sun.bt.Link;
import java.io.IOException;
import javax.microedition.io.Connection;

public class RemoteDevice {
    private final String address;

    protected RemoteDevice(String address) {
        if (address == null) throw new NullPointerException("null address");
        if (address.length() != 12) throw new IllegalArgumentException("Malformed address: " + address);
        for (int i = 0; i < 12; i++) {
            if (Character.digit(address.charAt(i), 16) < 0) {
                throw new IllegalArgumentException("Malformed address: " + address);
            }
        }
        this.address = address.toUpperCase();
    }

    public boolean isTrustedDevice() {
        return true;
    }

    public String getFriendlyName(boolean alwaysAsk) throws IOException {
        String name = Bt.nameOf(address);
        if (name == null) throw new IOException("Name is unknown");
        return name;
    }

    public final String getBluetoothAddress() {
        return address;
    }

    public boolean equals(Object obj) {
        return obj instanceof RemoteDevice && address.equals(((RemoteDevice) obj).address);
    }

    public int hashCode() {
        return address.hashCode();
    }

    public static RemoteDevice getRemoteDevice(Connection conn) throws IOException {
        if (conn == null) throw new NullPointerException("null connection");
        if (!(conn instanceof Link)) throw new IllegalArgumentException("not a Bluetooth connection");
        return ((Link) conn).peer();
    }

    public boolean authenticate() throws IOException {
        return true;
    }

    public boolean authorize(Connection conn) throws IOException {
        getRemoteDevice(conn);
        return true;
    }

    public boolean encrypt(Connection conn, boolean on) throws IOException {
        getRemoteDevice(conn);
        return true;
    }

    public boolean isAuthenticated() {
        return true;
    }

    public boolean isAuthorized(Connection conn) throws IOException {
        getRemoteDevice(conn);
        return true;
    }

    public boolean isEncrypted() {
        return false;
    }
}
