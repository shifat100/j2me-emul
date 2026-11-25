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

JNIEXPORT jboolean JNICALL Java_javax_microedition_m3g_Graphics3D__1isProperRenderer
(JNIEnv*, jclass)
{
    return true;
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1bindGraphics
(JNIEnv* aEnv, jclass, jlong aCtx, jint aWidth, jint aHeight,
 jint aClipX, jint aClipY, jint aClipW, jint aClipH, jboolean aDepth, jint aHintBits)
{
    M3GRenderContext ctx = (M3GRenderContext)aCtx;
    M3G_DO_LOCK
    if (m3gSetRenderBuffers(ctx, aDepth ? M3G_COLOR_BUFFER_BIT|M3G_DEPTH_BUFFER_BIT : M3G_COLOR_BUFFER_BIT)
        && m3gSetRenderHints(ctx, aHintBits))
    {
        m3gBindMemoryTarget(ctx, (M3Gubyte *)16, aWidth, aHeight, M3G_RGB8_32, (M3Guint)(aWidth * 4), 0);
        m3gSetClipRect(ctx, aClipX, aClipY, aClipW, aClipH);
        m3gSetViewport(ctx, aClipX, aClipY, aClipW, aClipH);
    }
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1setViewport
(JNIEnv* aEnv, jclass, jlong aHContext, jint aX, jint aY,
 jint aWidth, jint aHeight)
{
    M3G_DO_LOCK
    m3gSetViewport((M3GRenderContext)aHContext, aX, aY, aWidth, aHeight);
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1releaseGraphics
(JNIEnv* aEnv, jclass, jlong aHandle)
{
    M3G_DO_LOCK
    m3gReleaseTarget((M3GRenderContext)aHandle);
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1setCamera
(JNIEnv* aEnv, jclass, jlong aHContext, jlong aHCamera, jbyteArray aTransform)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (Matrix *)(aEnv->GetByteArrayElements(aTransform, NULL));
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return;
        }
    }

    M3G_DO_LOCK
    m3gSetCamera((M3GRenderContext) aHContext, (M3GCamera) aHCamera, transform);
    M3G_DO_UNLOCK(aEnv)

    if (transform)
    {
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, JNI_ABORT);
    }
}

/*
static void renderWorld(M3GRenderContext aHContext,
                        M3GWorld aHWorld)
{
    m3gRenderWorld(aHContext, aHWorld);
}
*/

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1renderWorld
(JNIEnv* aEnv, jclass, jlong aHContext, jlong aHWorld)
{
    M3G_DO_LOCK

    m3gRenderWorld((M3GRenderContext) aHContext, (M3GWorld) aHWorld);

    /*
    CJavaM3GEventSource* eventSource = JavaUnhand<CJavaM3GEventSource>(aEventSourceHandle);
    eventSource->ExecuteV(&renderWorld,
                       (M3GRenderContext) aHContext,
                       (M3GWorld) aHWorld);
    */
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT jlong JNICALL Java_javax_microedition_m3g_Graphics3D__1ctor
(JNIEnv* aEnv, jclass, jlong aM3g)
{
    M3G_DO_LOCK
    M3GRenderContext ctx = m3gCreateContext((M3GInterface)aM3g);
    M3G_DO_UNLOCK(aEnv)

    return (jlong)ctx;
}

struct RenderStruct
{
    M3GVertexBuffer hVertices;
    M3GIndexBuffer hIndices;
    M3GAppearance hAppearance;
    const M3GMatrix *transform;
};

/*
static void renderImmediate(M3GRenderContext aHContext, RenderStruct *aR, jint aScope)
{
    m3gRender(aHContext,
              aR->hVertices,
              aR->hIndices,
              aR->hAppearance,
              aR->transform, 1.0f, aScope);
}
*/

/*
 * Must be executed in UI thread
 */

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1render
(JNIEnv* aEnv, jclass, jlong aHContext,
 jlong aHVertices, jlong aHIndices, jlong aHAppearance, jbyteArray aTransform, jint aScope)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (M3GMatrix *)aEnv->GetByteArrayElements(aTransform, NULL);
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return;
        }
    }

    /*
    RenderStruct r;
    r.hVertices = (M3GVertexBuffer) aHVertices;
    r.hIndices = (M3GIndexBuffer) aHIndices;
    r.hAppearance = (M3GAppearance) aHAppearance;
    r.transform = transform;
    */


    M3G_DO_LOCK

    m3gRender((M3GRenderContext) aHContext, (M3GVertexBuffer) aHVertices, (M3GIndexBuffer) aHIndices, (M3GAppearance) aHAppearance,
              transform, 1.0f, aScope);

    /*
      CJavaM3GEventSource* eventSource = JavaUnhand<CJavaM3GEventSource>(aEventSourceHandle);
    eventSource->ExecuteV(&renderImmediate, ((M3GRenderContext) aHContext), &r, aScope);
    */
    M3G_DO_UNLOCK(aEnv)


    if (transform)
    {
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, JNI_ABORT);
    }
}

