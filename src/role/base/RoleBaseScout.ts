import { defaultReserverSign } from "settings/room"

export default (data: CreepData): ICreepConfig => ({
    isNeed: (room: Room, creepName: string) => {
        return true
    },
    prepare(creep) {
        return true
    },
    source(creep) {
        creep.memory.working = true
        return true
    },
    target(creep) {
        const creepData: ScoutData = data as ScoutData

        // 优先去标点位置
        const targetFlag = Game.flags[creepData.targetFlag]

        if (targetFlag != undefined && !creep.pos.isEqualTo(targetFlag.pos)) {
            creep.moveTo(targetFlag)

            if (creep.room.controller && targetFlag.pos.isEqualTo(creep.room.controller)
                && creep.pos.isNearTo(creep.room.controller) && creep.room.controller.sign?.username != creep.owner.username) {
                creep.signController(creep.room.controller, defaultReserverSign)
            }
            return true
        }

        // 没有标点位置就检查没有视野的外矿，去探路
        for (let i = 0; i < 10; i++) {
            const flag = Game.flags[creep.memory.spawnRoom + '_OUT' + i]
            if (flag == undefined) continue
            if (Game.rooms[flag.pos.roomName] == undefined) {
                creep.moveTo(new RoomPosition(25, 25, flag.pos.roomName))
                return true
            }

            const myCreeps = Game.rooms[flag.pos.roomName].find(FIND_MY_CREEPS)
            if (myCreeps.length == 0 || (myCreeps.length == 1 && myCreeps[0].id == creep.id)) {
                creep.moveTo(flag.pos.x, flag.pos.y, { range: 3 })
                return true
            }
        }

        return true
    },
})
