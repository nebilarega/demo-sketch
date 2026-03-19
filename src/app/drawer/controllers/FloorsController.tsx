import React, {useCallback, useContext, useEffect, useState} from "react";
import { FactorySubcomponentProps } from "./ControllerFactory";
import {FloorPlanContext, MainControllerType} from "./FloorPlanMainController";
import {FloorsDrawingIH} from "../IO/inputHandlers/floorsDrawing/FloorsDrawingIH";
import {Button, ListGroup} from "react-bootstrap";
import {PRIMARY_VARIANT, SECONDARY_VARIANT, SELECTED_VARIANT} from "../../arranger/constants/Types";
import {IInputHandler} from "../../common/canvas/inputHandler/IInputHandler";
import {VoidIH} from "../../common/canvas/inputHandler/VoidIH";
import {RemoveObjectIH} from "../IO/inputHandlers/RemoveObjectIH";
import {AreaCalculationIH} from "../IO/inputHandlers/AreaCalculationIH";
import {AreaMeasurement} from "../objects/floor/AreaMeasurement";

enum Menu {
    ADD = "Add floor along with ceiling",
    DELETE = "Remove floor along with ceiling",
    CALCULATE_AREA = "Calculate area",
}

export const FloorsController: React.FC<FactorySubcomponentProps> = ({ goBack }) => {
    const context = useContext(FloorPlanContext);
    if (context === undefined) {
        throw new Error("Context in FloorsController is undefined.");
    }

    useEffect(() => {
        context.changeMenuName(MainControllerType.FLOORS);
    }, [context.changeMenuName]);

    const [menu, setMenu] = useState<Menu>();
    const [inputHandler, setInputHandler] = useState<IInputHandler>(new VoidIH());
    const [areas, setAreas] = useState<Array<AreaMeasurement>>([]);

    const onAreaAdded = useCallback((area: AreaMeasurement) => {
        setAreas(prev => [...prev, area]);
    }, []);

    const removeAllAreas = () => {
        areas.forEach(a => a.removeFrom(context.scene));
        setAreas([]);
    };

    const handleCancel = () => {
        inputHandler.handleCancel();
    };

    useEffect(() => {
        switch (menu) {
            case Menu.ADD:
                setInputHandler(new FloorsDrawingIH(context.floorsDrawer));
                break;
            case Menu.DELETE:
                setInputHandler(new RemoveObjectIH(context.floorsRemover));
                break;
            case Menu.CALCULATE_AREA:
                setInputHandler(new AreaCalculationIH(context.scene, onAreaAdded));
                break;
            default:
                setInputHandler(new VoidIH());
        }
    }, [menu, context.floorsDrawer, context.floorsRemover, context.scene, onAreaAdded]);

    useEffect(() => {
        context.mainInputHandler.changeHandlingStrategy(inputHandler);
    }, [inputHandler, context.mainInputHandler]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && menu === Menu.CALCULATE_AREA) {
                if (inputHandler instanceof AreaCalculationIH) {
                    inputHandler.finish();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [inputHandler, menu]);

    useEffect(() => () => {
        handleCancel();
        context.mainInputHandler.detachCurrentHandler();
        // We don't remove areas on unmount to keep them visible as requested
    }, [inputHandler, context.mainInputHandler]);

    const cancelButton = (menu !== Menu.ADD && menu !== Menu.CALCULATE_AREA) ? null :
        <Button onClick={handleCancel} variant={PRIMARY_VARIANT} className="side-by-side-child btn-sm">
            Cancel
        </Button>;

    const areaList = menu !== Menu.CALCULATE_AREA ? null : (
        <div style={{ marginTop: '10px', maxHeight: '100px', overflowY: 'auto', width: '100%' }}>
            <div className="side-by-side-parent" style={{ marginBottom: '5px' }}>
                <span className="side-by-side-child">Measurements:</span>
                <Button onClick={removeAllAreas} variant="danger" className="side-by-side-child btn-sm">Clear All</Button>
            </div>
            <ListGroup>
                {areas.map((area, index) => (
                    <ListGroup.Item 
                        key={area.id}
                        onMouseEnter={() => area.highlight()}
                        onMouseLeave={() => area.unHighlight()}
                        style={{ cursor: 'pointer', padding: '5px 10px', fontSize: '12px' }}
                    >
                        Area {index + 1}: {(area.getArea() / 100).toFixed(2)} m2
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="side-by-side-parent">
                <Button onClick={goBack} variant={PRIMARY_VARIANT} className="side-by-side-child btn-sm">
                    Back
                </Button>
                {cancelButton}
            </div>
            <OperationSelection currentMenu={menu} setMenu={setMenu}/>
            {areaList}
        </div>
    );
};

type OperationSelectionProps = {
    currentMenu: Menu | undefined,
    setMenu: (value: Menu) => void,
}

const OperationSelection: React.FC<OperationSelectionProps> = ({ currentMenu, setMenu }) => {

    const addVariant = currentMenu === Menu.ADD ? SELECTED_VARIANT : SECONDARY_VARIANT;
    const deleteVariant = currentMenu === Menu.DELETE ? SELECTED_VARIANT : SECONDARY_VARIANT;
    const calculateVariant = currentMenu === Menu.CALCULATE_AREA ? SELECTED_VARIANT : SECONDARY_VARIANT;

    return (
        <div className="side-by-side-parent">
            <Button onClick={() => setMenu(Menu.ADD)} variant={addVariant} className="side-by-side-child btn-sm">
                {Menu.ADD}
            </Button>
            <Button onClick={() => setMenu(Menu.DELETE)} variant={deleteVariant} className="side-by-side-child btn-sm">
                {Menu.DELETE}
            </Button>
            <Button onClick={() => setMenu(Menu.CALCULATE_AREA)} variant={calculateVariant} className="side-by-side-child btn-sm">
                {Menu.CALCULATE_AREA}
            </Button>
        </div>
    );
};
