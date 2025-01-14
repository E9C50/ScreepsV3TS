
// 房间基础运营
type BaseRoleHarvester = 'harvester'
type BaseRoleFiller = 'filler'
type BaseRoleUpgrader = 'upgrader'
type BaseRoleBuilder = 'builder'
type BaseRoleRepairer = 'repairer'
type BaseRoleMiner = 'miner'
type BaseRoleScout = 'scout'

// 房间高级运营
type AdvancedRoleManager = 'manager'
type AdvancedRoleProcesser = 'processer'
type AdvancedRoleClaimer = 'claimer'
type AdvancedRoleReserver = 'reserver'
type AdvancedRoleRemoteHarvester = 'rHarvester'
type AdvancedRoleRemoteFiller = 'rFiller'
type AdvancedRoleRemoteBuilder = 'rBuilder'

// 战争角色
type WarRoleAttacker = 'attacker'
type WarRoleHealer = 'healer'
type WarRoleRangedAttacker = 'rAttacker'
type WarRoleDismantler = 'dismantler'
type WarRoleIntegrate = 'integrate'


// 所有的 creep 角色
type CreepRoleConstant = BaseRoleHarvester | BaseRoleFiller | BaseRoleUpgrader | BaseRoleBuilder | BaseRoleRepairer
    | BaseRoleMiner | BaseRoleScout | AdvancedRoleManager | AdvancedRoleProcesser | AdvancedRoleClaimer
    | AdvancedRoleReserver | AdvancedRoleRemoteHarvester | AdvancedRoleRemoteFiller | AdvancedRoleRemoteBuilder
    | WarRoleAttacker | WarRoleHealer | WarRoleRangedAttacker | WarRoleDismantler | WarRoleIntegrate

// Creep 工作逻辑集合 包含了每个角色应该做的工作
type CreepWork = { [role in CreepRoleConstant]: (data: CreepData) => ICreepConfig }

// 所有 Creep 角色的 Data 数据
type CreepData = EmptyData | HarvesterData | MineralData | FillerData | BuilderData | RepairerData

declare module NodeJS {
    // 全局对象
    interface Global {
        BetterMove: {
            deletePathInRoom: (roomName: string) => boolean
        }
    }
}

interface Memory {
    warMode: boolean
}

interface Room {
    my: boolean
    level: number

    enemies: Creep[]

    // 建筑缓存一键访问
    mineral: Mineral
    sources: Source[]

    ruins: Ruin[]
    tombstones: Tombstone[]
    droppedResource: Resource[]

    wallsNeedRepair: Structure[]
    structuresNeedRepair: Structure[]

    structures: Structure[]
    constructionSites: ConstructionSite[]

    roads: StructureRoad[]
    spawns: StructureSpawn[]
    ramparts: StructureRampart[]
    extensions: StructureExtension[]
    walls: StructureWall[]

    labs: StructureLab[]
    links: StructureLink[]
    towers: StructureTower[]
    containers: StructureContainer[]

    keeperLairs: StructureKeeperLair[]
    powerBanks: StructurePowerBank[]
    portals: StructurePortal[]

    nuker?: StructureNuker
    factory?: StructureFactory
    observer?: StructureObserver
    extractor?: StructureExtractor
    powerSpawn?: StructurePowerSpawn
    invaderCore?: StructureInvaderCore
    // storage: StructureStorage
    // terminal: StructureTerminal
    // controller: StructureController

    centerLink?: StructureLink
    controllerLink?: StructureLink
}

// Creep 基本工作接口定义
interface ICreepConfig {
    // 每次死后都会进行判断，只有返回 true 时才会重新发布孵化任务
    isNeed: (room: Room, creepName: string) => boolean
    // 准备阶段执行的方法, 返回 true 时代表准备完成
    // doWork: (creep: Creep) => void
    // 准备阶段执行的方法, 返回 true 时代表准备完成
    prepare: (creep: Creep) => boolean
    // creep 获取工作所需资源时执行的方法
    // 返回 true 则执行 target 阶段，返回其他将继续执行该方法
    source: (creep: Creep) => boolean
    // creep 工作时执行的方法,
    // 返回 true 则执行 source 阶段，返回其他将继续执行该方法
    target: (creep: Creep) => boolean
}

// Creep通用函数定义
interface Creep {
    transferToTarget(transferTarget: Structure, resourceType: ResourceConstant): boolean
    takeFromTarget(takeTarget: Structure, resourceType: ResourceConstant, amount?: number): boolean
    pickupDroppedResource(allSource: boolean, range: number): boolean
}

