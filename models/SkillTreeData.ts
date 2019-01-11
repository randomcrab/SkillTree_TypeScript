import { SkillNode, SkillNodeStates } from "./SkillNode";
import { Constants } from "./Constants";
import { SkillTreeUtilities } from "./SkillTreeUtilities";

export class SkillTreeData implements ISkillTreeData {
    version: number;
    fullscreen: number;
    characterData: { [id: string]: ICharacter };
    groups: { [id: string]: IGroup };
    root: IRootNode;
    nodes: Array<SkillNode>;
    extraImages: { [id: string]: IClassImage };
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
    assets: { [id: string]: { [zoomLevel: string]: string } };
    imageRoot: string;
    imageZoomLevels: Array<number>;
    skillSprites: { [id: string]: Array<ISpriteSheet> };
    constants: Constants;

    skillTreeOtions: ISkillTreeOptions;
    skillTreeUtilities: SkillTreeUtilities;
    width: number;
    height: number;
    maxZoom: number;
    classStartNodes: { [id: string]: SkillNode };
    ascedancyNodes: { [id: string]: SkillNode };

    constructor(skillTree: ISkillTreeData, options: ISkillTreeOptions) {
        this.version = skillTree.version = 3;
        this.fullscreen = skillTree.fullscreen = 0;
        this.skillTreeOtions = options;
        this.skillTreeUtilities = new SkillTreeUtilities(this);
        this.characterData = skillTree.characterData;
        this.groups = skillTree.groups;
        this.root = skillTree.root;
        this.extraImages = skillTree.extraImages;
        this.min_x = skillTree.min_x;
        this.max_x = skillTree.max_x;
        this.min_y = skillTree.min_y;
        this.max_y = skillTree.max_y;
        this.assets = skillTree.assets;
        this.imageRoot = skillTree.imageRoot;
        this.imageZoomLevels = skillTree.imageZoomLevels;
        this.skillSprites = skillTree.skillSprites
        this.constants = new Constants(skillTree.constants);
        this.width = Math.abs(this.min_x) + Math.abs(this.max_x);
        this.height = Math.abs(this.min_y) + Math.abs(this.max_y);
        this.maxZoom = skillTree.imageZoomLevels[skillTree.imageZoomLevels.length - 1];

        //// Setup in/out properties correctly
        {
            for (let id in skillTree.nodes) {
                skillTree.nodes[id].in = [];
            }
            for (let id in skillTree.nodes) {
                let node = skillTree.nodes[id];
                if (node.m) {
                    continue;
                }
                for (let outId of node.out) {
                    let out = skillTree.nodes.find(n => n.id === outId);
                    if (out === undefined) {
                        continue;
                    }
                    if (node.in.indexOf(out.id) < 0) {
                        node.in.push(out.id);
                    }
                    if (out.out.indexOf(node.id) < 0) {
                        out.out.push(node.id);
                    }
                }
                for (let inId of node.in) {
                    let inNode = skillTree.nodes.find(n => n.id === inId);
                    if (inNode === undefined) {
                        continue;
                    }
                    if (node.out.indexOf(inNode.id) < 0) {
                        node.out.push(inNode.id);
                    }
                    if (inNode.in.indexOf(node.id) < 0) {
                        inNode.in.push(node.id);
                    }
                }
            }
        }

        this.nodes = [];
        this.classStartNodes = {};
        this.ascedancyNodes = {};
        for (let id in skillTree.nodes) {
            let node
                = new SkillNode(
                    skillTree.nodes[id],
                    skillTree.groups[skillTree.nodes[id].g],
                    skillTree.constants.orbitRadii,
                    skillTree.constants.skillsPerOrbit,
                    this.maxZoom,
                    this.skillTreeUtilities);
            if (node.spc.length > 0 && node.spc.indexOf(options.startClass) >= 0) {
                node.add(SkillNodeStates.Active);
            }

            this.nodes[id] = node;
            if (node.ascendancyName !== "") {
                this.ascedancyNodes[node.id] = node;
            }
            if (node.spc.length > 0) {
                this.classStartNodes[node.id] = node;
            }
        }
    }

    public getStartClass = (): number => {
        for (let id in this.classStartNodes) {
            if (this.classStartNodes[id].is(SkillNodeStates.Active)) {
                return this.classStartNodes[id].spc[0];
            }
        }
        return 0;
    }

    public getAscendancyClass = (): number => {
        for (let id in this.ascedancyNodes) {
            if (this.ascedancyNodes[id].isAscendancyStart && this.ascedancyNodes[id].is(SkillNodeStates.Active)) {
                for (let classid in this.skillTreeOtions.ascClasses) {
                    for (let ascid in this.skillTreeOtions.ascClasses[classid].classes) {
                        let asc = this.skillTreeOtions.ascClasses[classid].classes[ascid];
                        if (asc.name === this.ascedancyNodes[id].dn) {
                            return +ascid;
                        }
                    }
                }
            }
        }

        return 0;
    }

    public getSkilledNodes = (): { [id: string]: SkillNode } => {
        let skilled: { [id: string]: SkillNode } = {};
        for (let id in this.nodes) {
            let node = this.nodes[id];
            if (node.is(SkillNodeStates.Active)) {
                skilled[node.id] = node;
            }
        }
        return skilled;
    }

    public getHoveredNodes = (): { [id: string]: SkillNode } => {
        let hovered: { [id: string]: SkillNode } = {};
        for (let id in this.nodes) {
            let node = this.nodes[id];
            if (node.is(SkillNodeStates.Hovered) || node.is(SkillNodeStates.Pathing)) {
                hovered[node.id] = node;
            }
        }
        return hovered;
    }

    public getNodes = (state: SkillNodeStates = SkillNodeStates.None): { [id: string]: SkillNode } => {
        let n: { [id: string]: SkillNode } = {};
        for (let id in this.nodes) {
            let node = this.nodes[id];
            if (node.is(state) || state === SkillNodeStates.None) {
                n[node.id] = node;
            }
        }

        return n;
    }
}