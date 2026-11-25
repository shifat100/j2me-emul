package com.sun.bt;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import javax.microedition.io.StreamConnection;

final class SppConn extends Link implements StreamConnection {
    SppConn(int id) {
        super(id);
    }

    public InputStream openInputStream() throws IOException {
        check();
        return new InputStream() {
            private final byte[] one = new byte[1];

            public int read() throws IOException {
                return read(one, 0, 1) < 0 ? -1 : one[0] & 0xFF;
            }

            public int read(byte[] b, int off, int len) throws IOException {
                if (off < 0 || len < 0 || off + len > b.length) throw new IndexOutOfBoundsException();
                if (len == 0) return 0;
                return Bt.recv(id, b, off, len, true);
            }

            public int available() {
                return Math.max(0, Bt.avail(id, true));
            }
        };
    }

    public DataInputStream openDataInputStream() throws IOException {
        return new DataInputStream(openInputStream());
    }

    public OutputStream openOutputStream() throws IOException {
        check();
        return new OutputStream() {
            private final byte[] one = new byte[1];

            public void write(int b) throws IOException {
                one[0] = (byte) b;
                write(one, 0, 1);
            }

            public void write(byte[] b, int off, int len) throws IOException {
                if (off < 0 || len < 0 || off + len > b.length) throw new IndexOutOfBoundsException();
                if (Bt.send(id, b, off, len, true) < 0) throw new IOException("connection lost");
            }

            public void flush() {
                Bt.flush(id);
            }
        };
    }

    public DataOutputStream openDataOutputStream() throws IOException {
        return new DataOutputStream(openOutputStream());
    }
}
