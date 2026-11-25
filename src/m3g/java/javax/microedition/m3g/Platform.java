/*
 * Copyright (c) 2009 Nokia Corporation and/or its subsidiary(-ies).
 * All rights reserved.
 * This component and the accompanying materials are made available
 * under the terms of "Eclipse Public License v1.0"
 * which accompanies this distribution, and is available
 * at the URL "http://www.eclipse.org/legal/epl-v10.html".
 *
 * Initial Contributors:
 * Nokia Corporation - initial contribution.
 *
 * Contributors:
 *
 * Description:
 *
 */
package javax.microedition.m3g;

class Platform {
	static void executeInUIThread(M3gRunnable obj) {
		if (obj != null) {
			obj.run();
			obj.checkAndThrow();
		}
	}

	static boolean uiThreadAvailable() {
		return true;
	}

	static final void heuristicGC() {
	}

	static final native void registerFinalizer(Object obj, int handle);

	static final native void finalizeInterface(int handle);

	static final void finalizeObject(int handle) {
		_finalizeObject(handle);
	}

	static final void finalizeObject(int handle, Interface aInterface) {
		_finalizeObject(handle);
	}

	private static final native void _finalizeObject(int handle);
}
