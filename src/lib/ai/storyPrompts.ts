// ============================================
// SKYLOG — AI Prompts for Passenger Stories
// Generates short interactive stories with choices
// ============================================

import type { PassengerStory, StoryChoice } from "@/types";

const STORY_SYSTEM = `你是 SKYLOG 航空生活模拟游戏的故事引擎。你要为一位航班上的乘客生成一个简短但有情感冲击力的故事。

规则：
- 故事必须用中文写
- 给乘客一个有特点的名字（可以是任何国籍）
- 故事正文 3-5 句话，设定一个有趣或感人的场景
- 必须在故事最后提供 2 个选择（玩家以机长身份做出选择）
- 每个选择都要有不同的后果方向（一个偏暖心，一个偏现实）
- 故事类型可以是：重逢、告别、梦想、秘密、巧合、善意、遗憾、冒险
- 不要太长，不要说教，不要鸡汤

输出格式必须严格为以下 JSON（不要包含 markdown 代码块标记）：
{
  "passengerName": "乘客名字",
  "content": "故事正文...",
  "choices": [
    {"id": "a", "text": "选择A的简短描述", "consequence": "选择A的后果"},
    {"id": "b", "text": "选择B的简短描述", "consequence": "选择B的后果"}
  ]
}`;

export function buildStoryUserPrompt(context: {
  fromCity: string;
  toCity: string;
  planeNickname: string;
  dayPhase: string;
  flightNumber: number;
}): string {
  return `航班信息：
- 航线：${context.fromCity} → ${context.toCity}
- 飞机：${context.planeNickname}
- 时间：${context.dayPhase}
- 这是这条航线的第 ${context.flightNumber} 次航班

请生成一个乘客故事。`;
}

export function getStorySystemPrompt(): string {
  return STORY_SYSTEM;
}

/** Parse Claude's JSON response into structured data */
export function parseStoryResponse(text: string): {
  passengerName: string;
  content: string;
  choices: StoryChoice[];
} | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.passengerName || !parsed.content || !Array.isArray(parsed.choices)) {
      return null;
    }

    return {
      passengerName: parsed.passengerName,
      content: parsed.content,
      choices: parsed.choices.map((c: { id?: string; text: string; consequence: string }, i: number) => ({
        id: c.id || String.fromCharCode(97 + i),
        text: c.text,
        consequence: c.consequence,
      })),
    };
  } catch {
    return null;
  }
}

// ── Mock Stories ──

interface MockStory {
  passengerName: string;
  content: string;
  choices: StoryChoice[];
}

