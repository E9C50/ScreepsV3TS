import { creepWhiteList, roleAdvEnum, STRUCTURE_MEMORYKEY_PERFIX, STRUCTURE_PRIVATEKEY_PERFIX } from "settings";
import { generateCostMatrix } from "utils/CostMatrix";
import { getDistance } from "utils";

export default class RoomExtension extends Room {

    private getStructure<T extends Structure>(structureType: string, privateKey: string, memoryKey: string): T | undefined {
        if (this[privateKey] != undefined) return (this[privateKey])
        const cacheId = global[this.name].structureIdList[memoryKey]

        if (cacheId != undefined) {
            this[privateKey] = Game.getObjectById(cacheId) as T;
            if (this[privateKey] == undefined) {
                global[this.name].structureIdList[memoryKey] = undefined
            }
        } else {
            const filterd = this.structures.filter(structure => structure.structureType == structureType)
            if (filterd.length == 0) return undefined
            const structure: T = filterd[0] as T

            this[privateKey] = structure
            global[this.name].structureIdList[memoryKey] = structure.id
        }
        return this[privateKey]
    }

    private getStructures<T extends Structure>(structureType: string, privateKey: string, memoryKey: string): T[] {
        if (this[privateKey] != undefined) return (this[privateKey])
        const cacheIdList = global[this.name].structureIdList[memoryKey]

        if (cacheIdList != undefined) {
            this[privateKey] = cacheIdList.map(structureId => Game.getObjectById(structureId));
            const filterd = this[privateKey].filter(strcuture => strcuture != undefined)
            if (filterd.length < this[privateKey].length) {
                this[privateKey] = filterd
                global[this.name].structureIdList[memoryKey] = filterd.map(structure => structure.id)
            }
        } else {
            const structures: T[] = this.structures
                .filter(structure => structure.structureType == structureType)
                .map(structure => structure as T)

            this[privateKey] = structures
            global[this.name].structureIdList[memoryKey] = structures.map(structure => structure.id)
        }
        return this[privateKey]
    }

    // Room基础属性
    public myGetter(): boolean {
        return this.controller != null && this.controller.my
    }

    public levelGetter(): number {
        return this.controller?.level || this.invaderCore?.level || 0
    }

    // 矿物资源缓存
    public sourcesGetter(): Source[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'SOURCES'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'SOURCES'
        if (this[privateKey]) return this[privateKey]

        const sources: Source[] = global[this.name].structureIdList[memoryKey] == undefined ? [] :
            global[this.name].structureIdList[memoryKey]
                .map(sourceId => Game.getObjectById(sourceId))
                .filter(source => source != undefined)
        if (sources.length > 0) {
            this[privateKey] = sources;
            return sources
        } else {
            const sources: Source[] = this.find(FIND_SOURCES)
            global[this.name].structureIdList[memoryKey] = sources.map(source => source.id)
            return sources
        }
    }
    public mineralGetter(): Mineral | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'MINERAL'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'MINERAL'
        if (this[privateKey]) return this[privateKey]

