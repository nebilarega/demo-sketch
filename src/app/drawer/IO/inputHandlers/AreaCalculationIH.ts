import { IInputHandler } from "../../../common/canvas/inputHandler/IInputHandler";
import { InputPoint } from "../../../common/canvas/inputHandler/MainInputHandler";
import { AreaMeasurement } from "../../objects/floor/AreaMeasurement";
import { Scene, Vector3 } from "three";

export class AreaCalculationIH implements IInputHandler {
    private readonly scene: Scene;
    private measurement: AreaMeasurement;
    private points: Array<Vector3> = [];
    private isDrawing: boolean = false;

    public constructor(scene: Scene) {
        this.scene = scene;
        this.measurement = new AreaMeasurement();
    }

    public handleMovement({ unprojected }: InputPoint): void {
        if (!this.isDrawing) return;

        // Visual preview: current fixed points + where the mouse is
        const previewPoints = [...this.points, unprojected];
        this.measurement.updatePoints(previewPoints);
    }

    public handleClick({ unprojected }: InputPoint): void {
        if (!this.isDrawing) {
            this.isDrawing = true;
            this.points = [unprojected.clone()];
            this.measurement.addTo(this.scene);
        } else {
            this.points.push(unprojected.clone());
        }
        this.measurement.updatePoints(this.points);
    }

    public handleCancel(): void {
        this.isDrawing = false;
        this.points = [];
        this.measurement.removeFrom(this.scene);
    }
}
