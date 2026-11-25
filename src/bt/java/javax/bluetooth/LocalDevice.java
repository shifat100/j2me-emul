package javax.bluetooth;

import com.sun.bt.Bt;
import com.sun.bt.Notifier;
import com.sun.bt.Record;
import javax.microedition.io.Connection;

public class LocalDevice {
    private static LocalDevice device;
    private final DiscoveryAgent agent = new DiscoveryAgent();
    private int mode = DiscoveryAgent.GIAC;

    private LocalDevice() {
    }

    public static synchronized LocalDevice getLocalDevice() throws BluetoothStateException {
        Bt.start();
        if (device == null) device = new LocalDevice();
        return device;
    }

    public DiscoveryAgent getDiscoveryAgent() {
        return agent;
    }

    public String getFriendlyName() {
        return Bt.localName();
    }

    public DeviceClass getDeviceClass() {
        return new DeviceClass(0x5a020c);
    }

    public static String getProperty(String key) {
        if (key.equals("bluetooth.api.version")) return "1.1";
        if (key.equals("bluetooth.l2cap.receiveMTU.max")) return "672";
        if (key.equals("bluetooth.connected.devices.max")) return "7";
        if (key.equals("bluetooth.sd.trans.max")) return "7";
        if (key.equals("bluetooth.sd.attr.retrievable.max")) return "255";
        if (key.equals("bluetooth.master.switch")) return "false";
        if (key.equals("bluetooth.connected.inquiry") || key.equals("bluetooth.connected.page")
            || key.equals("bluetooth.connected.inquiry.scan") || key.equals("bluetooth.connected.page.scan")) {
            return "true";
        }
        return null;
    }

    public int getDiscoverable() {
        return mode;
    }

    public String getBluetoothAddress() {
        return Bt.localAddress();
    }

    public boolean setDiscoverable(int mode) throws BluetoothStateException {
        if (mode != DiscoveryAgent.NOT_DISCOVERABLE && (mode < 0x9E8B00 || mode > 0x9E8B3F)) {
            throw new IllegalArgumentException("Invalid discoverable mode");
        }
        this.mode = mode;
        return true;
    }

    public ServiceRecord getRecord(Connection notifier) {
        if (notifier == null) throw new NullPointerException();
        if (!(notifier instanceof Notifier)) throw new IllegalArgumentException("not a notifier");
        return ((Notifier) notifier).record;
    }

    public void updateRecord(ServiceRecord record) throws ServiceRegistrationException {
        if (record == null) throw new NullPointerException();
        if (!(record instanceof Record) || record.getHostDevice() != null) {
            throw new IllegalArgumentException("not a local record");
        }
        ((Record) record).publish();
    }

    public static boolean isPowerOn() {
        return true;
    }
}
