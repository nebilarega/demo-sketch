import { IInputHandler } from "../../../common/canvas/inputHandler/IInputHandler";
import { InputPoint } from "../../../common/canvas/inputHandler/MainInputHandler";
import { AreaMeasurement } from "../../objects/floor/AreaMeasurement";
import { Scene, Vector3 } from "three";

export class AreaCalculationIH implements IInputHandler {
    private readonly scene: Scene;
    private measurement: AreaMeasurement;
    private points: Array<Vector3> = [];
    private isDrawing: boolean = false;
    private readonly onAreaAdded: (area: AreaMeasurement) => void;

    public constructor(scene: Scene, onAreaAdded: (area: AreaMeasurement) => void) {
        this.scene = scene;
        this.onAreaAdded = onAreaAdded;
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

    public finish(): void {
        if (this.isDrawing && this.points.length >= 3) {
            this.onAreaAdded(this.measurement);
            // Prepare for next one
            this.measurement = new AreaMeasurement();
            this.points = [];
            this.isDrawing = false;
        } else if (this.isDrawing) {
            this.handleCancel();
        }
    }

    public handleCancel(): void {
        this.isDrawing = false;
        this.points = [];
        this.measurement.removeFrom(this.scene);
        this.measurement = new AreaMeasurement();
    }
}
