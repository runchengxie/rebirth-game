import { BRANCHES } from "./branches";
import { dialogueText } from "./dialogueText";

export const RELATIONSHIP_DIALOGUE: Record<string, string> = {
  "route-research": dialogueText(
    "林若宁把一份还冒着热气的早餐推到你手边。",
    "这周你已经第三次半夜发研报了。我担心你先把身体熬垮。先吃点东西。",
    "她把你新改的目录翻到最后一页。",
    "这版框架确实比上个月利落。",
  ),
  "route-burnout": dialogueText(
    "周明昭看了你两秒，把电脑屏幕按灭。",
    "你脸色很差。研究要做很多年，今晚先停。",
    "她把电源线从你手边收走。",
    "再熬一夜也不会让错误的判断变对。",
  ),
  "lin-2025-early-spark": dialogueText(
    "林若宁把早餐放在你桌边，便签上写着模型要改的三处。她转身前又停了一下。",
    "咖啡我没加糖。你上次说甜的会困，我记得。",
  ),
  "lin-2025-health-warning": dialogueText(
    "林若宁把你凌晨三点发来的版本放回桌上。",
    "我给你送早餐，是怕你空着肚子工作。每天凌晨才睡，这件事我不同意。",
    "她按住报告，没有让你立刻拿回去。",
    "你再这样下去，模型没坏，人先坏了。",
  ),
  "lin-2025-promise-kept": dialogueText(
    "林若宁看了眼时间，先替你合上电脑。",
    "你最近真的会停了。那天的话没有落在空气里。",
    "她笑了一下，把桌上的便签收进文件夹。",
    "脑子清亮的时候，你的模型也更像你自己。",
  ),
  "lin-2025-promise-broken": dialogueText(
    "桌上没有早餐，只有你上次答应准时下班的便签。林若宁把它压在研报下面。",
    "你忙，我知道。可我不能每次都听你说，下次会不一样。",
  ),
  "lin-2025-truth-conflict": dialogueText(
    "林若宁把你的结论圈出来。",
    "方向可能是对的，可中间这几步还是空的。",
    "她看着你，没有退开。",
    "我相信你。证据缺口还在，这几步必须由你补出来。",
  ),
  "lin-2025-relationship-confirm": dialogueText(
    "林若宁把年初那张便签从你屏幕边取下来，背面已经写满了日期。",
    "我很早就喜欢你。后来我放慢脚步，是想确认你会不会好好对待自己，也好好对待我。",
    "她把便签放进你的手心。",
    "现在我确认了。",
  ),
  "lin-2025-white-moon": dialogueText(
    "林若宁沉默了很久。",
    "我喜欢过你，现在也还在意。可我不能靠喜欢，一次次替你解释失约和跳过验证。",
    "她把那张旧便签留在桌上。",
    "这段关系原本能成功，所以我才更难装作没关系。",
  ),
  "chen-2025-honest-run": dialogueText(
    "陈星禾把两张回测图并排放在你面前。",
    "左边那张收益漂亮，样本挑得也漂亮。右边这张把失败区间全放进来了，难看，但是真的。",
    "她把鼠标停在导出按钮上。",
    "你准备拿哪张去开会？",
  ),
  "chen-2025-private-error": dialogueText(
    "陈星禾没有打开最新模型，先调出一份两年前的失败归因。",
    "我以前也把偶然相关当成能力，差点让全组替我交学费。",
    "她侧过脸笑了一下。",
    "这份东西我很少给别人看。你别拿去安慰我，拿去提醒我。",
  ),
  "chen-2025-confirm": dialogueText(
    "陈星禾把平板锁屏，难得没有用数据起头。",
    "我喜欢跟你一起跑模型，也喜欢你在模型跑错的时候还在。",
    "她朝你伸出手，像在等一个新的样本起点。",
    "要不要把观察窗口拉长一点？工作以外也算。",
  ),
  "chen-2025-regret": dialogueText(
    "陈星禾把那张最好看的曲线删掉。",
    "我确实对你上过头。可如果连失败区间都不能一起看，我不知道我们喜欢的是彼此，还是一段被筛选过的结果。",
  ),
  "zhou-2025-boundary": dialogueText(
    "周明昭在白板上留了一大片空白。",
    "收益情景写满了，错误情景还没动。",
    "她把笔递给你。",
    "先告诉我，判断错了以后，你准备怎么活下来。",
  ),
  "zhou-2025-private-boundary": dialogueText(
    "周明昭把白板擦到只剩一条回撤线。",
    "我以前见过一个很聪明的人，每次都能解释为什么这次可以破例。最后输掉的是所有人对他的信任。",
    "她停了一下。",
    "所以我也会观察，你怎么对待答应过的边界。",
  ),
  "zhou-2025-confirm": dialogueText(
    "周明昭在情景树最右侧添了一条很细的线。",
    "这条没有收益率，也没有截止日期。",
    "她看向你。",
    "如果你愿意，我们可以把彼此放进长期假设里。错了也不互相惩罚，变了就重新评估。",
  ),
  "zhou-2025-regret": dialogueText(
    "周明昭把那次越界的日期圈起来。",
    "我喜欢你。正因为喜欢，我才不能把破例说成勇敢。",
    "她合上风险日志。",
    "关系里没有止损单，可边界一样需要被尊重。",
  ),
};

export function installRelationshipDialogue(): void {
  for (const [branchId, text] of Object.entries(RELATIONSHIP_DIALOGUE)) {
    const node = BRANCHES.find((branch) => branch.id === branchId)?.contribute.nodes?.[0];
    if (node?.type === "dialogue") node.text = text;
  }
}
