import { getDistance } from "utils";

export default class CreepExtension extends Creep {

    /**
     * 转移资源到指定目标
     * @param creep
     * @param transferTarget
     * @param resourceType
     * @returns
     */
    public transferToTarget(transferTarget: Structure, resourceType: ResourceConstant): boolean {
        if (transferTarget == undefined) return false
        if (getDistance(this.pos, transferTarget.pos) <= 1) {
            this.transfer(transferTarget, resourceType)
            return true
        } else {
            this.moveTo(transferTarget)
            return false
        }
    }

    /**
     * 从指定地方取出资源
     * @param takeTarget
     * @param resourceType
     * @param amount
     */
    public takeFromTarget(takeTarget: Structure, resourceType: ResourceConstant, amount?: number): boolean {
        if (takeTarget == undefined) return false
        if (getDistance(this.pos, takeTarget.pos) <= 1) {
            this.withdraw(takeTarget, resourceType, amount)
            return true
        } else {
            this.moveTo(takeTarget)
            return false
        }
    }

    /**
     * 捡起地上的资源
     * @param allSource
     * @param range
     * @returns
     */
    public pickupDroppedResource(allSource: boolean, range: number): boolean {
        // 没有携带空间的跳过
        if (this.store.getFreeCapacity() == 0) return false
        const spawnRoomStorage = Game.rooms[this.memory.spawnRoom].storage

        // 优先捡起附近掉落的资源
        const droppedEnergy = this.room.droppedResource.filter(
            resource => resource.amount > 100 && getDistance(resource.pos, this.pos) <= range
        );
        if (droppedEnergy.length > 0) {
            const resource = droppedEnergy[0] as Resource
            if ((allSource && spawnRoomStorage != undefined) || resource.resourceType == RESOURCE_ENERGY) {
                if (getDistance(resource.pos, this.pos) > 1) {
                    this.moveTo(resource);
                } else {
                    this.pickup(resource)
                }
                return true;
            }
        }

        // 查找附近的墓碑和废墟
        const tombstones: Tombstone[] = this.room.tombstones.filter(tombstone =>
            getDistance(tombstone.pos, this.pos) <= range && tombstone.store.getUsedCapacity() > 0
        );
        const ruins: Ruin[] = this.room.ruins.filter(ruin =>
            getDistance(ruin.pos, this.pos) <= range && ruin.store.getUsedCapacity() > 0
        );
        const destroyed: (Tombstone | Ruin)[] = [...ruins, ...tombstones];

        // 捡取资源
        if (destroyed.length > 0) {
            for (let resource in destroyed[0].store) {
                if (resource != RESOURCE_ENERGY && (!allSource || spawnRoomStorage == undefined)) {
                    continue;
                }
                if (getDistance(destroyed[0].pos, this.pos) > 1) {
                    this.moveTo(destroyed[0]);
                } else {
                    this.withdraw(destroyed[0], resource as ResourceConstant)
                }
            }
            return true;
        }
        return false;
    }
}
