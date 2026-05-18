import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

interface TreeNode {
  name: string;
  type: string;
  content?: string;
  annotation?: string;
  children?: TreeNode[];
}

const tree: TreeNode = {
  name: '行测',
  type: 'subject',
  content: '行政职业能力测验，简称行测，是公务员考试笔试公共科目之一，主要测查与公务员职业密切相关的、适合通过客观化纸笔测验方式进行考查的基本素质和能力要素。',
  annotation: '行测一般为120分钟，130-135题，时间紧任务重',
  children: [
    {
      name: '言语理解与表达',
      type: 'knowledge',
      content: '主要测查运用语言文字进行思考和交流、迅速准确地理解和把握文字材料内涵的能力。',
      children: [
        {
          name: '片段阅读',
          type: 'subknowledge',
          content: '给定一段文字，要求根据文字内容回答问题。先看问题，再读文段，找关键句。',
          children: [
            { name: '中心理解题', type: 'angle', content: '概括文段主旨或中心思想。关注转折词、总结词后的内容。' },
            { name: '细节判断题', type: 'angle', content: '判断选项是否符合文段细节。注意偷换概念、无中生有、绝对化表述。' },
            { name: '标题填入题', type: 'angle', content: '选择最恰当的文段标题。要求紧扣主旨、简洁新颖。' },
            { name: '态度理解题', type: 'angle', content: '判断作者的观点态度。注意观点词、情感色彩词。' },
            { name: '词句理解题', type: 'angle', content: '理解文中特定词语或句子的含义。联系上下文，结合语境。' },
          ],
        },
        {
          name: '语句表达',
          type: 'subknowledge',
          content: '考查语句的连贯性、衔接性和逻辑性。',
          children: [
            { name: '语句排序', type: 'angle', content: '将打乱的句子重新排列成通顺的段落。关注首句特征、关联词配对。' },
            { name: '语句填空', type: 'angle', content: '在文段空白处填入最恰当的句子。分析上下文逻辑关系。' },
            { name: '接语选择', type: 'angle', content: '选择文段接下来最可能论述的内容。关注尾句新话题。' },
          ],
        },
        {
          name: '逻辑填空',
          type: 'subknowledge',
          content: '在文段中填入最恰当的词语，考查实词、成语、虚词的辨析能力。',
          children: [
            { name: '实词填空', type: 'angle', content: '辨析近义实词。从词义轻重、范围大小、感情色彩、搭配习惯等维度辨析。' },
            { name: '成语填空', type: 'angle', content: '辨析常见成语的含义、适用对象。高频成语约200个。' },
            { name: '混搭填空', type: 'angle', content: '实词与成语混合考查，综合分析语境和搭配。' },
          ],
        },
        {
          name: '篇章阅读',
          type: 'subknowledge',
          content: '阅读一篇较长的文章，回答多个问题。考查综合阅读理解能力。',
          children: [
            { name: '细节判断', type: 'angle', content: '根据文章内容判断选项正误。逐项回文定位比对。' },
            { name: '主旨概括', type: 'angle', content: '概括文章或段落的主旨。关注首尾段、段落首尾句。' },
            { name: '词句理解', type: 'angle', content: '理解文中特定词句含义。' },
            { name: '逻辑填空', type: 'angle', content: '篇章中的词语填空题。' },
          ],
        },
      ],
    },
    {
      name: '判断推理',
      type: 'knowledge',
      content: '主要测查对各种事物关系的分析推理能力，包括图形推理、定义判断、类比推理、逻辑判断等。',
      children: [
        {
          name: '图形推理',
          type: 'subknowledge',
          content: '观察图形规律，选出符合规律的选项。平面推理和空间重构两大类。',
          children: [
            { name: '位置规律', type: 'angle', content: '平移、旋转、翻转。元素位置发生规律性变化。' },
            { name: '样式规律', type: 'angle', content: '遍历、加减同异（相加、相减、求同、求异）、黑白运算。' },
            { name: '属性规律', type: 'angle', content: '对称（轴对称/中心对称）、曲直、开闭。' },
            { name: '数量规律', type: 'angle', content: '点、线、面、角、素（元素种类/数量）的规律。' },
            { name: '特殊规律', type: 'angle', content: '图形间关系（相离/相交/包含）、功能元素（箭头/小圆点标记）。' },
            { name: '空间重构', type: 'angle', content: '六面体（正方体展开图还原）、四面体。' },
            { name: '立体拼合/截面/三视图', type: 'angle', content: '立体图形的拼合、切割截面、三视图投影。' },
          ],
        },
        {
          name: '定义判断',
          type: 'subknowledge',
          content: '根据给出的定义，判断选项是否符合定义。关键：抓关键词、匹配要件。',
          children: [
            { name: '单定义判断', type: 'angle', content: '一个定义，判断哪个选项符合或不符合。' },
            { name: '多定义判断', type: 'angle', content: '多个定义，需区分辨析后匹配。' },
          ],
        },
        {
          name: '类比推理',
          type: 'subknowledge',
          content: '给出词组，分析逻辑关系，选择最相似的选项。',
          children: [
            { name: '语义关系', type: 'angle', content: '近义关系、反义关系、比喻象征关系。' },
            { name: '逻辑关系', type: 'angle', content: '全同、并列（矛盾/反对）、包容（种属/组成）、交叉、对应。' },
            { name: '语法关系', type: 'angle', content: '主谓关系、动宾关系、偏正关系。' },
          ],
        },
        {
          name: '逻辑判断',
          type: 'subknowledge',
          content: '逻辑推理类题目，是判断推理中难度最高的模块。',
          children: [
            { name: '翻译推理', type: 'angle', content: '将题干翻译为逻辑表达式，推导结论。关键词：如果…那么、只有…才。' },
            { name: '真假推理', type: 'angle', content: '题干给出若干真假条件，推断事实。常用代入法、矛盾法。' },
            { name: '分析推理', type: 'angle', content: '排列组合、匹配对应类推理。常用列表法、排除法。' },
            { name: '加强论证', type: 'angle', content: '选择最能支持题干观点的选项。加强方式：搭桥、补充论据。' },
            { name: '削弱论证', type: 'angle', content: '选择最能质疑题干观点的选项。削弱方式：拆桥、否定论据、他因。' },
            { name: '归纳推理', type: 'angle', content: '从题干信息归纳出合理的结论。注意"可能性"表述优于"绝对化"表述。' },
            { name: '原因解释', type: 'angle', content: '解释题干中的矛盾现象。找到最合理的原因。' },
          ],
        },
      ],
    },
    {
      name: '数量关系',
      type: 'knowledge',
      content: '主要测查理解、把握事物间量化关系和解决数量关系问题的能力。',
      children: [
        {
          name: '数学运算',
          type: 'subknowledge',
          content: '运用数学方法解决实际问题。国考10题，省考10-15题。',
          children: [
            { name: '基础计算', type: 'angle', content: '整除、倍数、余数、平均数、数列求和、定义新运算。' },
            { name: '工程问题', type: 'angle', content: '工作效率×工作时间=工作量。赋值法、方程法。' },
            { name: '行程问题', type: 'angle', content: '相遇问题、追及问题、流水行船。路程=速度×时间。' },
            { name: '利润问题', type: 'angle', content: '利润=售价-成本。利润率=利润÷成本。打折、促销。' },
            { name: '浓度问题', type: 'angle', content: '溶液=溶质+溶剂。浓度=溶质÷溶液。十字交叉法。' },
            { name: '年龄问题', type: 'angle', content: '年龄差不变。方程法、代入法。' },
            { name: '容斥原理', type: 'angle', content: '两集合、三集合容斥。公式法、文氏图法。' },
            { name: '排列组合', type: 'angle', content: '分类用加法、分步用乘法。排列A、组合C。' },
            { name: '概率问题', type: 'angle', content: '古典概率=满足情况数÷总情况数。分类概率求和。' },
            { name: '最值问题', type: 'angle', content: '求最大/最小值。构造函数、均值不等式。' },
            { name: '几何问题', type: 'angle', content: '平面几何（面积、周长）、立体几何（体积、表面积）。' },
            { name: '统筹问题', type: 'angle', content: '最优化安排。时间统筹、物资调运。' },
            { name: '周期问题', type: 'angle', content: '循环周期规律。找周期、算余数。' },
          ],
        },
        {
          name: '数字推理',
          type: 'subknowledge',
          content: '给定数列，找规律推出下一项。部分省考考查，国考不考。',
          children: [
            { name: '基础数列', type: 'angle', content: '等差数列、等比数列、和数列、积数列、幂数列、递推数列。' },
            { name: '多重数列', type: 'angle', content: '奇数项/偶数项分别成规律，或分组找规律。' },
            { name: '分数数列', type: 'angle', content: '分子分母分别找规律、通分约分、反约分。' },
            { name: '图形数阵', type: 'angle', content: '圆形、三角形、九宫格中的数字规律。' },
          ],
        },
      ],
    },
    {
      name: '资料分析',
      type: 'knowledge',
      content: '对统计图表、文字资料进行分析比较和计算。国考4篇20题。',
      children: [
        {
          name: '基础统计术语',
          type: 'subknowledge',
          content: '掌握资料分析中常用的统计术语和概念。',
          children: [
            { name: '基期与现期', type: 'angle', content: '基期=比较的基准时期；现期=当前时期。' },
            { name: '增长量与增长率', type: 'angle', content: '增长量=现期-基期；增长率=增长量÷基期×100%。' },
            { name: '比重', type: 'angle', content: '部分占总体的比例。比重=部分÷总体×100%。' },
            { name: '平均数与倍数', type: 'angle', content: '平均数=总量÷个数；倍数=A÷B。' },
            { name: '同比与环比', type: 'angle', content: '同比=与上年同期比；环比=与上一统计周期比。' },
            { name: '百分点', type: 'angle', content: '百分数相减的单位。1个百分点=1%。' },
          ],
        },
        {
          name: '速算技巧',
          type: 'subknowledge',
          content: '掌握快速计算的方法，提高解题速度。',
          children: [
            { name: '截位直除', type: 'angle', content: '截取有效数字进行除法计算。' },
            { name: '分数比较', type: 'angle', content: '化同法、差分法、插值法比较分数大小。' },
            { name: '估算与放缩', type: 'angle', content: '合理估算，适当放大或缩小以简化计算。' },
          ],
        },
        { name: '简单计算与比较', type: 'subknowledge' },
        { name: '基期与现期', type: 'subknowledge' },
        { name: '增长量', type: 'subknowledge' },
        { name: '增长率', type: 'subknowledge' },
        { name: '比重相关', type: 'subknowledge' },
        { name: '平均数与倍数', type: 'subknowledge' },
        { name: '综合分析', type: 'subknowledge' },
      ],
    },
    {
      name: '常识判断',
      type: 'knowledge',
      content: '测查应知应会的基本知识及运用这些知识分析判断的能力。',
      children: [
        {
          name: '政治常识',
          type: 'subknowledge',
          children: [
            {
              name: '政治理论',
              type: 'angle',
              children: [
                {
                  name: '马克思主义基本原理',
                  type: 'angle',
                  content: '马克思主义哲学、政治经济学和科学社会主义的基本原理。',
                  children: [
                    { name: '哲学', type: 'angle', content: '唯物论、辩证法（三大规律）、认识论、唯物史观。' },
                    { name: '政治经济学', type: 'angle', content: '商品二因素、劳动二重性、货币、剩余价值理论。' },
                    { name: '科学社会主义', type: 'angle', content: '社会主义从空想到科学、无产阶级革命和专政。' },
                  ],
                },
                {
                  name: '毛泽东思想和中国特色社会主义理论体系',
                  type: 'angle',
                  content: '简称"毛中特"，是马克思主义中国化的理论成果。',
                  children: [
                    {
                      name: '毛泽东思想',
                      type: 'angle',
                      children: [
                        { name: '形成发展', type: 'angle', content: '萌芽（大革命时期）、形成（土地革命时期）、成熟（抗战时期）、继续发展（解放战争和建国后）。' },
                        { name: '活的灵魂', type: 'angle', content: '实事求是、群众路线、独立自主。' },
                        { name: '新民主主义革命', type: 'angle', content: '总路线、三大法宝（统一战线、武装斗争、党的建设）、道路、纲领。' },
                        { name: '社会主义改造与建设', type: 'angle', content: '一化三改、过渡时期总路线。' },
                      ],
                    },
                    { name: '邓小平理论', type: 'angle', content: '解放思想、实事求是；社会主义本质（解放和发展生产力）；初级阶段基本路线；改革开放；社会主义市场经济。' },
                    { name: '"三个代表"重要思想', type: 'angle', content: '代表先进生产力、先进文化、最广大人民根本利益。' },
                    { name: '科学发展观', type: 'angle', content: '第一要义是发展，核心是以人为本，基本要求是全面协调可持续，根本方法是统筹兼顾。' },
                    {
                      name: '习近平新时代中国特色社会主义思想',
                      type: 'angle',
                      content: '当代中国马克思主义、二十一世纪马克思主义。',
                      children: [
                        { name: '创立背景与核心要义', type: 'angle', content: '坚持和发展中国特色社会主义是核心要义。' },
                        { name: '"十个明确"', type: 'angle', content: '核心内容体系的概括。' },
                        { name: '"十四个坚持"', type: 'angle', content: '新时代坚持和发展中国特色社会主义的基本方略。' },
                        { name: '"十三个方面成就"', type: 'angle', content: '新时代取得的历史性成就。' },
                        { name: '中国式现代化', type: 'angle', content: '人口规模巨大、全体人民共同富裕、物质文明和精神文明相协调、人与自然和谐共生、走和平发展道路。' },
                        { name: '新发展理念与新发展格局', type: 'angle', content: '创新、协调、绿色、开放、共享。以国内大循环为主体、国内国际双循环相互促进。' },
                      ],
                    },
                  ],
                },
                { name: '党的创新理论', type: 'angle' },
                { name: '党和国家方针政策', type: 'angle' },
                {
                  name: '时政热点',
                  type: 'angle',
                  children: [
                    { name: '党的基本知识', type: 'angle', content: '党的性质、宗旨、指导思想、初心使命、伟大建党精神。' },
                    { name: '党的组织原则', type: 'angle', content: '民主集中制。' },
                    { name: '党的组织体系', type: 'angle', content: '中央组织、地方组织、基层组织。' },
                    { name: '党员', type: 'angle', content: '义务、权利、入党条件。' },
                    { name: '党的制度', type: 'angle', content: '代表大会制、选举制、任期制。' },
                    { name: '党的纪律', type: 'angle', content: '六大纪律（政治/组织/廉洁/群众/工作/生活）、处分种类（警告/严重警告/撤销党内职务/留党察看/开除党籍）。' },
                    { name: '全面从严治党', type: 'angle', content: '党风廉政建设、反腐败斗争。' },
                    { name: '党的重要会议', type: 'angle', content: '一大到二十大核心内容。' },
                    { name: '党史脉络', type: 'angle', content: '新民主主义革命、社会主义革命和建设、改革开放、新时代。' },
                    { name: '重要提法', type: 'angle', content: '"五位一体""四个全面""四个意识""四个自信""两个维护""两个确立"。' },
                  ],
                },
                { name: '中共党史', type: 'angle' },
                { name: '时政专题', type: 'angle' },
              ],
            },
          ],
        },
        {
          name: '法律常识',
          type: 'subknowledge',
          children: [
            { name: '宪法', type: 'angle', content: '国家根本法。国家性质、政权组织形式、公民基本权利与义务、国家机构。' },
            { name: '民法典', type: 'angle', content: '总则、物权、合同、人格权、婚姻家庭、继承、侵权责任。' },
            { name: '刑法', type: 'angle', content: '犯罪构成、正当防卫/紧急避险、刑罚种类、常见罪名。' },
            { name: '行政法', type: 'angle', content: '行政行为、行政许可、行政处罚、行政复议、行政诉讼。' },
            { name: '公务员法', type: 'angle', content: '公务员的条件、义务与权利、职务与级别、录用与考核。' },
            { name: '新法速递', type: 'angle', content: '近一年新颁布或修订的重要法律法规。' },
          ],
        },
        {
          name: '经济常识',
          type: 'subknowledge',
          children: [
            { name: '微观经济', type: 'angle', content: '供求关系、市场均衡、弹性、边际效用。' },
            { name: '宏观经济', type: 'angle', content: 'GDP、CPI、失业率、财政政策、货币政策。' },
            { name: '市场经济', type: 'angle', content: '市场机制、市场失灵、政府干预。' },
            { name: '国际经济', type: 'angle', content: '汇率、国际贸易、国际组织（IMF/世界银行/WTO）。' },
          ],
        },
        {
          name: '人文历史',
          type: 'subknowledge',
          children: [
            { name: '中国历史', type: 'angle', content: '古代史（夏商周到明清）、近代史（鸦片战争到新中国成立）、现代史。' },
            { name: '世界历史', type: 'angle', content: '世界古代文明、文艺复兴、工业革命、两次世界大战。' },
            {
              name: '文学常识',
              type: 'angle',
              content: '各时期代表作家、作品、文学流派。',
              children: [
                { name: '先秦文学', type: 'angle', content: '《诗经》《楚辞》诸子百家散文。' },
                { name: '秦汉文学', type: 'angle', content: '汉赋、乐府诗、《史记》。' },
                { name: '唐宋文学', type: 'angle', content: '唐诗（李杜）、宋词（苏辛）、唐宋八大家。' },
                { name: '明清文学', type: 'angle', content: '四大名著、《聊斋志异》《儒林外史》。' },
                { name: '现当代文学', type: 'angle', content: '鲁迅、茅盾、巴金、老舍、曹禺。' },
              ],
            },
            { name: '文化常识', type: 'angle', content: '诸子百家、传统节日、礼仪制度、古代科技成就。' },
          ],
        },
        {
          name: '科技地理',
          type: 'subknowledge',
          children: [
            { name: '科技成就', type: 'angle', content: '中国科技成就（航天/高铁/5G/量子）、世界科技成就。' },
            { name: '基础科学', type: 'angle', content: '物理常识（力学/光学/电磁）、化学常识、生物常识。' },
            { name: '生活常识', type: 'angle', content: '健康、安全、环保等日常生活知识。' },
            { name: '中国地理', type: 'angle', content: '地形地貌、气候、河流湖泊、行政区划。' },
            { name: '世界地理', type: 'angle', content: '七大洲四大洋、重要国家与城市、世界之最。' },
          ],
        },
        {
          name: '管理公文',
          type: 'subknowledge',
          children: [
            { name: '行政管理', type: 'angle', content: '行政职能、行政组织、行政决策、行政监督。' },
            { name: '公文格式与文种', type: 'angle', content: '15种法定公文（决议/决定/命令/公报/公告/通告/意见/通知/通报/报告/请示/批复/议案/函/纪要）、格式规范。' },
          ],
        },
      ],
    },
  ],
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface FlatNode {
  id: string;
  name: string;
  parent_id: string | null;
  node_type: string;
  pos_x: number;
  pos_y: number;
  content?: string;
  annotation?: string;
}

let flatNodes: FlatNode[] = [];
let siblingIndex = new Map<string, number>();

function traverse(node: TreeNode, parentId: string | null, depth: number): void {
  const id = genId(node.type);
  const parentKey = parentId || '__root__';
  const sibIdx = siblingIndex.get(parentKey) || 0;
  siblingIndex.set(parentKey, sibIdx + 1);

  flatNodes.push({
    id,
    name: node.name,
    parent_id: parentId,
    node_type: node.type,
    pos_x: depth * 200,
    pos_y: sibIdx * 60,
    content: node.content,
    annotation: node.annotation,
  });

  if (node.children) {
    node.children.forEach(child => traverse(child, id, depth + 1));
  }
}

async function main() {
  console.log('开始生成完整知识树...');
  siblingIndex.clear();
  flatNodes = [];
  traverse(tree, null, 0);
  console.log(`共生成 ${flatNodes.length} 个节点`);

  console.log('清空旧数据...');
  await sql`DELETE FROM knowledge_nodes`;
  await sql`DELETE FROM practice_records`;
  await sql`DELETE FROM ps_history`;

  console.log('写入新数据...');
  for (let i = 0; i < flatNodes.length; i += 50) {
    const batch = flatNodes.slice(i, i + 50);
    for (const node of batch) {
      await sql`
        INSERT INTO knowledge_nodes (id, user_id, name, parent_id, pos_x, pos_y, ps_score, last_practiced_at, color_tag, node_type, content, annotation)
        VALUES (${node.id}, 'default_user', ${node.name}, ${node.parent_id}, ${node.pos_x}, ${node.pos_y}, 50, NULL, 'default', ${node.node_type}, ${node.content || null}, ${node.annotation || null})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, pos_x = EXCLUDED.pos_x, pos_y = EXCLUDED.pos_y,
          node_type = EXCLUDED.node_type, content = EXCLUDED.content, annotation = EXCLUDED.annotation, updated_at = NOW()
      `;
    }
    console.log(`进度: ${Math.min(i + 50, flatNodes.length)}/${flatNodes.length}`);
  }

  const [count] = await sql`SELECT COUNT(*) as c FROM knowledge_nodes` as any;
  console.log(`\n完成！数据库中共有 ${count.c} 个知识点节点`);
}

main().catch(console.error);
