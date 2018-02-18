import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {MeshGeometry} from './mesh-geometry';
import {LineBuilder} from './line-builder';
import {getPointVector} from '../../../../../util/util-3d';


/**
 * @author Thomas Kleinke
 */

export class PolygonBuilder {

    constructor(private lineBuilder: LineBuilder,
                private projectConfiguration: ProjectConfiguration) {}


    public buildPolygon(document: IdaiFieldDocument): MeshGeometry {

        const mesh: THREE.Mesh = this.createMesh(document);

        return {
            mesh: mesh,
            raycasterObject: mesh,
            document: document
        };
    }


    private createMesh(document: IdaiFieldDocument): THREE.Mesh {

        const geometry: THREE.Geometry = this.createGeometry(document);

        const material: THREE.Material = new THREE.MeshPhongMaterial({
            color: this.projectConfiguration.getColorForType(document.resource.type),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.add(this.lineBuilder.buildPolygonOutline(document));

        return mesh;
    }


    private createGeometry(document: IdaiFieldDocument): THREE.Geometry {

        const shape: THREE.Shape = new THREE.Shape();

        const points: Array<THREE.Vector3>
            = PolygonBuilder.getPointVectors((document.resource.geometry as IdaiFieldGeometry).coordinates);

        shape.moveTo(points[0].x, points[0].z);

        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].z);
        }

        const geometry: THREE.Geometry = new THREE.ShapeGeometry(shape);

        geometry.vertices.forEach(vertex => {
            vertex.z = vertex.y;
            vertex.y = PolygonBuilder.findNearestPoint(new THREE.Vector2(vertex.x, vertex.z), points).y;
        });

        return geometry;
    }


    private static getPointVectors(coordinates: number[][][]): Array<THREE.Vector3> {

        const pointVectors: Array<THREE.Vector3> = [];

        coordinates[0].forEach(point => {
            pointVectors.push(getPointVector(point));
        });

        return pointVectors;
    }


    private static findNearestPoint(point: THREE.Vector2, points: Array<THREE.Vector3>): THREE.Vector3 {

        let nearestPoint: THREE.Vector3 = points[0];
        let smallestDistance: number;

        points.forEach(p => {
            const point2D: THREE.Vector2 = new THREE.Vector2(p.x, p.z);
            const distance: number = point2D.distanceTo(point);
            if (!smallestDistance || smallestDistance > distance) {
                smallestDistance = distance;
                nearestPoint = p;
            }
        });

        return nearestPoint;
    }
}