/*
static void clear(M3GRenderContext aHContext, M3GBackground aHBackground)
{
    m3gClear(aHContext, aHBackground);
}
*/

/*
 * Must be executed in UI thread
 */
JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1clear
(JNIEnv* aEnv, jclass, jlong aCtx, jlong aBg)
{
    M3G_DO_LOCK
    m3gClear((M3GRenderContext)aCtx, (M3GBackground)aBg);

    /*
    CJavaM3GEventSource* eventSource = JavaUnhand<CJavaM3GEventSource>(aEventSourceHandle);
    eventSource->ExecuteV(&clear, (M3GRenderContext)aCtx, (M3GBackground)aBg);
    */
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1releaseImage
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    M3G_DO_LOCK

    m3gReleaseTarget((M3GRenderContext)aHCtx);

    /*
    CJavaM3GEventSource* eventSource = JavaUnhand<CJavaM3GEventSource>(aEventSourceHandle);
    eventSource->ExecuteV(&releaseTarget, (M3GRenderContext)aHCtx);
    */
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1addRef
(JNIEnv* aEnv, jclass, jlong aObject)
{
    M3G_DO_LOCK
    m3gAddRef((M3GObject) aObject);
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1addLight
(JNIEnv* aEnv, jclass, jlong aHContext, jlong aHLight, jbyteArray aTransform)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (M3GMatrix *)(aEnv->GetByteArrayElements(aTransform, NULL));
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return 0;
        }
    }
    M3G_DO_LOCK
    int idx = m3gAddLight((M3GRenderContext) aHContext, (M3GLight) aHLight, transform);
    M3G_DO_UNLOCK(aEnv)

    if (transform)
    {
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, JNI_ABORT);
    }

    return idx;
}

/*
static void bindImage(M3GRenderContext hCtx, M3GImage hImg, M3Gbool depth, M3Gbitmask hintBits)
{
    if (m3gSetRenderBuffers(hCtx, depth ? M3G_COLOR_BUFFER_BIT|M3G_DEPTH_BUFFER_BIT : M3G_COLOR_BUFFER_BIT) && m3gSetRenderHints(hCtx, hintBits)) {
        m3gBindImageTarget(hCtx, hImg);
    }
}
*/

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1bindImage
(JNIEnv* aEnv, jclass, jlong aHCtx, jlong aImageHandle, jboolean aDepth, jint aHintBits)
{
    M3G_DO_LOCK

    if (m3gSetRenderBuffers((M3GRenderContext)aHCtx, (M3Gbool)aDepth ? M3G_COLOR_BUFFER_BIT|M3G_DEPTH_BUFFER_BIT : M3G_COLOR_BUFFER_BIT) && m3gSetRenderHints((M3GRenderContext)aHCtx, (M3Gbitmask)aHintBits))
    {
        m3gBindImageTarget((M3GRenderContext)aHCtx, (M3GImage)aImageHandle);
    }

    //CJavaM3GEventSource* eventSource = JavaUnhand<CJavaM3GEventSource>(aEventSourceHandle);
    //eventSource->ExecuteV(&bindImage, (M3GRenderContext)aHCtx, (M3GImage)aImageHandle, (M3Gbool)aDepth, (M3Gbitmask)aHintBits);
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1resetLights
(JNIEnv* aEnv, jclass, jlong aHContext)
{
    M3G_DO_LOCK
    m3gClearLights((M3GRenderContext) aHContext);
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1setDepthRange
(JNIEnv* aEnv, jclass, jlong aHContext, jfloat aDepthNear, jfloat aDepthFar)
{
    M3G_DO_LOCK
    m3gSetDepthRange((M3GRenderContext) aHContext, aDepthNear, aDepthFar);
    M3G_DO_UNLOCK(aEnv)
}

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1setLight
(JNIEnv* aEnv, jclass, jlong aHContext, jint aLightIndex, jlong aHLight, jbyteArray aTransform)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (M3GMatrix *)(aEnv->GetByteArrayElements(aTransform, NULL));
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return;
        }
    }

    M3G_DO_LOCK
    m3gSetLight((M3GRenderContext) aHContext, aLightIndex, (M3GLight) aHLight, transform);
    M3G_DO_UNLOCK(aEnv)

    if (transform)
    {
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, JNI_ABORT);
    }
}

