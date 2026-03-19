import {
    BufferGeometry,
    DoubleSide,
    Line,
    LineDashedMaterial,
    Mesh,
    MeshBasicMaterial,
    Scene,
    Shape,
    ShapeGeometry,
    Vector3,
    SphereGeometry,
    Group
} from "three";
import {ObjectElevation} from "../../constants/Types";
import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";
import {createFloorCeilingEmptyLabel} from "../../components/Labels";
import {DrawerMath} from "../../components/DrawerMath";
import {ISceneObject} from "../ISceneObject";

export class AreaMeasurement implements ISceneObject {

    private static readonly LINE_MATERIAL = new LineDashedMaterial({
        color: 0x0088ff,
        dashSize: 1,
        gapSize: 0.5,
    });
    private static readonly FILL_MATERIAL = new MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.3,
        side: DoubleSide
    });
    private static readonly POINT_MATERIAL = new MeshBasicMaterial({
        color: 0x0044ff,
    });

    public points: Array<Vector3> = [];
    private outline: Line;
    private fill: Mesh;
    private label: CSS2DObject;
    private pointsGroup: Group;
    private scene: Scene | null = null;

    public constructor() {
        this.outline = new Line(new BufferGeometry(), AreaMeasurement.LINE_MATERIAL);
        this.fill = new Mesh(new BufferGeometry(), AreaMeasurement.FILL_MATERIAL);
        this.fill.rotation.x = Math.PI / 2;
        this.fill.position.y = ObjectElevation.UI;

        this.pointsGroup = new Group();

        this.label = new CSS2DObject(createFloorCeilingEmptyLabel());
        this.label.element.style.pointerEvents = 'none';
    }

    public updatePoints(newPoints: Array<Vector3>) {
        this.points = newPoints;
        
        // Update Points visualization
        while(this.pointsGroup.children.length > 0){ 
            const child = this.pointsGroup.children[0] as Mesh;
            child.geometry.dispose();
            this.pointsGroup.remove(child); 
        }
        
        this.points.forEach(p => {
            const sphere = new Mesh(new SphereGeometry(0.2), AreaMeasurement.POINT_MATERIAL);
            sphere.position.copy(p);
            sphere.position.y = ObjectElevation.UI;
            this.pointsGroup.add(sphere);
        });

        if (this.points.length < 2) {
            this.outline.visible = false;
            this.fill.visible = false;
            return;
        }

        this.outline.visible = true;
        const displayPoints = [...this.points];
        if (this.points.length > 2) displayPoints.push(this.points[0]);
        
        this.outline.geometry.dispose();
        this.outline.geometry = new BufferGeometry().setFromPoints(displayPoints);
        this.outline.computeLineDistances();

        if (this.points.length >= 3) {
            this.fill.visible = true;
            const shape = new Shape();
            shape.moveTo(this.points[0].x, this.points[0].z);
            for (let i = 1; i < this.points.length; i++) {
                shape.lineTo(this.points[i].x, this.points[i].z);
            }
            this.fill.geometry.dispose();
            this.fill.geometry = new ShapeGeometry(shape);
            this.updateLabel();
        } else {
            this.fill.visible = false;
            this.label.element.textContent = "";
        }
    }

    private updateLabel() {
        const area = DrawerMath.calculatePolygonArea(this.points);
        const centroid = new Vector3(0, ObjectElevation.UI, 0);
        this.points.forEach(p => {
            centroid.x += p.x;
            centroid.z += p.z;
        });
        centroid.x /= this.points.length;
        centroid.z /= this.points.length;

        this.label.position.copy(centroid);
        this.label.element.textContent = "Area: " + (area / 10).toFixed(2) + " m2";
        this.label.element.className = "planner-label area-measurement-label";
    }

    public addTo(scene: Scene): void {
        this.scene = scene;
        scene.add(this.outline);
        scene.add(this.fill);
        scene.add(this.pointsGroup);
        this.outline.add(this.label);
    }

    public removeFrom(scene: Scene): void {
        if (this.scene) {
            this.scene.remove(this.outline);
            this.scene.remove(this.fill);
            this.scene.remove(this.pointsGroup);
            this.outline.remove(this.label);
        }
        this.outline.geometry.dispose();
        this.fill.geometry.dispose();
        while(this.pointsGroup.children.length > 0){ 
            const child = this.pointsGroup.children[0] as Mesh;
            child.geometry.dispose();
            this.pointsGroup.remove(child); 
        }
    }

    public highlight(): void {}
    public unHighlight(): void {}
    public addLabel(): void { this.outline.add(this.label); }
    public removeLabel(): void { this.outline.remove(this.label); }
}
