import type { HeroId } from "./types";

export type HeroFaction = "original" | "entropy" | "quantum" | "void" | "bio" | "mech";

export interface HeroLore {
  heroId: HeroId;
  fullName: string;
  title: string;
  age: number;
  height: string;
  dimension: string;
  faction: HeroFaction;
  role: string;
  personality: string;
  backstory: string;
  quote: string;
  abilities: HeroAbilityLore[];
  relationships: HeroRelationship[];
  conceptArtPrompt: string;
}

export interface HeroAbilityLore {
  name: string;
  type: "skill" | "ultimate" | "passive";
  description: string;
  lore: string;
}

export interface HeroRelationship {
  heroId: HeroId;
  type: "ally" | "rival" | "mentor" | "student" | "family";
  description: string;
}

export const HERO_LORE: Record<HeroId, HeroLore> = {
  nitrogen: {
    heroId: "nitrogen",
    fullName: "陈寒",
    title: "液氮",
    age: 28,
    height: "178cm",
    dimension: "原点维度",
    faction: "original",
    role: "冰冻控制 / 区域封锁",
    personality: "冷静理性，寡言少语，在极端情况下保持绝对冷静。曾是极地科考站的工程师，对低温环境有天然的亲和力。",
    backstory: "陈寒曾是南极「冰穹-A」科考站的低温工程师。维度裂痕出现的第三天，科考站被维度生物夷为平地。在零下60度的极寒中，他独自存活了17天——维度生物似乎对低温不敏感，但他在极端环境中发现了冰晶与维度能量的奇妙共振。他利用实验室的液氮设备制作了第一件「冰冻手雷」，成功反击入侵者。当救援队找到他时，他已经在冰原上击杀了超过30只维度生物。现在，他将这份极寒之力带到了锚点基地。",
    quote: "寒冷不是敌人，是武器。",
    abilities: [
      {
        name: "冰冻手雷",
        type: "skill",
        description: "投掷冰冻手雷，冻结范围内的敌人",
        lore: "利用液氮与维度能量共振原理，将极寒之力压缩为手雷。维度生物的能量核心在低温下会暂时失活。",
      },
      {
        name: "绝对零度",
        type: "ultimate",
        description: "释放绝对零度领域，持续冻结所有敌人",
        lore: "释放全身的低温能量，在周围制造一个接近绝对零度的领域。在这个领域中，连维度能量都会凝固。",
      },
      {
        name: "低温传导",
        type: "passive",
        description: "攻击附带冰冻效果",
        lore: "长期接触低温环境使陈寒的武器系统自动适配了冰晶共振技术，每次攻击都会向目标传导低温能量。",
      },
    ],
    relationships: [
      {
        heroId: "twilight",
        type: "ally",
        description: "在科考站被维度生物袭击时，暮蝶的医疗小队救了他。两人在锚点基地重逢，成为战斗搭档。",
      },
      {
        heroId: "viper",
        type: "rival",
        description: "液氮的冰与蝰蛇的毒形成了天然的对抗关系。两人对「什么才是有效的控制手段」有激烈的争论。",
      },
    ],
    conceptArtPrompt: "青年男性，白色极地作战服，肩部液氮容器发出蓝色荧光，右手持冰晶手雷，身边有冰晶碎片悬浮",
  },
  twilight: {
    heroId: "twilight",
    fullName: "白暮",
    title: "暮蝶",
    age: 26,
    height: "165cm",
    dimension: "原点维度",
    faction: "original",
    role: "治疗支援 / 生命链接",
    personality: "温柔坚韧，对生命有近乎偏执的珍视。在战场上总是冲在前线——不是为了战斗，而是为了在战友倒下前赶到他们身边。",
    backstory: "白暮曾是国际红十字会的前线医生。维度裂痕爆发后，她发现维度能量对生物组织有奇特的修复效应——但前提是「等价交换」，修复一个生命需要消耗另一个生命。她花了六个月研究如何打破这个法则，最终发现了「蛹化」技术：以自身生命力为代价，在短时间内大幅加速目标的自愈能力。她右臂的茧状组织就是反复使用蛹化技术的代价——每次使用都会消耗她的一部分生命。但她说：「这是我的选择。」",
    quote: "只要还有一口气，我就不会让任何人倒下。",
    abilities: [
      {
        name: "治疗脉冲",
        type: "skill",
        description: "释放治疗脉冲，为周围队友恢复生命",
        lore: "将维度能量转化为生物修复脉冲，加速细胞再生。这个技术的基础是白暮在红区战场上发现的「维度共振修复」现象。",
      },
      {
        name: "蛹化复苏",
        type: "ultimate",
        description: "进入蛹化状态，持续恢复生命并免疫伤害",
        lore: "以自身生命为代价的终极治疗技术。白暮将身体包裹在维度能量茧中，在茧中完成自我修复。茧的强度足以抵御任何攻击。",
      },
      {
        name: "谐振增幅",
        type: "passive",
        description: "治疗脉冲的回复效果提升",
        lore: "白暮对维度修复能量的理解越来越深，她的治疗脉冲能够更高效地将维度能量转化为生物修复力。",
      },
    ],
    relationships: [
      {
        heroId: "nitrogen",
        type: "ally",
        description: "在科考站救援行动中结识了液氮。两人之间有一种无需言语的默契。",
      },
      {
        heroId: "bastion",
        type: "ally",
        description: "堡垒的防御屏障为暮蝶提供了安全的治疗环境。她常说：「有堡垒在，我就能救更多人。」",
      },
    ],
    conceptArtPrompt: "年轻女性，白色医疗服，右臂缠绕着发光的蓝色茧状组织，左手持医疗手杖，背后有治疗脉冲的蓝色光环",
  },
  leopard: {
    heroId: "leopard",
    fullName: "雷豹",
    title: "豹",
    age: 32,
    height: "185cm",
    dimension: "原点维度",
    faction: "original",
    role: "近战突击 / 高机动",
    personality: "狂野不羁，享受战斗的快感。在锚点基地以「疯子」著称，但每次冲锋都能活着回来。对敌人残忍，对战友忠诚。",
    backstory: "雷豹曾是特种部队的突击手。维度裂痕爆发时，他的小队被派往裂痕核心执行侦查任务——全队12人，只有他一个人活着回来。他在裂痕附近待了72小时，近距离观察了维度生物的行为模式。他发现这些生物对「恐惧」有特殊反应——越恐惧，越容易被它们锁定。于是他选择了另一种方式：不再恐惧，而是享受。他剃掉了头发，在脸上纹了豹纹，以猛兽的姿态与维度生物战斗。",
    quote: "敌人不会因为你的恐惧而手下留情，所以——露出獠牙吧。",
    abilities: [
      {
        name: "猛扑",
        type: "skill",
        description: "向目标方向猛扑，造成伤害并击退",
        lore: "雷豹通过腿部加速装置实现瞬时爆发，模仿猎豹的捕猎动作。他的作战服在膝盖和脚踝处装有维度能量推进器。",
      },
      {
        name: "猎杀本能",
        type: "ultimate",
        description: "进入猎杀状态，大幅提升速度和伤害",
        lore: "释放压制已久的战斗本能，维度能量在体内暴走，将体能提升到极限。这个状态下的雷豹就是一台纯粹的杀戮机器。",
      },
      {
        name: "撕裂利爪",
        type: "passive",
        description: "近战攻击造成额外流血伤害",
        lore: "雷豹的拳套上装备了维度能量利爪，每次攻击都会在目标身上留下持续撕裂的维度伤口。",
      },
    ],
    relationships: [
      {
        heroId: "falcon",
        type: "rival",
        description: "两人都是高速突击型英雄，但隼更注重精准而豹更注重力量。在训练场上的对战总是最激烈的。",
      },
      {
        heroId: "recon",
        type: "mentor",
        description: "豹的狂野风格需要侦察的战术指导来控制节奏。侦察是少数能让豹安静下来听讲的人。",
      },
    ],
    conceptArtPrompt: "壮年男性，光头，面部豹纹纹身，黑色紧身作战服，手臂和腿部有维度能量推进器发出橙色光，双拳套上有利爪装置",
  },
  recon: {
    heroId: "recon",
    fullName: "林锐",
    title: "侦察",
    age: 35,
    height: "180cm",
    dimension: "原点维度",
    faction: "original",
    role: "战术支援 / 无人机",
    personality: "沉稳老练，是团队中的战术大脑。说话慢条斯理，但每一句话都经过深思熟虑。在战场上，他的无人机就是第二双眼睛。",
    backstory: "林锐是前军方无人机作战指挥官。他指挥的无人机编队曾在一次行动中成功阻止了核弹危机。维度裂痕爆发后，他迅速改装了军用无人机，适配维度能量频率。他的无人机不仅可以侦察，还能携带武器进行精确打击。在锚点基地，他负责制定大部分战术计划，被大家称为「指挥官」。但他本人拒绝这个称呼：「我只是个看地图的。」",
    quote: "信息就是力量。在战场上，看得见比打得准更重要。",
    abilities: [
      {
        name: "侦察无人机",
        type: "skill",
        description: "部署侦察无人机，自动攻击范围内的敌人",
        lore: "林锐的无人机编队经过维度能量适配，能够在维度磁场中稳定飞行。每架无人机都配备了微型能量炮。",
      },
      {
        name: "集束打击",
        type: "ultimate",
        description: "呼叫无人机编队进行集束打击",
        lore: "激活所有无人机编队，对指定区域进行饱和式打击。这是林锐在军方服役时开发的战术，现在适配了维度能量武器。",
      },
      {
        name: "弹道学",
        type: "passive",
        description: "提升所有武器的射程和精度",
        lore: "林锐对弹道学的深刻理解使他的所有武器都能发挥最大效能。他会在每次战斗前重新校准所有武器系统。",
      },
    ],
    relationships: [
      {
        heroId: "leopard",
        type: "student",
        description: "林锐是少数能让豹冷静下来的人。他教会了豹在冲锋前先观察战场。",
      },
      {
        heroId: "falcon",
        type: "ally",
        description: "侦察提供情报，隼执行精确打击。两人是锚点基地最致命的战术组合。",
      },
    ],
    conceptArtPrompt: "中年男性，深蓝色战术服，戴战术耳机，身后悬浮数架发光无人机，手持战术平板电脑",
  },
  viper: {
    heroId: "viper",
    fullName: "万毒",
    title: "蝰蛇",
    age: 29,
    height: "172cm",
    dimension: "生物维度",
    faction: "bio",
    role: "毒素控制 / 持续伤害",
    personality: "神秘莫测，总是带着若有若无的微笑。她从不谈论自己的过去，但所有人都知道她身上有某种「非人类」的东西。她的瞳孔在黑暗中会发出幽绿色的光。",
    backstory: "万毒不知道自己从哪里来。她在一个维度实验室的废墟中醒来，全身被绿色液体浸泡。她的身体已经被维度毒素彻底改造——血液中含有数十种致命的毒素，但她自己却免疫。她左手腕上的「毒腺」可以分泌不同种类的毒素，从麻痹到腐蚀，从神经毒到血液毒。她花了三年时间学习控制体内的毒素，现在她能将毒素精确地注入目标体内。没有人知道她究竟是「人类被毒素改造」还是「毒素获得了人类形态」。",
    quote: "毒不是武器，是我身体的一部分。",
    abilities: [
      {
        name: "毒液喷射",
        type: "skill",
        description: "喷射毒液，对敌人造成持续毒素伤害",
        lore: "从左手腕毒腺中喷射出高浓度维度毒素。这种毒素会与维度生物的能量核心产生反应，加速其能量衰减。",
      },
      {
        name: "万毒领域",
        type: "ultimate",
        description: "释放毒雾领域，持续伤害区域内的所有敌人",
        lore: "释放体内储存的全部毒素，制造一个毒雾领域。在领域内，蝰蛇的毒素再生速度会大幅提升。",
      },
      {
        name: "毒液渗透",
        type: "passive",
        description: "所有攻击附带毒素效果",
        lore: "蝰蛇的毒素已经渗透到她的每一个细胞中。即使是普通攻击，也会在目标体内留下微量毒素。",
      },
    ],
    relationships: [
      {
        heroId: "nitrogen",
        type: "rival",
        description: "冰与毒的对抗。液氮认为毒素过于「不可控」，而蝰蛇认为冰的伤害太「温柔」。",
      },
      {
        heroId: "twilight",
        type: "ally",
        description: "暮蝶是少数愿意研究蝰蛇毒素医疗用途的人。两人建立了出人意料的友谊。",
      },
    ],
    conceptArtPrompt: "神秘女性，深绿色半透明作战服，左手腕有发光毒腺装置，瞳孔发出幽绿色荧光，发梢有绿色能量流动",
  },
  falcon: {
    heroId: "falcon",
    fullName: "隼",
    title: "隼",
    age: 31,
    height: "176cm",
    dimension: "原点维度",
    faction: "original",
    role: "远程精准 / 狙击",
    personality: "专注到近乎偏执。可以从日出到日落一动不动地瞄准一个目标。在基地里很少说话，但每次开口都直击要害。",
    backstory: "隼是前国家级射击运动员，曾获得过三次全国冠军。维度裂痕爆发时，她正在参加世界锦标赛。比赛被迫中断，她拿起赛场上的狙击步枪，在混乱中击杀了37只维度生物，保护了整个体育馆的观众。她发现维度生物的弱点不是头部，而是它们胸口的能量核心。从此，她将「能量核心」作为唯一的射击目标。她的瞄准镜经过特殊改装，可以穿透维度磁场看到能量核心的位置。",
    quote: "一枪，一个核心。不需要第二枪。",
    abilities: [
      {
        name: "精准射击",
        type: "skill",
        description: "射出一发高伤害精准子弹",
        lore: "隼的专属狙击弹药经过维度能量充能，可以直接穿透维度生物的防御，精准命中能量核心。",
      },
      {
        name: "鹰眼锁定",
        type: "ultimate",
        description: "锁定所有可见敌人，大幅提升伤害",
        lore: "激活鹰眼瞄准系统，同时锁定视野内所有敌人的能量核心位置。在锁定状态下，每一发子弹都会自动追踪目标核心。",
      },
      {
        name: "专注",
        type: "passive",
        description: "静止时提升伤害和暴击率",
        lore: "多年的射击训练使隼在静止状态下能够将心率降到每分钟40次，此时她的射击精度达到人机合一的境界。",
      },
    ],
    relationships: [
      {
        heroId: "recon",
        type: "ally",
        description: "侦察提供情报，隼执行精确打击。两人是锚点基地最致命的战术组合。",
      },
      {
        heroId: "leopard",
        type: "rival",
        description: "隼的精准与豹的狂暴形成了鲜明对比。两人在训练场上经常互相挑战。",
      },
    ],
    conceptArtPrompt: "精干女性，灰色狙击手服，戴特殊瞄准镜头盔，手持大型维度能量狙击步枪，身边有弹道风线",
  },
  bastion: {
    heroId: "bastion",
    fullName: "石坚",
    title: "堡垒",
    age: 40,
    height: "195cm",
    dimension: "原点维度",
    faction: "original",
    role: "防御坦克 / 护盾",
    personality: "沉默如石，但在关键时刻会挺身而出。他是锚点基地最年长的战斗人员，所有人都叫他「老爹」。他从不抱怨，也从不退缩。",
    backstory: "石坚是锚点基地的第一批防御者。维度裂痕爆发时，他是一名建筑工人。当别人都在逃跑时，他开着推土机撞向了一只正在攻击平民的维度生物。他把建筑工地的钢板焊接成巨大的盾牌，用起重机吊起钢梁砸向敌人。他的战斗方式粗暴但有效。后来，工程师们为他定制了一套重型动力装甲，让他能扛住更猛烈的攻击。他说：「我不需要跑得快，我只需要站在这里，不让任何东西从我身后过去。」",
    quote: "我的身后是基地，我不退。",
    abilities: [
      {
        name: "能量护盾",
        type: "skill",
        description: "展开能量护盾，阻挡前方伤害",
        lore: "堡垒的动力装甲可以展开一道维度能量屏障。这道屏障利用维度磁场原理，将敌人的攻击能量偏转。",
      },
      {
        name: "坚不可摧",
        type: "ultimate",
        description: "进入无敌状态并嘲讽周围敌人",
        lore: "将动力装甲的防护能力提升到极限，瞬间变得坚不可摧。同时释放维度能量脉冲，吸引周围所有敌人的注意。",
      },
      {
        name: "钢铁意志",
        type: "passive",
        description: "生命值越低，防御越高",
        lore: "堡垒在绝境中反而更加坚韧。他的动力装甲在检测到生命值下降时会自动激活额外的防护层。",
      },
    ],
    relationships: [
      {
        heroId: "twilight",
        type: "ally",
        description: "堡垒的防御为暮蝶提供了安全的治疗环境。暮蝶在战场上最信任的就是堡垒的护盾。",
      },
      {
        heroId: "recon",
        type: "ally",
        description: "侦察制定战术，堡垒执行防御。两人配合默契，是锚点基地防御体系的核心。",
      },
    ],
    conceptArtPrompt: "健壮中年男性，重型动力装甲，手持巨大能量盾牌，装甲上有焊接痕迹和战斗划痕，背后有引擎散热口",
  },
};