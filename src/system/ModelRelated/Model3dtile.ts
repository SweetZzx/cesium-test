import { Cartesian3, Cartographic, Cesium3DTileset, Matrix3, Matrix4, Transforms, Math as CesiumMath } from "cesium"

export default class Model3dtile {
    /* ===== 用户可调的量 ===== */
    deltaLongitudeDeg = 0; // °
    deltaLatitudeDeg = 0; // °
    deltaHeight = 0; // m

    headingDeg = 0; // °
    pitchDeg = 0; // °
    rollDeg = 0; // °

    /* ===== 内部缓存 ===== */
    private tileset: Cesium3DTileset;
    private enuToFixed = Matrix4.IDENTITY.clone();   // ENU → World
    private fixedToEnu = Matrix4.IDENTITY.clone();   // World → ENU
    private originCartesian = new Cartesian3();      // 模型中心（世界坐标）

    constructor(tileset: Cesium3DTileset) {
        this.tileset = tileset;
        // 只算一次
        this.originCartesian = Cartesian3.clone(tileset.boundingSphere.center);
        this.enuToFixed = Transforms.eastNorthUpToFixedFrame(this.originCartesian);
        Matrix4.inverse(this.enuToFixed, this.fixedToEnu);
    }

    /* ---------------- 平移 ---------------- */
    changeLongitudeDeg(delta: number) {

        this.deltaLongitudeDeg = delta / 1000;
        this.apply();
    }

    changeLatitudeDeg(delta: number) {

        this.deltaLatitudeDeg = delta / 1000;
        this.apply();
    }

    changeHeight(delta: number) {

        this.deltaHeight = delta;
        this.apply();
    }

    /* ---------------- 旋转 ---------------- */
    changeHeadingDeg(delta: number) {
        this.headingDeg = delta;
        this.apply();
    }
    changePitchDeg(delta: number) {
        this.pitchDeg = delta;
        this.apply();
    }
    changeRollDeg(delta: number) {
        this.rollDeg = delta;
        this.apply();
    }


    private apply() {
        // 1. 本地平移量（ENU 坐标系）
        const dx = this.deltaLongitudeDeg * 111319 * Math.cos(
            Cartographic.fromCartesian(this.originCartesian).latitude
        );
        const dy = this.deltaLatitudeDeg * 111133;
        const dz = this.deltaHeight;

        // 2. 本地旋转矩阵（顺序：HPR → ZYX）
        const rotZ = Matrix3.fromRotationZ(CesiumMath.toRadians(this.headingDeg));
        const rotY = Matrix3.fromRotationY(CesiumMath.toRadians(this.pitchDeg));
        const rotX = Matrix3.fromRotationX(CesiumMath.toRadians(this.rollDeg));
        let localRot = Matrix3.multiply(rotZ, rotY, new Matrix3());
        localRot = Matrix3.multiply(localRot, rotX, localRot);
        const localRotMat4 = Matrix4.fromRotationTranslation(localRot);

        // 3. 本地平移矩阵
        const localTrans = Matrix4.fromTranslation(new Cartesian3(dx, dy, dz));

        // 4. ENU 系下 先平移再旋转
        let localMatrix = Matrix4.multiply(localTrans, localRotMat4, new Matrix4());

        // 5. 转到世界坐标系
        let modelMatrix = Matrix4.multiply(
            this.enuToFixed,
            localMatrix,
            new Matrix4()
        );
        // 6. 再乘回原始模型矩阵
        modelMatrix = Matrix4.multiply(
            modelMatrix,
            this.fixedToEnu,
            modelMatrix
        );

        this.tileset.modelMatrix = modelMatrix;
    }

    /** 一键复位：所有平移/旋转清零，模型回到初始状态 */
    reset() {
        // 1. 清用户量
        this.deltaLongitudeDeg = 0;
        this.deltaLatitudeDeg = 0;
        this.deltaHeight = 0;

        this.headingDeg = 0;
        this.pitchDeg = 0;
        this.rollDeg = 0;

        // 2. 还原模型矩阵
        this.tileset.modelMatrix = Matrix4.IDENTITY.clone();
    }
}



