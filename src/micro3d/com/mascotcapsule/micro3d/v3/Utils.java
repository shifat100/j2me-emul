/*
 *  Copyright 2020 Yury Kharchenko
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.mascotcapsule.micro3d.v3;

import android.graphics.Bitmap;

import java.nio.ByteBuffer;
import java.nio.FloatBuffer;

class Utils {

	static final float TO_FLOAT = 2.4414062E-04f;
	static final float TO_RADIANS = (float) (Math.PI / 2048.0);
	static final float[] IDENTITY_AFFINE = {
			// 0     1     2     3
			// 0     4     8    12
			1.0f, 0.0f, 0.0f, 0.0f,
			// 4     5     6     7
			// 1     5     9    13
			0.0f, 1.0f, 0.0f, 0.0f,
			// 8     9    10    11
			// 2     6    10    14
			0.0f, 0.0f, 1.0f, 0.0f
	};

	static void parallelScale(float[] pm, int x, int y, FigureLayout layout, float vw, float vh) {
		float w = vw * (4096.0f / layout.scaleX);
		float h = vh * (4096.0f / layout.scaleY);

		float sx = 2.0f / w;
		float sy = 2.0f / h;
		float sz = 1.0f / 65536.0f;
		float tx = 2.0f * (layout.centerX + x) / vw - 1.0f;
		float ty = 2.0f * (layout.centerY + y) / vh - 1.0f;
		float tz = 0.0f;

		pm[ 0] =   sx; pm[ 4] = 0.0f; pm[ 8] = 0.0f; pm[12] =   tx;
		pm[ 1] = 0.0f; pm[ 5] =   sy; pm[ 9] = 0.0f; pm[13] =   ty;
		pm[ 2] = 0.0f; pm[ 6] = 0.0f; pm[10] =   sz; pm[14] =   tz;
		pm[ 3] = 0.0f; pm[ 7] = 0.0f; pm[11] = 0.0f; pm[15] = 1.0f;
	}

	static void parallelWH(float[] pm, int x, int y, FigureLayout layout, float vw, float vh) {
		float w = layout.parallelWidth == 0 ? 400.0f * 4.0f : layout.parallelWidth;
		float h = layout.parallelHeight == 0 ? w * (vh / vw) : layout.parallelHeight;

		float sx = 2.0f / w;
		float sy = 2.0f / h;
		float sz = 1.0f / 65536.0f;
		float tx = 2.0f * (layout.centerX + x) / vw - 1.0f;
		float ty = 2.0f * (layout.centerY + y) / vh - 1.0f;
		float tz = 0.0f;

		pm[0] =   sx; pm[4] = 0.0f; pm[ 8] = 0.0f; pm[12] =   tx;
		pm[1] = 0.0f; pm[5] =   sy; pm[ 9] = 0.0f; pm[13] =   ty;
		pm[2] = 0.0f; pm[6] = 0.0f; pm[10] =   sz; pm[14] =   tz;
		pm[3] = 0.0f; pm[7] = 0.0f; pm[11] = 0.0f; pm[15] = 1.0f;
	}

	static void perspectiveFov(float[] pm, int x, int y, FigureLayout layout, float vw, float vh) {
		float near = layout.near;
		float far = layout.far;
		float rd = 1.0f / (near - far);
		float sx = 1.0f / (float) Math.tan(layout.angle * TO_FLOAT * Math.PI);
		float sy = sx * (vw / vh);
		float sz = -(far + near) * rd;
		float tx = 2.0f * (layout.centerX + x) / vw - 1.0f;
		float ty = 2.0f * (layout.centerY + y) / vh - 1.0f;
		float tz = 2.0f * far * near * rd;

		pm[0] =   sx; pm[4] = 0.0f; pm[ 8] =   tx; pm[12] = 0.0f;
		pm[1] = 0.0f; pm[5] =   sy; pm[ 9] =   ty; pm[13] = 0.0f;
		pm[2] = 0.0f; pm[6] = 0.0f; pm[10] =   sz; pm[14] =   tz;
		pm[3] = 0.0f; pm[7] = 0.0f; pm[11] = 1.0f; pm[15] = 0.0f;
	}

	static void perspectiveWH(float[] pm, int x, int y, FigureLayout layout, float vw, float vh) {
		float zFar = layout.far;
		float zNear = layout.near;
		float width = layout.perspectiveWidth == 0 ? vw : layout.perspectiveWidth * TO_FLOAT;
		float height = layout.perspectiveHeight == 0 ? vh : layout.perspectiveHeight * TO_FLOAT;

		float rd = 1.0f / (zNear - zFar);
		float sx = 2.0f * zNear / width;
		float sy = 2.0f * zNear / height;
		float sz = -(zNear + zFar) * rd;
		float tx = 2.0f * (layout.centerX + x) / vw - 1.0f;
		float ty = 2.0f * (layout.centerY + y) / vh - 1.0f;
		float tz = 2.0f * zFar * zNear * rd;

		pm[0] =   sx; pm[4] = 0.0f; pm[ 8] =   tx; pm[12] = 0.0f;
		pm[1] = 0.0f; pm[5] =   sy; pm[ 9] =   ty; pm[13] = 0.0f;
		pm[2] = 0.0f; pm[6] = 0.0f; pm[10] =   sz; pm[14] =   tz;
		pm[3] = 0.0f; pm[7] = 0.0f; pm[11] = 1.0f; pm[15] = 0.0f;
	}

	static void getSpriteVertex(float[] quad, float[] center, int angle, float halfW, float halfH) {
		float r = angle * TO_RADIANS;
		float sin = (float) Math.sin(r);
		float cos = (float) Math.cos(r);
		float x = center[0];
		float y = center[1];
		float z = center[2];
		float w = center[3];
		quad[0] = -halfW * cos + halfH * -sin + x;
		quad[1] = -halfW * sin + halfH * cos + y;
		quad[2] = z;
		quad[3] = w;
		float bx = -halfW * cos + -halfH * -sin + x;
		float by = -halfW * sin + -halfH * cos + y;
		quad[4] = bx;
		quad[5] = by;
		quad[6] = z;
		quad[7] = w;
		float cx = halfW * cos + halfH * -sin + x;
		float cy = halfW * sin + halfH * cos + y;
		quad[8] = cx;
		quad[9] = cy;
		quad[10] = z;
		quad[11] = w;
		quad[12] = cx;
		quad[13] = cy;
		quad[14] = z;
		quad[15] = w;
		quad[16] = bx;
		quad[17] = by;
		quad[18] = z;
		quad[19] = w;
		quad[20] = halfW * cos + -halfH * -sin + x;
		quad[21] = halfW * sin + -halfH * cos + y;
		quad[22] = z;
		quad[23] = w;
	}

	private static native void fill0(float[] buffer, int bufferOffset, float[] vertices, int[] indices);

	private static native void readPixels0(int x, int y, int width, int height, Object graphics);

	private static native void transform0(float[] srcVertices, float[] dstVertices, float[] srcNormals, float[] dstNormals, byte[] bones, float[] actionMatrices);

	static native int targetSize(javax.microedition.lcdui.Graphics graphics, boolean height);

	static native void resize(int width, int height);

	static native void clearGraphics(javax.microedition.lcdui.Graphics graphics);

	static native String asset(String name);

	static void fillBuffer(FloatBuffer buffer, FloatBuffer vertices, int[] indices) {
		fill0(buffer.array(), buffer.position(), vertices.array(), indices);
	}

	static void glReadPixels(int x, int y, int width, int height, Bitmap bitmapBuffer) {
		readPixels0(x, y, width, height, bitmapBuffer.graphics);
	}

	static void transform(FloatBuffer srcVertices, FloatBuffer dstVertices, FloatBuffer srcNormals, FloatBuffer dstNormals, ByteBuffer boneMatrices, float[] actionMatrices) {
		transform0(srcVertices.array(), dstVertices.array(), srcNormals == null ? null : srcNormals.array(), dstNormals == null ? null : dstNormals.array(), boneMatrices.array(), actionMatrices);
	}

	static byte[] getResourceAsBytes(String name) throws java.io.IOException {
		java.io.InputStream in = Utils.class.getResourceAsStream(name.startsWith("/") ? name : "/" + name);
		if (in == null) {
			throw new java.io.IOException(name);
		}
		java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
		byte[] buf = new byte[4096];
		int n;
		while ((n = in.read(buf)) > 0) {
			out.write(buf, 0, n);
		}
		in.close();
		return out.toByteArray();
	}

	static long round(double d) {
		return (long) Math.floor(d + 0.5);
	}

	static long round(float f) {
		return (long) Math.floor(f + 0.5);
	}

	static int nlz(int v) {
		if (v == 0) return 32;
		int n = 0;
		while ((v & 0x80000000) == 0) {
			v <<= 1;
			n++;
		}
		return n;
	}

	static void sortInts(int[] a) {
		for (int i = 1; i < a.length; i++) {
			int v = a[i], j = i - 1;
			while (j >= 0 && a[j] > v) {
				a[j + 1] = a[j];
				j--;
			}
			a[j + 1] = v;
		}
	}

	static int search(int[] a, int key) {
		int lo = 0, hi = a.length - 1;
		while (lo <= hi) {
			int mid = (lo + hi) >>> 1;
			if (a[mid] < key) lo = mid + 1;
			else if (a[mid] > key) hi = mid - 1;
			else return mid;
		}
		return -(lo + 1);
	}

	private static int comparePolygons(Model.Polygon a, Model.Polygon b, boolean faces) {
		if (a.blendMode != b.blendMode) return a.blendMode < b.blendMode ? -1 : 1;
		if (faces && a.face != b.face) return a.face < b.face ? -1 : 1;
		return a.doubleFace - b.doubleFace;
	}

	static void sortPolygons(Model.Polygon[] a, boolean faces) {
		for (int i = 1; i < a.length; i++) {
			Model.Polygon v = a[i];
			int j = i - 1;
			while (j >= 0 && comparePolygons(a[j], v, faces) > 0) {
				a[j + 1] = a[j];
				j--;
			}
			a[j + 1] = v;
		}
	}

	static int[] copy(int[] a) {
		if (a == null) return null;
		int[] r = new int[a.length];
		System.arraycopy(a, 0, r, 0, a.length);
		return r;
	}

	static float[] copy(float[] a) {
		if (a == null) return null;
		float[] r = new float[a.length];
		System.arraycopy(a, 0, r, 0, a.length);
		return r;
	}

	static Texture[] copy(Texture[] a) {
		if (a == null) return null;
		Texture[] r = new Texture[a.length];
		System.arraycopy(a, 0, r, 0, a.length);
		return r;
	}
}
