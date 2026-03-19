import {
    BufferGeometry,
    DoubleSide,
    Line,
    LineBasicMaterial,
    Mesh,
    MeshBasicMaterial,
    Scene,
    Shape,
    ShapeGeometry,
    Vector3
} from "three";
import {HIGHLIGHTED_COLOR, ObjectElevation} from "../../constants/Types";
import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";
import {createFloorCeilingEmptyLabel} from "../../components/Labels";
import {DrawerMath} from "../../components/DrawerMath";
import {ISceneObject} from "../ISceneObject";

export class PolygonFloorCeiling implements ISceneObject {

    private static readonly LINE_MATERIAL = new LineBasicMaterial({
        color: 0x444444,
    });
    private static readonly FILL_MATERIAL = new MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.3,
        side: DoubleSide
    });
    private static readonly HIGHLIGHTED_MATERIAL = new LineBasicMaterial({
        color: HIGHLIGHTED_COLOR,
    });

    public readonly points: Array<Vector3>;
    private readonly outline: Line<BufferGeometry, LineBasicMaterial>;
    private readonly fill: Mesh<ShapeGeometry, MeshBasicMaterial>;
    private readonly label: CSS2DObject;

    public constructor(points: Array<Vector3>) {
        this.points = points;
        
        // Ensure points are at floor elevation
        this.points.forEach(p => p.y = ObjectElevation.FLOOR);

        const outlinePoints = [...points, points[0]];
        const outlineGeo = new BufferGeometry().setFromPoints(outlinePoints);
        this.outline = new Line(outlineGeo, PolygonFloorCeiling.LINE_MATERIAL);

        const shape = new Shape();
        shape.moveTo(points[0].x, points[0].z);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].z);
        }
        const fillGeo = new ShapeGeometry(shape);
        this.fill = new Mesh(fillGeo, PolygonFloorCeiling.FILL_MATERIAL);
        this.fill.rotation.x = Math.PI / 2;
        this.fill.position.y = ObjectElevation.FLOOR;

        this.label = new CSS2DObject(createFloorCeilingEmptyLabel());
        this.updateLabel();
    }

    public addTo(scene: Scene): void {
        scene.add(this.outline);
        scene.add(this.fill);
        this.addLabel();
    }

    public removeFrom(scene: Scene): void {
        scene.remove(this.outline);
        scene.remove(this.fill);
        this.removeLabel();
        this.outline.geometry.dispose();
        this.fill.geometry.dispose();
    }

    public highlight(): void {
        this.outline.material = PolygonFloorCeiling.HIGHLIGHTED_MATERIAL;
    }

    public unHighlight(): void {
        this.outline.material = PolygonFloorCeiling.LINE_MATERIAL;
    }

    public addLabel(): void {
        this.outline.add(this.label);
    }

    public removeLabel(): void {
        this.outline.remove(this.label);
    }

    private updateLabel() {
        const area = DrawerMath.calculatePolygonArea(this.points);
        const centroid = new Vector3(0, ObjectElevation.FLOOR, 0);
        this.points.forEach(p => {
            centroid.x += p.x;
            centroid.z += p.z;
        });
        centroid.x /= this.points.length;
        centroid.z /= this.points.length;

        this.label.position.copy(centroid);
        this.label.element.textContent = "Area: " + (area / 10).toFixed(2) + " m2"; 
    }
}