interface Source {
    freeSpaceCount: number
}

interface Mineral {
    freeSpaceCount: number
}

interface Structure {
    init(): void
    doWork(): void
}

// 反应底物表接口
interface IReactionSource {
    [targetResourceName: string]: (MineralConstant | MineralCompoundConstant)[]
}

type BoostConfigMode = 'WAR' | 'WORK'

type BoostConfig = {
    [type in BoostConfigMode]: BoostResourceConfig
}

type BoostResourceConfig = {
    [type in BodyPartConstant]: ResourceConstant[]
}

type BoostLabConfig = {
    resourceType: MineralBoostConstant
    bodyPart: BodyPartConstant
}

// interface RoomCustomMemory {
//     reserving?: string[]
//     remoteHarvester?: string[]
//     remoteFiller?: { [roomName: string]: string }
//     remoteBuilder?: { [roomName: string]: string }

//     claimer?: string[]
//     reserver?: string[]
//     dismantle?: string[]
//     attacker?: string[]
//     healer?: string[]
//     integrate?: string[]

//     processTaksQueue?: string[]

//     repairerCount?: number
//     computeRoomCenterShow?: number
// }

interface IRoomPositionList {
    managerPos?: RoomPosition
    centerPos?: RoomPosition
}

interface IRoomStructurePos {
    towerAllowRepair?: string
}

interface IRoomFillJob {
    extension?: boolean
    tower?: string[]

    powerSpawnEnergy?: boolean
    powerSpawnPower?: boolean

    nukerEnergy?: boolean
    nukerMineral?: boolean

    labOut?: string[]
    labInEnergy?: string[]
    labInMineral?: {
        labId: string
        resourceType: ResourceConstant
    }[]
}

interface ILabConfig {
    sourceLab1?: string
    sourceLab2?: string

    labReactionQueue: ResourceConstant[]
    singleLabConfig: {
        [labId: string]: {
            boostMode: boolean
            boostPart: BodyPartConstant
            resourceType: ResourceConstant
        }
    }
}

interface RoomMemory {
    structureIdList: {}

    freeSpaceCount: { [sourceId: string]: number }
    creepConfig: { [creepName: string]: CreepMemory }

    resourceAmount: { [resourceType: string]: number }
    terminalAmount: { [resourceType: string]: number }

    enemyTarget?: string
    creepSpawnQueue: string[]

    // roomCustom: RoomCustomMemory
    roomPosition: IRoomPositionList
    roomStructurePos: IRoomStructurePos

    roomFillJob: IRoomFillJob
    roomLabConfig: ILabConfig

    autoLaylout?: boolean
    needUpdateCache?: boolean
    centerLinkSentMode?: boolean
    enableTowerRepairWall?: boolean
}

interface CreepMemory {
    displayName: string
    name: string
    role: CreepRoleConstant
    ready: boolean
    working: boolean
    spawnRoom: string
    spawnPriority: number
    data: CreepData
    dontPullMe?: boolean
    needBoost?: boolean
    pathCache?: PathFinderPath
}

interface EmptyData { }

interface HarvesterData { sourceId: string, buildTarget?: string }
interface MineralData { sourceId: string }
interface FillerData { sourceId: string }

interface ManagerData { }
interface ProcesserData { waiting: number }

interface UpgraderData { sourceId: string }
interface BuilderData { sourceId: string, buildTarget?: string }
interface RepairerData { sourceId: string, repairTarget?: string }

interface ScoutData { targetFlag: string }
interface ReserverData { targetRoom: string }
interface ClaimerData { targetRoom: string, sourceId: string, buildTarget?: string }

interface RemoteFillerData { sourceFlag: string, targetFlag: string, withdrawTarget?: string, needRecycle?: boolean }
interface RemoteBuilderData { sourceFlag: string, targetFlag: string, buildTarget?: string }
interface RemoteHarvesterData { sourceId: string, targetRoom: string, buildTarget?: string }

interface HealerData { targetFlag: string, targetCreep?: string, team?: string }
interface AttackerData { targetFlag: string, team?: string }
interface IntegrateData { targetFlag: string, team?: string, attackEnemy?: string }

interface BodySet {
    [MOVE]?: number
    [CARRY]?: number
    [ATTACK]?: number
    [RANGED_ATTACK]?: number
    [WORK]?: number
    [CLAIM]?: number
    [TOUGH]?: number
    [HEAL]?: number
}