/*
static void renderNode(M3GRenderContext aHCtx,
                       M3GNode aHNode,
                       const M3GMatrix *aMtx)
{
    m3gRenderNode(aHCtx, aHNode, aMtx);
}
*/

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1renderNode
(JNIEnv* aEnv, jclass, jlong aHCtx, jlong aHNode, jbyteArray aTransform)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (M3GMatrix *)(aEnv->GetByteArrayElements(aTransform, NULL));
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return;
        }
    }

    M3G_DO_LOCK

    m3gRenderNode((M3GRenderContext)aHCtx, (M3GNode)aHNode, (const M3GMatrix *)transform);

    //CJavaM3GEventSource* eventSource = JavaUnhand<CJavaM3GEventSource>(aEventSourceHandle);
    //eventSource->ExecuteV(&renderNode, (M3GRenderContext)aHCtx, (M3GNode)aHNode, (const M3GMatrix *)transform);
    M3G_DO_UNLOCK(aEnv)

    if (aTransform)
    {
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, JNI_ABORT);
    }
}

#if defined(M3G_ENABLE_PROFILING)

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1getStatistics
(JNIEnv* aEnv, jclass, jintArray aStatArray)
{
    const M3Gint *statArray = (M3Gint *)(aStatArray != NULL ? aEnv->GetIntArrayElements(aStatArray, NULL) : NULL);
    jint statArrayLength = aStatArray ? aEnv->GetArrayLength(aStatArray) : 0;

    if (statArray != NULL && statArrayLength >= sizeof(m3gs_statistic))
    {
        m3gCopy((void*)statArray, m3gs_statistic, sizeof(m3gs_statistic));
    }

    M3G_DO_LOCK
    m3gZero(m3gs_statistic, sizeof(m3gs_statistic));
    M3G_DO_UNLOCK(aEnv)

    if (statArray)
    {
        aEnv->ReleaseIntArrayElements(aStatArray, (jint*)statArray, 0);
    }

    return sizeof(m3gs_statistic);
}

#endif /* M3G_ENABLE_PROFILING */



/* M3G 1.1 JNI Calls */

JNIEXPORT void JNICALL Java_javax_microedition_m3g_Graphics3D__1getViewTransform
(JNIEnv* aEnv, jclass, jlong aHCtx, jbyteArray aTransform)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (M3GMatrix *)(aEnv->GetByteArrayElements(aTransform, NULL));
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return;
        }
    }

    M3G_DO_LOCK
    m3gGetViewTransform((M3GRenderContext) aHCtx, transform);
    M3G_DO_UNLOCK(aEnv)

    if (transform)
    {
        /* copy array to Java side and release arrays */
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, 0);
    }
}

