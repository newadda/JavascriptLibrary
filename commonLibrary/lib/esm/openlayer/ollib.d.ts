import Overlay from 'ol/Overlay.js';
import Feature from 'ol/Feature.js';
declare class OGISProperty {
    center: any[2];
    zoom: Number;
    projection: String;
}
/**
 * 만들어야 될 기능
 * - 다중선택시 콜백과 페이지 던지기
 *  - layer 정보과 피처를 같이 던져야 한다.
 * - 단일 선택시 UI
 * - 편집
 *  - 피쳐 편집
 *  - 피쳐 생성(포인트, 라인, 폴리곤)
 * - 연결된 정보 뷰(사라지지 않고 연결되었다.)
 *
 */
declare class OverlayManager {
    overlay: Overlay;
    constructor(overlay: Overlay);
    overlayerClose(): void;
}
type MultiSelectContainer = (overlayManager: OverlayManager, featureList: Array<Feature>) => HTMLElement;
type MultiSelectListener = (featureList: Array<Feature>) => void;
declare class OGIS {
    #private;
    private _targetElement;
    private _mapView?;
    private _map?;
    private multiSelectOverlay?;
    multiSelectContainer: MultiSelectContainer;
    multiSelectListener?: MultiSelectListener;
    private overlayManager?;
    constructor(target: Element, options?: OGISProperty);
    init(options: OGISProperty): void;
    test(): void;
}
export { OGIS };