        const mineral: Mineral = Game.getObjectById(global[this.name].structureIdList[memoryKey]) as Mineral
        if (mineral != undefined) {
            this[privateKey] = mineral;
            return mineral
        } else {
            const minerals: Mineral[] = this.find(FIND_MINERALS)
            if (minerals.length == 0) return undefined
            global[this.name].structureIdList[memoryKey] = minerals[0].id
            return minerals[0]
        }
    }

    // 敌人缓存
    public enemiesGetter(): (Creep | PowerCreep)[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'ENEMIES'
        if (this[privateKey]) {
            return this[privateKey]
        }
        const enemieCreeps: Creep[] = this.find(FIND_HOSTILE_CREEPS)
            .filter(creep => !creepWhiteList.includes(creep.owner.username))
        const enemiePcs: PowerCreep[] = this.find(FIND_HOSTILE_POWER_CREEPS)
            .filter(creep => !creepWhiteList.includes(creep.owner.username))

        const enemies = [...enemieCreeps, ...enemiePcs]
        this[privateKey] = enemies
        return enemies
    }

    // 废墟、墓碑和掉落资源缓存
    public ruinsGetter(): Ruin[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'RUINS'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'RUINS'
        if (this[privateKey]) return this[privateKey]

        const ruins: Ruin[] = this.find(FIND_RUINS)
        this[privateKey] = ruins
        return ruins
    }

    public tombstonesGetter(): Tombstone[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'TOMBSTONES'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'TOMBSTONES'
        if (this[privateKey]) return this[privateKey]

        const tombstones: Tombstone[] = this.find(FIND_TOMBSTONES)
        this[privateKey] = tombstones
        return tombstones
    }

    public droppedResourceGetter(): Resource[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'DROPPED_RESOURCE'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'DROPPED_RESOURCE'
        if (this[privateKey]) return this[privateKey]

        const droppedResources: Resource[] = this.find(FIND_DROPPED_RESOURCES)
        this[privateKey] = droppedResources
        return droppedResources
    }

    // 需要修复的墙缓存
    public wallsNeedRepairGetter(): Structure[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'WALLS_NEED_REPAIR'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'WALLS_NEED_REPAIR'
        if (this[privateKey]) return this[privateKey]

        const walls: Structure[] = [...this.ramparts, ...this.walls].filter(structure => {
            var filterRam = true;
            var filterWall = true;
            if (structure.structureType == STRUCTURE_RAMPART) {
                filterRam = structure.hits < 300000000 || structure.pos.lookFor(LOOK_STRUCTURES).filter(stru =>
                    stru.structureType != STRUCTURE_ROAD && stru.structureType != STRUCTURE_RAMPART
                ).length == 0
            } else {
                filterWall = structure.hits < 300000000
            }
            return structure.hits < structure.hitsMax && filterRam && filterWall
        })

        this[privateKey] = walls
        return walls
    }

    // 需要维修的建筑缓存
    public structuresNeedRepairGetter(): Structure[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURES_NEED_REPAIR'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURES_NEED_REPAIR'
        if (this[privateKey]) return this[privateKey]

        let structures: Structure[] = [
            ...this.roads, ...this.extensions, ...this.spawns, ...this.towers,
            ...this.labs, ...this.containers, ...this.links
        ]
        if (this.nuker != undefined) structures.push(this.nuker)
        if (this.storage != undefined) structures.push(this.storage)
        if (this.factory != undefined) structures.push(this.factory)
        if (this.terminal != undefined) structures.push(this.terminal)
        if (this.observer != undefined) structures.push(this.observer)
        if (this.extractor != undefined) structures.push(this.extractor)
        if (this.powerSpawn != undefined) structures.push(this.powerSpawn)

        structures = structures.filter(structure =>
            structure.hits < structure.hitsMax
        )

        this[privateKey] = structures
        return structures
    }

    // 全局建筑缓存
    public structuresGetter(): Structure[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE'
        if (this[privateKey]) return this[privateKey]

        const structures: Structure[] = this.find(FIND_STRUCTURES)
        this[privateKey] = structures
        return structures
    }

    public constructionSitesGetter(): ConstructionSite[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'CONSTRUCTION_SITE'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'CONSTRUCTION_SITE'
        if (this[privateKey]) return this[privateKey]

        const cacheIdList = global[this.name].structureIdList[memoryKey]
        if (cacheIdList != undefined) {
            this[privateKey] = cacheIdList.map(structureId => Game.getObjectById(structureId));
            const filterd = this[privateKey].filter(strcuture => strcuture != undefined)
            if (filterd.length < this[privateKey].length) {
                this[privateKey] = filterd
                global[this.name].structureIdList[memoryKey] = filterd.map(constructionSite => constructionSite.id)
            }
        } else {
            const constructionSites: ConstructionSite[] = this.find(FIND_CONSTRUCTION_SITES)
            global[this.name].structureIdList[memoryKey] = constructionSites.map(constructionSite => constructionSite.id)
        }

        return this[privateKey] || []
    }

    public centerLinkGetter(): StructureLink | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_CENTER_LINK'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_CENTER_LINK'
        if (this[privateKey]) return this[privateKey]

        const link: StructureLink = Game.getObjectById(global[this.name].structureIdList[memoryKey]) as StructureLink
        if (link != undefined) {
            this[privateKey] = link;
            return link
        } else {
            const link = this.links.filter(link => this.storage && getDistance(this.storage.pos, link.pos) <= 2)[0]
            global[this.name].structureIdList[memoryKey] = link?.id
            this[privateKey] = link;
            return link
        }
    }

    public controllerLinkGetter(): StructureLink | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_CONTROLLER_LINK'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_CONTROLLER_LINK'
        if (this[privateKey]) return this[privateKey]

        const link: StructureLink = Game.getObjectById(global[this.name].structureIdList[memoryKey]) as StructureLink
        if (link != undefined) {
            this[privateKey] = link;
            return link
        } else {
            const link = this.links.filter(link => this.controller && getDistance(this.controller.pos, link.pos) <= 2)[0]
            global[this.name].structureIdList[memoryKey] = link?.id
            this[privateKey] = link;
            return link
        }
    }

    // 单个建筑缓存
    public nukerGetter(): StructureNuker | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_NUKER'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_NUKER'
        return this.getStructure<StructureNuker>(STRUCTURE_NUKER, privateKey, memoryKey)
    }
    public extractorGetter(): StructureExtractor | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_EXTRACTOR'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_EXTRACTOR'
        return this.getStructure<StructureExtractor>(STRUCTURE_EXTRACTOR, privateKey, memoryKey)
    }
    public factoryGetter(): StructureFactory | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_FACTORY'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_FACTORY'
        return this.getStructure<StructureFactory>(STRUCTURE_FACTORY, privateKey, memoryKey)
    }
    public observerGetter(): StructureObserver | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_OBSERVER'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_OBSERVER'
        return this.getStructure<StructureObserver>(STRUCTURE_OBSERVER, privateKey, memoryKey)
    }
    public powerSpawnGetter(): StructurePowerSpawn | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_POWER_SPAWN'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_POWER_SPAWN'
        return this.getStructure<StructurePowerSpawn>(STRUCTURE_POWER_SPAWN, privateKey, memoryKey)
    }
    public invaderCoreGetter(): StructureInvaderCore | undefined {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_INVADER_CORE'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_INVADER_CORE'
        return this.getStructure<StructureInvaderCore>(STRUCTURE_INVADER_CORE, privateKey, memoryKey)
    }

    // 多个建筑缓存
    public spawnsGetter(): StructureSpawn[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_SPAWN'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_SPAWN'
        return this.getStructures<StructureSpawn>(STRUCTURE_SPAWN, privateKey, memoryKey)
    }
    public extensionsGetter(): StructureExtension[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_EXTENSION'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_EXTENSION'
        return this.getStructures<StructureExtension>(STRUCTURE_EXTENSION, privateKey, memoryKey)
    }
    public towersGetter(): StructureTower[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_TOWER'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_TOWER'
        return this.getStructures<StructureTower>(STRUCTURE_TOWER, privateKey, memoryKey)
    }
    public containersGetter(): StructureContainer[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_CONTAINER'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_CONTAINER'
        return this.getStructures<StructureContainer>(STRUCTURE_CONTAINER, privateKey, memoryKey)
    }
    public linksGetter(): StructureLink[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_LINK'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_LINK'
        return this.getStructures<StructureLink>(STRUCTURE_LINK, privateKey, memoryKey)
    }
    public labsGetter(): StructureLab[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_LAB'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_LAB'
        return this.getStructures<StructureLab>(STRUCTURE_LAB, privateKey, memoryKey)
    }
    public roadsGetter(): StructureRoad[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_ROAD'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_ROAD'
        return this.getStructures<StructureRoad>(STRUCTURE_ROAD, privateKey, memoryKey)
    }
    public wallsGetter(): StructureWall[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_WALL'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_WALL'
        return this.getStructures<StructureWall>(STRUCTURE_WALL, privateKey, memoryKey)
    }
    public rampartsGetter(): StructureRampart[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_RAMPART'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_RAMPART'
        return this.getStructures<StructureRampart>(STRUCTURE_RAMPART, privateKey, memoryKey)
    }
    public keeperLairsGetter(): StructureKeeperLair[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_KEEPER_LAIR'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_KEEPER_LAIR'
        return this.getStructures<StructureKeeperLair>(STRUCTURE_KEEPER_LAIR, privateKey, memoryKey)
    }
    public portalsGetter(): StructurePortal[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_PORTAL'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_PORTAL'
        return this.getStructures<StructurePortal>(STRUCTURE_PORTAL, privateKey, memoryKey)
    }
    public powerBanksGetter(): StructurePowerBank[] {
        const privateKey = STRUCTURE_PRIVATEKEY_PERFIX + 'STRUCTURE_POWER_BANK'
        const memoryKey = STRUCTURE_MEMORYKEY_PERFIX + 'STRUCTURE_POWER_BANK'
        return this.getStructures<StructurePowerBank>(STRUCTURE_POWER_BANK, privateKey, memoryKey)
    }

    /**
     * 添加资源发送任务
     * @param targetRoom
     * @param resourceType
     * @param amount
     * @returns
     */
    public sendResource(targetRoom: string, resourceType: ResourceConstant, amount: number): boolean {
        const jobId = this.name + '_' + targetRoom + '_' + resourceType
        this.memory.terminalSendJob[jobId] = {
            targetRoom: targetRoom,
            resourceType: resourceType,
            amount: amount
        }
        return true
    }

    /**
     * 获取房间内的资源数量
     * @param resType
     * @param storage
     * @param terminal
     * @param lab
     * @param processer
     */
    public getResource(resType: ResourceConstant, storage?: boolean, terminal?: boolean, lab?: boolean, processer?: boolean): number {
        if (storage == undefined) storage = true
        if (terminal == undefined) terminal = false
        if (processer == undefined) processer = false
        if (lab == undefined) lab = false

        let totalAmount = 0
        if (storage && this.storage != undefined) {
            totalAmount += this.storage.store[resType]
        }

        if (terminal && this.terminal != undefined) {
            totalAmount += this.terminal.store[resType]
        }

        if (lab && this.labs.length > 0) {
            this.labs.forEach(lab => totalAmount += lab.store[resType])
        }

        if (processer) {
            Object.values(Game.creeps).forEach(creep => {
                if (creep.room.name != this.name) return
                if (creep.memory.role != roleAdvEnum.PROCESSER) return
                totalAmount += creep.store[resType]
            })
        }
        return totalAmount
    }

    /**
     * 获取并转换CostMatrix
     */
    public getDefenderCostMatrix(): CostMatrix {
        if (global[this.name].defenderCostMatrix == undefined || Game.time % 10 == 0) {
            if (Game.cpu.bucket < 100) return new PathFinder.CostMatrix();
            global[this.name].defenderCostMatrix = generateCostMatrix(this.name)
        }
        return global[this.name].defenderCostMatrix
    }

    /**
     * 发射核弹
     */
    public launchNuke(): boolean {
        const nukeFlag = Game.flags['nuke']
        if (!this.my || this.nuker == undefined || nukeFlag == undefined) return false
        if (this.nuker.cooldown != 0 || this.nuker.store[RESOURCE_GHODIUM] < 5000 || this.nuker.store[RESOURCE_ENERGY] < 300000) return false

        console.log(this.nuker.launchNuke(nukeFlag.pos))
        return true
    }
}
