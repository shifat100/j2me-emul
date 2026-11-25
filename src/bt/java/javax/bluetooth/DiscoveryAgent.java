package javax.bluetooth;

import com.sun.bt.Bt;
import com.sun.bt.Dev;
import com.sun.bt.Record;
import java.util.Hashtable;
import java.util.Vector;

public class DiscoveryAgent {
    public static final int NOT_DISCOVERABLE = 0;
    public static final int GIAC = 0x9E8B33;
    public static final int LIAC = 0x9E8B00;
    public static final int CACHED = 0x00;
    public static final int PREKNOWN = 0x01;

    private final Vector cached = new Vector();
    private final Hashtable searches = new Hashtable();
    private DiscoveryListener inquiry;
    private boolean inquiryCancelled;
    private int transId;

    DiscoveryAgent() {
    }

    public RemoteDevice[] retrieveDevices(int option) {
        if (option != CACHED && option != PREKNOWN) throw new IllegalArgumentException("Invalid option");
        if (option == PREKNOWN) return null;
        synchronized (cached) {
            if (cached.isEmpty()) return null;
            RemoteDevice[] out = new RemoteDevice[cached.size()];
            cached.copyInto(out);
            return out;
        }
    }

    public boolean startInquiry(int accessCode, final DiscoveryListener listener) throws BluetoothStateException {
        if (accessCode != LIAC && accessCode != GIAC && (accessCode < 0x9E8B00 || accessCode > 0x9E8B3F)) {
            throw new IllegalArgumentException("Invalid accessCode");
        }
        if (listener == null) throw new NullPointerException("null listener");
        synchronized (this) {
            if (inquiry != null) throw new BluetoothStateException("Inquiry is already running");
            inquiry = listener;
            inquiryCancelled = false;
        }
        new Thread() {
            public void run() {
                Dev[] devs = Bt.inquire();
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                }
                int status = devs == null ? DiscoveryListener.INQUIRY_ERROR : DiscoveryListener.INQUIRY_COMPLETED;
                for (int i = 0; devs != null && i < devs.length && !isCancelled(); i++) {
                    synchronized (cached) {
                        if (!cached.contains(devs[i])) cached.addElement(devs[i]);
                    }
                    listener.deviceDiscovered(devs[i], new DeviceClass(devs[i].cod));
                }
                synchronized (DiscoveryAgent.this) {
                    if (inquiryCancelled) status = DiscoveryListener.INQUIRY_TERMINATED;
                    inquiry = null;
                }
                listener.inquiryCompleted(status);
            }
        }.start();
        return true;
    }

    private synchronized boolean isCancelled() {
        return inquiryCancelled;
    }

    public synchronized boolean cancelInquiry(DiscoveryListener listener) {
        if (listener == null) throw new NullPointerException("null listener");
        if (inquiry != listener || inquiryCancelled) return false;
        inquiryCancelled = true;
        return true;
    }

    public int searchServices(int[] attrSet, final UUID[] uuidSet, final RemoteDevice btDev,
                              final DiscoveryListener discListener) throws BluetoothStateException {
        if (uuidSet == null || btDev == null || discListener == null) throw new NullPointerException();
        if (uuidSet.length == 0) throw new IllegalArgumentException("empty uuidSet");
        for (int i = 0; i < uuidSet.length; i++) {
            if (uuidSet[i] == null) throw new NullPointerException("null uuid");
        }
        if (attrSet != null) {
            for (int i = 0; i < attrSet.length; i++) {
                if (attrSet[i] < 0 || attrSet[i] > 0xFFFF) throw new IllegalArgumentException("bad attrID");
            }
        }
        final int id;
        final Integer key;
        synchronized (this) {
            if (searches.size() >= 7) throw new BluetoothStateException("Too many service searches");
            id = ++transId;
            key = new Integer(id);
            searches.put(key, Boolean.FALSE);
        }
        final Dev dev = btDev instanceof Dev ? (Dev) btDev : new Dev(btDev.getBluetoothAddress(), 0x5a020c);
        new Thread() {
            public void run() {
                Record[] all = Bt.services(dev);
                Vector found = new Vector();
                for (int i = 0; all != null && i < all.length; i++) {
                    if (all[i].has(uuidSet)) found.addElement(all[i]);
                }
                int status;
                synchronized (DiscoveryAgent.this) {
                    boolean cancelled = searches.remove(key) == Boolean.TRUE;
                    if (cancelled) status = DiscoveryListener.SERVICE_SEARCH_TERMINATED;
                    else if (all == null) status = DiscoveryListener.SERVICE_SEARCH_DEVICE_NOT_REACHABLE;
                    else if (found.isEmpty()) status = DiscoveryListener.SERVICE_SEARCH_NO_RECORDS;
                    else status = DiscoveryListener.SERVICE_SEARCH_COMPLETED;
                }
                if (status == DiscoveryListener.SERVICE_SEARCH_COMPLETED) {
                    ServiceRecord[] recs = new ServiceRecord[found.size()];
                    found.copyInto(recs);
                    discListener.servicesDiscovered(id, recs);
                }
                discListener.serviceSearchCompleted(id, status);
            }
        }.start();
        return id;
    }

    public synchronized boolean cancelServiceSearch(int transID) {
        Integer key = new Integer(transID);
        if (searches.get(key) != Boolean.FALSE) return false;
        searches.put(key, Boolean.TRUE);
        return true;
    }

    public String selectService(UUID uuid, int security, boolean master) throws BluetoothStateException {
        if (uuid == null) throw new NullPointerException("null uuid");
        if (security < 0 || security > 2) throw new IllegalArgumentException("bad security");
        Dev[] devs = Bt.inquire();
        if (devs == null) throw new BluetoothStateException("Inquiry failed");
        UUID[] set = new UUID[] {uuid};
        for (int i = 0; i < devs.length; i++) {
            Record[] recs = Bt.services(devs[i]);
            for (int j = 0; recs != null && j < recs.length; j++) {
                if (recs[j].has(set)) return recs[j].getConnectionURL(security, master);
            }
        }
        return null;
    }
}
