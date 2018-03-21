import * as THREE from 'three';

const TWEEN = require('tweenjs');


/**
 * @author Thomas Kleinke
 */
export abstract class CameraManager {

    private cameraAnimation: {
        targetPosition: THREE.Vector3,
        targetQuaternion: THREE.Quaternion,
        zoom: number,
        progress: number
    }|undefined;


    public abstract initialize(canvasWidth: number, canvasHeight: number): void;


    public abstract getCamera(): THREE.PerspectiveCamera|THREE.OrthographicCamera;


    public abstract resize(canvasWidth: number, canvasHeight: number): void;


    public abstract drag(x: number, z: number): void;


    public abstract zoom(value: number, camera?: THREE.Camera): void;


    public abstract zoomSmoothly(value: number): void;


    public abstract focusMesh(mesh: THREE.Mesh, cameraRotation: number): void;


    public abstract focusPoint(point: THREE.Vector3, cameraRotation: number): void;


    public startAnimation(targetPosition: THREE.Vector3, targetQuaternion: THREE.Quaternion,
                          targetZoom: number) {

        if (this.cameraAnimation) return;

        this.cameraAnimation = {
            targetPosition: targetPosition,
            targetQuaternion: targetQuaternion,
            zoom: this.getCamera().zoom,
            progress: 0
        };

        new TWEEN.Tween(this.cameraAnimation)
            .to({ progress: 1, zoom: targetZoom }, 300)
            .easing(TWEEN.Easing.Linear.None)
            .start();
    }


    public isAnimationRunning(): boolean {

        return this.cameraAnimation != undefined;
    }


    public animate() {

        if (!this.cameraAnimation) return;

        TWEEN.update();

        this.getCamera().position.lerp(
            this.cameraAnimation.targetPosition,
            this.cameraAnimation.progress
        );

        this.getCamera().quaternion.slerp(
            this.cameraAnimation.targetQuaternion,
            this.cameraAnimation.progress
        );

        this.getCamera().zoom = this.cameraAnimation.zoom;
        this.getCamera().updateProjectionMatrix();

        if (this.cameraAnimation.progress == 1) this.cameraAnimation = undefined;
    }


    protected updatePerspectiveCameraAspect(camera: THREE.PerspectiveCamera, canvasWidth: number,
                                            canvasHeight: number) {

        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();
    }


    protected static focusPoint(camera: THREE.Camera, point: THREE.Vector3, yDistance: number,
                              cameraRotation?: number) {

        camera.position.set(
            point.x,
            camera.position.y > point.y ? camera.position.y : point.y + yDistance,
            point.z);
        camera.lookAt(point);

        if (cameraRotation) camera.rotateZ((Math.PI / 2) * cameraRotation);
    }
}