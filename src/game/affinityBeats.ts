import type { CharacterId, GameState, SceneNode } from "../types";
import { AFFINITY_GATE, CHARACTERS } from "./characters";
import { dialogueText } from "./dialogueText";

interface AffinityBeat {
  year: "2023" | "2024";
  monthIndex: number;
  characterId: CharacterId;
  mood: string;
  pose?: string;
  text: string;
}

export const LEGACY_AFFINITY_BEATS: AffinityBeat[] = [
  {
    year: "2024",
    monthIndex: 0,
    characterId: "lin_ruoning",
    mood: "信任",
    text: dialogueText(
      "林若宁把你重写过的研究提纲放回桌面。原本空着的证据来源，已经被你逐项补上。",
      "这次我不用追着问每一步是怎么来的了。",
      "她把第一页折出一个小角。",
      "这份先留在我这里。下次晨会，我想听你自己讲。",
    ),
  },
  {
    year: "2023",
    monthIndex: 5,
    characterId: "lin_ruoning",
    mood: "信任",
    text: dialogueText(
      "林若宁把你补过的证据表翻到现金流那一页。几处原本空着的来源说明，已经被你逐条补齐。",
      "这次我还没提醒，你就先把缺口找出来了。",
      "她把文件推回你面前，指尖停在最后一行。",
      "以后这类报告，我愿意先听你的判断。",
    ),
  },
  {
    year: "2023",
    monthIndex: 6,
    characterId: "chen_xinghe",
    mood: "坦白",
    pose: "focused",
    text: dialogueText(
      "陈星禾把完整回测发到你的屏幕上，失败区间和异常样本一项都没删。",
      "这份版本我没发群里。你先帮我看，哪里像信号，哪里只是我舍不得删的噪声。",
    ),
  },
  {
    year: "2023",
    monthIndex: 7,
    characterId: "zhou_mingzhao",
    mood: "认可",
    pose: "serious",
    text: dialogueText(
      "周明昭擦掉白板上的收益目标，只留下你写过的退出条件。",
      "上次市场反着走，你先执行了这几条，没有临场改口。",
      "她把笔放到你手边。",
      "下一次情景推演，你来写第一版。",
    ),
  },
  {
    year: "2024",
    monthIndex: 8,
    characterId: "lin_ruoning",
    mood: "在意",
    text: dialogueText(
      "末班车快到站时，林若宁把你们改了三遍的订单表折好，夹进自己的笔记本。",
      "这份我留着。以后有人问这条线怎么做出来的，我会说是我们一起拆的。",
    ),
  },
  {
    year: "2024",
    monthIndex: 9,
    characterId: "chen_xinghe",
    mood: "信任",
    pose: "focused",
    text: dialogueText(
      "陈星禾关掉演示模式，把模型里最难看的那段误差单独放大。",
      "别人只看结果，你知道我为什么不敢删这段。",
      "她把键盘往你这边推了推。",
      "今晚一起把它跑明白。",
    ),
  },
  {
    year: "2024",
    monthIndex: 10,
    characterId: "zhou_mingzhao",
    mood: "温和",
    pose: "serious",
    text: dialogueText(
      "周明昭把年末排名表扣在桌面上，没有再看。",
      "你这几个月最让我放心的，不是哪次判断对了。",
      "她点了点那本写满边界条件的风险日志。",
      "是每次压力最大的时候，你还肯照这里做。",
    ),
  },
];

export function affinityNodeFor(
  state: GameState | undefined,
  characterId: CharacterId,
  monthIndex: number,
): SceneNode | null {
  if (!state || state.year === "2025") return null;
  const beat = LEGACY_AFFINITY_BEATS.find(
    (candidate) =>
      candidate.year === state.year
      && candidate.monthIndex === monthIndex
      && candidate.characterId === characterId,
  );
  if (!beat || (state.relations[characterId] ?? 0) < AFFINITY_GATE) return null;

  const character = CHARACTERS[characterId];
  return {
    id: `m${monthIndex}-affinity`,
    type: "dialogue",
    characterId,
    speaker: character.name,
    role: character.role,
    mood: beat.mood,
    text: beat.text,
    prompt: "点击继续。",
    pose: beat.pose ?? "soft",
    bg: "research-room",
    bgm: "morning-loop",
    voiceCue: "key",
  };
}