JNIEXPORT jlong JNICALL Java_javax_microedition_m3g_Graphics3D__1getCamera
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    M3G_DO_LOCK
    jlong camera = (jlong)m3gGetCamera((M3GRenderContext)aHCtx);
    M3G_DO_UNLOCK(aEnv)

    return camera;
}

JNIEXPORT jlong JNICALL Java_javax_microedition_m3g_Graphics3D__1getLightTransform
(JNIEnv* aEnv, jclass, jlong aHCtx, jint aLightIndex, jbyteArray aTransform)
{
    M3GMatrix *transform = NULL;
    if (aTransform)
    {
        transform = (M3GMatrix *)(aEnv->GetByteArrayElements(aTransform, NULL));
        if (transform == NULL)
        {
            M3G_RAISE_EXCEPTION(aEnv, "java/lang/OutOfMemoryError");
            return 0;
        }
    }
    M3G_DO_LOCK
    jlong lightTransform = (jlong)m3gGetLightTransform((M3GRenderContext)aHCtx, aLightIndex, transform);
    M3G_DO_UNLOCK(aEnv)

    if (transform)
    {
        aEnv->ReleaseByteArrayElements(aTransform, (jbyte*)transform, 0);
    }

    return (jlong)lightTransform;
}

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1getLightCount
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    M3G_DO_LOCK
    jint lightCount = (jint)m3gGetLightCount((M3GRenderContext)aHCtx);
    M3G_DO_UNLOCK(aEnv)

    return lightCount;
}

JNIEXPORT jfloat JNICALL Java_javax_microedition_m3g_Graphics3D__1getDepthRangeNear
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    float depthNear = 0;
    float depthFar = 0;

    M3G_DO_LOCK
    m3gGetDepthRange((M3GRenderContext) aHCtx, &depthNear, &depthFar);
    M3G_DO_UNLOCK(aEnv)

    return (jfloat)depthNear;
}

JNIEXPORT jfloat JNICALL Java_javax_microedition_m3g_Graphics3D__1getDepthRangeFar
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    float depthNear = 0;
    float depthFar = 0;

    M3G_DO_LOCK
    m3gGetDepthRange((M3GRenderContext) aHCtx, &depthNear, &depthFar);
    M3G_DO_UNLOCK(aEnv)

    return (jfloat)depthFar;
}

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1getViewportX
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    int viewport[4];

    M3G_DO_LOCK
    m3gGetViewport((M3GRenderContext)aHCtx, &viewport[0],
                   &viewport[1],
                   &viewport[2],
                   &viewport[3]);
    M3G_DO_UNLOCK(aEnv)

    return (jint)viewport[0];
}

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1getViewportY
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    int viewport[4];

    M3G_DO_LOCK
    m3gGetViewport((M3GRenderContext)aHCtx, &viewport[0],
                   &viewport[1],
                   &viewport[2],
                   &viewport[3]);
    M3G_DO_UNLOCK(aEnv)

    return (jint)viewport[1];
}

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1getViewportWidth
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    int viewport[4];

    M3G_DO_LOCK
    m3gGetViewport((M3GRenderContext)aHCtx, &viewport[0],
                   &viewport[1],
                   &viewport[2],
                   &viewport[3]);
    M3G_DO_UNLOCK(aEnv)

    return (jint)viewport[2];
}

JNIEXPORT jint JNICALL Java_javax_microedition_m3g_Graphics3D__1getViewportHeight
(JNIEnv* aEnv, jclass, jlong aHCtx)
{
    int viewport[4];

    M3G_DO_LOCK
    m3gGetViewport((M3GRenderContext)aHCtx, &viewport[0],
                   &viewport[1],
                   &viewport[2],
                   &viewport[3]);
    M3G_DO_UNLOCK(aEnv)

    return (jint)viewport[3];
}

JNIEXPORT jboolean JNICALL Java_javax_microedition_m3g_Graphics3D__1isAASupported
(JNIEnv* /*aEnv*/, jclass, jlong aM3g)
{
    M3Gbool aaSupport = M3G_FALSE;

    aaSupport = m3gIsAntialiasingSupported((M3GInterface)aM3g);

    return (jboolean)aaSupport;
}