const MOCK_STORIES: MockStory[] = [
  {
    passengerName: "林小雨",
    content: `17C座位上的女孩一直在翻看手机里的一张合照——那是她和一位白发老人的合影。她三年没回过家了。飞机降落前，她突然开始哭，然后擦干眼泪，补了妆。`,
    choices: [
      { id: "a", text: `广播一句「欢迎回家」`, consequence: `她愣了一下，然后笑了。后来你收到一封感谢信，说那句话让她鼓起了勇气按门铃。` },
      { id: "b", text: `让乘务员送一杯热茶`, consequence: `她接过茶杯时手在抖。乘务员什么都没说，只是拍了拍她的肩膀。有时候沉默比语言更好。` },
    ],
  },
  {
    passengerName: "James Chen",
    content: `一个穿着皱巴巴西装的男人坐在商务舱，面前的笔记本电脑上写着辞职信。他已经盯着「发送」按钮看了整个飞行过程。窗外的云层像棉花糖一样铺开，他突然关上了电脑。`,
    choices: [
      { id: "a", text: `起飞时说「祝您拥有新的开始」`, consequence: `三个月后，他创办了自己的公司。他说飞行中的那个决定改变了一切。` },
      { id: "b", text: `保持正常服务，不打扰他`, consequence: `他最终没有发送那封辞职信。但他开始在周末画画。有些改变是安静的。` },
    ],
  },
  {
    passengerName: "佐藤美咲",
    content: `一对老夫妻坐在前排，手牵着手。老先生不停地给老太太指窗外的风景。乘务员悄悄告诉你，这是老太太第一次坐飞机——她今年78岁了。这是老先生给她的生日礼物。`,
    choices: [
      { id: "a", text: `飞过云层时稍微倾斜让她看得更清楚`, consequence: `老太太开心地拍手。老先生偷偷擦了擦眼角。这个画面被对面座位的旅客拍了下来，在网上感动了十万人。` },
      { id: "b", text: `请乘务员送一块小蛋糕并广播祝她生日快乐`, consequence: `全舱乘客一起唱了生日歌。老太太说这是她一辈子最好的生日。她把登机牌仔细收进了钱包。` },
    ],
  },
  {
    passengerName: "Amara Okafor",
    content: `一个小女孩独自旅行，脖子上挂着UM（无人陪伴儿童）的标签。她手里紧紧攥着一只缺了耳朵的毛绒小熊，眼睛红红的但没有哭。她的目的地填的是「爸爸家」。`,
    choices: [
      { id: "a", text: `请副驾驶去看看她，让她参观驾驶舱`, consequence: `她的眼睛亮了起来。她问飞机是不是活的，会不会累。你不知道该怎么回答。但那天你飞得格外平稳。` },
      { id: "b", text: `让乘务员给她一副机长翅膀胸针`, consequence: `她把胸针别在小熊身上，认真地说：「现在小熊也是机长了。」这句话你记了很久很久。` },
    ],
  },
  {
    passengerName: "周鹤轩",
    content: `一个年轻人背着吉他上了飞机。他飞去一个音乐节——这是他第一次有机会在大舞台上演出。但你注意到他的手一直在发抖。他一直在小声哼同一首歌。`,
    choices: [
      { id: "a", text: `降落时广播里放一句「祝今天的每一位旅客都能勇敢追梦」`, consequence: `他后来在社交媒体上说，飞机上的那句广播让他决定不再怯场。那场演出成了他的转折点。` },
      { id: "b", text: `让乘务员转告他「你的歌声很好听」`, consequence: `他惊讶地回头看了看，然后笑了。手不抖了。第二天他发了一首新歌，叫《三万英尺》。` },
    ],
  },
  {
    passengerName: "Emma Larsson",
    content: `12A的女人一上飞机就把遮光板拉了下来。她穿着一件很旧的大学卫衣，上面印着一个你不认识的乐队名字。整趟飞行她都在写信——用的是真正的纸和笔。降落前她把信折好放进信封，但没有写收件人。`,
    choices: [
      { id: "a", text: `什么都不做，尊重她的私人空间`, consequence: `有些故事你永远不会知道结局。但她下飞机时回头看了一眼天空，表情释然了许多。也许信寄出去了。也许没有。` },
      { id: "b", text: `下飞机时对她说「无论是什么，都会好的」`, consequence: `她的嘴角动了一下。不算微笑，但比她上飞机时的表情柔和了。一个星期后你的航空公司收到一封匿名感谢信。` },
    ],
  },
  {
    passengerName: "田中悠太",
    content: `一个穿着整齐校服的少年独自坐在窗边，认真地在一个小本子上画着什么。偷看一眼——他在画飞机。不是简笔画，而是非常精细的结构图，标注了每一个零件。他的梦想写在本子的封面上：「宇航员」。`,
    choices: [
      { id: "a", text: `降落后把他请到机头，让他近距离看看驾驶舱`, consequence: `他激动得说不出话，手忙脚乱地画了一张驾驶舱速写送给你。十五年后，你在电视上看到了他的名字——但他去的不是太空，他设计了一架新型客机。` },
      { id: "b", text: `送他一张手写的「未来同行」证书`, consequence: `他把证书和那个画满飞机的本子一起珍藏了起来。每次有人问他为什么喜欢飞机，他都会翻出那张已经发黄的证书。` },
    ],
  },
];

export function getMockStory(): MockStory {
  return MOCK_STORIES[Math.floor(Math.random() * MOCK_STORIES.length)];
}

/** Generate butterfly effect descriptions from a choice */
export function generateButterflyEffects(
  passengerName: string,
  choiceText: string,
  consequence: string,
): string[] {
  const effects: string[] = [];

  // Simple keyword-based effects
  if (consequence.includes("感谢") || consequence.includes("感动")) {
    effects.push(`${passengerName}的故事提升了你的机场声望`);
  }
  if (consequence.includes("社交") || consequence.includes("网上") || consequence.includes("十万")) {
    effects.push("你的航空公司在社交媒体上获得了关注");
  }
  if (consequence.includes("回来") || consequence.includes("再次")) {
    effects.push(`${passengerName}可能会再次乘坐你的航班`);
  }
  if (consequence.includes("梦") || consequence.includes("勇敢") || consequence.includes("改变")) {
    effects.push("你的一个小举动改变了一个人的人生轨迹");
  }

  // Always add at least one effect
  if (effects.length === 0) {
    effects.push(`${passengerName}会记住这次旅程`);
  }

  return effects;
}
