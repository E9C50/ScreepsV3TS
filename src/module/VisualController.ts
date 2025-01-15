import { reactionSource } from "settings";

function showCreepCountInfo(room: Room): void {
    //  统计当前数量
    let roleCounts = {};
    for (let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        let role = creep.memory.role;
        let creepRoom = creep.memory.spawnRoom;

        if (role && creepRoom == room.name) {
            if (!roleCounts[role]) {
                roleCounts[role] = 0;
            }
            roleCounts[role]++;
        }
    }

    //  统计最大数量
    let roleMaxCounts = {};
    for (let creepName in room.memory.creepConfig) {
        let creep = room.memory.creepConfig[creepName];
        let role = creep.role;

        if (role) {
            if (!roleMaxCounts[role]) {
                roleMaxCounts[role] = 0;
            }
            roleMaxCounts[role]++;
        }
    }

    // 显示统计信息
    var index = 0
    const svFlag = Game.flags['SV']
    const svPos = svFlag == undefined ? undefined : new RoomPosition(svFlag.pos.x + 1, svFlag.pos.y, svFlag.pos.roomName)
    const infoPos = svPos || (room.controller && room.controller.pos);
    if (infoPos) {
        index = infoPos.y
        for (let role in roleCounts) {
            if (roleMaxCounts[role] == undefined) roleMaxCounts[role] = 0
            const checkText = (roleCounts[role] == roleMaxCounts[role]) ? '✅ ' : (roleCounts[role] > roleMaxCounts[role]) ? '⏳ ' : '❌ ';
            const countText = checkText + roleCounts[role] + '/' + roleMaxCounts[role];

            if (roleCounts[role] > 0 || roleMaxCounts[role] > 0) {
                room.visual.text(countText + '  ' + role, infoPos.x, index, { align: 'left' });
                // room.visual.text(countText, infoPos.x + 8, index, { align: 'right' });
                index++;
            }
        }

        for (let i = 0; i < room.memory.creepSpawnQueue.length; i++) {
            room.visual.text(room.memory.creepSpawnQueue[i], infoPos.x, index + 1, { font: 0.5, align: 'left' });
            index++;
        }
    }

}

export const visualController = function (): void {
    for (const roomName in Game.rooms) {
        const room: Room = Game.rooms[roomName];
        if (!room.my) continue;
        if (Game.flags['SV'] == undefined) continue;

        // 显示Spawn孵化进度
        room.spawns.forEach(spawn => {
            if (spawn.spawning) {
                const spawnPercent = ((spawn.spawning.needTime - spawn.spawning.remainingTime) / spawn.spawning.needTime * 100).toFixed(2);
                const role = Game.creeps[spawn.spawning.name].memory.role;
                room.visual.text(role + ' ' + spawnPercent + ' %', spawn.pos.x, spawn.pos.y + 2, { align: 'center' });
            }
        });

        // 显示控制器升级进度
        if (room.controller && room.level < 8) {
            const controllerPercent = (room.controller.progress / room.controller.progressTotal * 100).toFixed(2);
            room.visual.text(controllerPercent + ' %' + '', room.controller.pos.x, room.controller.pos.y + 2, { align: 'center' });
        }

        // 显示部分建筑能量存储信息 [...room.containers, ...room.towers]
        room.containers.forEach(structure => {
            if (structure) {
                var showText = (structure.store.getUsedCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) * 100).toFixed(2) + ' %';
                room.visual.text(showText, structure.pos.x, structure.pos.y + 2, { align: 'center' });
            }
        })

        // 显示Storage能量存储信息
        // if (room.storage) {
        //     room.visual.text(room.storage.store[RESOURCE_ENERGY].toString(), room.storage.pos.x, room.storage.pos.y + 2, { align: 'center' });
        // }

        // 显示Lab Boost配置信息
        Object.keys(room.memory.roomLabConfig.singleLabConfig).forEach(labId => {
            if (room.memory.roomLabConfig.singleLabConfig[labId].boostMode) {
                const lab = Game.getObjectById<StructureLab>(labId)
                const type = room.memory.roomLabConfig.singleLabConfig[labId].resourceType
                if (lab) room.visual.text(type, lab.pos.x, lab.pos.y, { align: 'center', color: 'red', font: 0.3 });
            }
        });

        // 显示Lab合成配置
        const sourceLab1 = room.memory.roomLabConfig.sourceLab1
        const sourceLab2 = room.memory.roomLabConfig.sourceLab2
        if (sourceLab1 != undefined && sourceLab2 != undefined && room.memory.roomLabConfig.labReactionQueue[0]) {
            const lab1 = Game.getObjectById<StructureLab>(sourceLab1)
            const lab2 = Game.getObjectById<StructureLab>(sourceLab2)

            const source = reactionSource[room.memory.roomLabConfig.labReactionQueue[0]]

            if (lab1) room.visual.text(source[0], lab1.pos.x, lab1.pos.y, { align: 'center', color: 'blue' });
            if (lab2) room.visual.text(source[1], lab2.pos.x, lab2.pos.y, { align: 'center', color: 'blue' });
        }



        showCreepCountInfo(room);
    }
}
