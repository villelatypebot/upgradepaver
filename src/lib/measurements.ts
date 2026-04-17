export interface MeasurementArea {
    id: string;
    label: string;
    width: number;
    length: number;
}

export const MAX_MEASUREMENT_AREAS = 4;

const DEFAULT_AREA_LABELS = ["Patio", "Driveway", "Walkway", "Side Yard"];

function buildMeasurementAreaId() {
    return `area-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeDimension(value: number) {
    return Number.isFinite(value) && value > 0 ? value : 0;
}

export function createMeasurementArea(index = 0): MeasurementArea {
    return {
        id: buildMeasurementAreaId(),
        label: DEFAULT_AREA_LABELS[index] || `Area ${index + 1}`,
        width: 0,
        length: 0,
    };
}

export function getAreaSqft(area: MeasurementArea) {
    return sanitizeDimension(area.width) * sanitizeDimension(area.length);
}

export function hasMeasurementArea(area: MeasurementArea) {
    return getAreaSqft(area) > 0;
}

export function getCompletedMeasurementAreas(areas: MeasurementArea[]) {
    return areas.filter(hasMeasurementArea);
}

export function getTotalMeasurementSqft(areas: MeasurementArea[]) {
    return areas.reduce((total, area) => total + getAreaSqft(area), 0);
}

export function formatMeasurementAreaLabel(area: MeasurementArea, index: number) {
    return area.label.trim() || `Area ${index + 1}`;
}
