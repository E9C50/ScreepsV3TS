import { reactionSource } from "settings";

export default class LabExtension extends StructureLab {
    private labReactionWork(): void {
        // 如果Lab冷却中，就跳过
        if (this.cooldown != 0) return

        // 如果房间没有配置好两个sourceLab，就跳过
        const sourceLab1 = this.room.memory.roomLabConfig.sourceLab1
        const sourceLab2 = this.room.memory.roomLabConfig.sourceLab2
        if (sourceLab1 == undefined || sourceLab2 == undefined) return
        if (this.id == sourceLab1 || this.id == sourceLab2) return

        // 获取两个lab
        const lab1 = Game.getObjectById(sourceLab1) as StructureLab;
        const lab2 = Game.getObjectById(sourceLab2) as StructureLab;

        // 如果Lab有物质，但是两个SourceLab的物质不匹配，就跳过
        const reactionSourceList = this.mineralType ? reactionSource[this.mineralType] : []
        if (this.mineralType != undefined &&
            (lab1.mineralType != undefined && !reactionSourceList.includes(lab1.mineralType)) &&
            (lab2.mineralType != undefined && !reactionSourceList.includes(lab2.mineralType))) {
            return
        }

        // 如果两个lab中有一个没有物质，就跳过
        if (lab1.mineralType == undefined || lab2.mineralType == undefined) return
        this.runReaction(lab1, lab2);
    }

    private boostCreepWork(): void {
        if (this.room.memory.roomLabConfig.singleLabConfig[this.id] == undefined) return
        if (!this.room.memory.roomLabConfig.singleLabConfig[this.id].boostMode) return

        const labBoostBody = this.room.memory.roomLabConfig.singleLabConfig[this.id].boostPart
        const nearbyCreeps = this.pos.findInRange(FIND_MY_CREEPS, 1)
        for (let name in nearbyCreeps) {
            let creep = nearbyCreeps[name]
            if (creep.memory.needBoost && creep.body.filter(body => !body.boost && body.type == labBoostBody).length > 0) {
                console.log(this.boostCreep(creep), this.mineralType)
                return
            }
        }
        return
    }

    public init(): void {
        if (this.room.memory.roomFillJob.labOut == undefined) this.room.memory.roomFillJob.labOut = []
        if (this.room.memory.roomFillJob.labInEnergy == undefined) this.room.memory.roomFillJob.labInEnergy = []
        if (this.room.memory.roomFillJob.labInMineral == undefined) this.room.memory.roomFillJob.labInMineral = []

        // 能量不够就请求能量
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            this.room.memory.roomFillJob.labInEnergy.push(this.id)
        }

        // 如果是boost模式，且boost配置的元素和当前元素不一致，就取出
        const labConfig = this.room.memory.roomLabConfig
        const thisLabConfig = labConfig.singleLabConfig[this.id]
        const boostMode = thisLabConfig != undefined && thisLabConfig.boostMode
        if (boostMode && this.mineralType != undefined && thisLabConfig.resourceType != this.mineralType) {
            this.room.memory.roomFillJob.labOut.push(this.id)
        }

        // 如果不是boost模式，并且不是sourceLab，那么超过1000就取出
        if (!boostMode && this.id != labConfig.sourceLab1 && this.id != labConfig.sourceLab2
            && this.mineralType != undefined && this.store[this.mineralType] > 1000) {
            this.room.memory.roomFillJob.labOut.push(this.id)
        }

        // 如果有反应配置，则处理sourceLab
        if (labConfig.labReactionQueue.length > 0) {
            const reactionConfig = reactionSource[this.room.memory.roomLabConfig.labReactionQueue[0]]
            if (this.id == labConfig.sourceLab1) {
                this.room.memory.roomFillJob.labInMineral.push({ labId: this.id, resourceType: reactionConfig[0] })
            }
            if (this.id == labConfig.sourceLab2) {
                this.room.memory.roomFillJob.labInMineral.push({ labId: this.id, resourceType: reactionConfig[1] })
            }
        }

        if (boostMode && this.store[thisLabConfig.resourceType] < 3000) {
            this.room.memory.roomFillJob.labInMineral.push({ labId: this.id, resourceType: thisLabConfig.resourceType })
        }
    }

    public doWork(): void {
        const thisLabConfig = this.room.memory.roomLabConfig.singleLabConfig[this.id]
        if (thisLabConfig != undefined && thisLabConfig.boostMode) {
            this.boostCreepWork()
        } else {
            this.labReactionWork()
        }
    }
}
