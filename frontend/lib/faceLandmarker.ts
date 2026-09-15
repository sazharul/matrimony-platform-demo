import {
    FaceLandmarker,
    FilesetResolver,
    type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

let instance: FaceLandmarker | null = null;
let loading: Promise<FaceLandmarker> | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
    if (instance) return instance;
    if (loading) return loading;

    loading = (async () => {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        instance = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath:
                    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
                delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
        });
        return instance;
    })();

    return loading;
}

export type { FaceLandmarkerResult };