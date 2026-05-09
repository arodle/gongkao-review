import type { KnowledgeNode, PracticeSet, QuestionBankItem } from './types';

let idCounter = 0;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}_${idCounter}_${Date.now()}`;
}

export function createId(prefix = 'node'): string {
  return genId(prefix);
}

export const SAMPLE_MIND_MAP: KnowledgeNode = {
  id: 'root_1',
  name: '行测',
  type: 'subject',
  content: '行政职业能力测验，简称行测，是公务员考试笔试公共科目之一，主要测查与公务员职业密切相关的、适合通过客观化纸笔测验方式进行考查的基本素质和能力要素。',
  annotation: '行测一般为120分钟，130-135题，时间紧任务重',
  questions: [],
  children: [
    {
      id: 'k_1',
      name: '言语理解与表达',
      type: 'knowledge',
      content: '主要测查运用语言文字进行思考和交流、迅速准确地理解和把握文字材料内涵的能力。',
      questions: [],
      children: [
        {
          id: 'sk_1',
          name: '片段阅读',
          type: 'subknowledge',
          content: '给定一段文字，要求根据文字内容回答问题，常见题型包括主旨概括、意图判断、细节理解等。',
          annotation: '做题技巧：先看问题，再读文段，找关键句',
          questions: [],
          children: [
            {
              id: 'a_1',
              name: '主旨概括题',
              type: 'angle',
              content: '要求概括文段的主旨或中心思想。常见提问方式："这段文字主要说明/讲述/讨论的是""对这段文字概括最准确的是"。',
              annotation: '关键：找主题句，注意转折词、总结词后的内容',
              questions: [
                {
                  id: 'q_1',
                  content: '在宋明理学中，"格物致知"的"格物"二字，最准确的理解是：',
                  options: [
                    { label: 'A', text: '推究事物之理' },
                    { label: 'B', text: '抵御外物诱惑' },
                    { label: 'C', text: '观察事物表象' },
                    { label: 'D', text: '感受事物变化' },
                  ],
                  correctAnswer: 'A',
                  explanation: '"格物"在宋明理学中意为推究事物之理，是认识论的核心概念。朱熹强调通过穷尽事物之理来获取知识。',
                },
                {
                  id: 'q_2',
                  content: '这段文字意在说明：\n"文化是一个国家、一个民族的灵魂。历史和现实都表明，一个抛弃了或者背叛了自己历史文化的民族，不仅不可能发展起来，而且很可能上演一场历史悲剧。"',
                  options: [
                    { label: 'A', text: '文化的重要性' },
                    { label: 'B', text: '历史的教训' },
                    { label: 'C', text: '民族的发展' },
                    { label: 'D', text: '文化多元化' },
                  ],
                  correctAnswer: 'A',
                  explanation: '文段核心围绕"文化是灵魂"展开，强调文化对民族的重要性，属于主旨概括题的典型解题思路。',
                },
              ],
              children: [],
            },
            {
              id: 'a_2',
              name: '意图判断题',
              type: 'angle',
              content: '要求判断作者的意图或目的。常见提问方式："这段文字意在强调/说明/表明""作者通过这段文字最想传达的是"。',
              annotation: '注意区分"意图"与"主旨"：意图更偏向言外之意',
              questions: [
                {
                  id: 'q_3',
                  content: '作家写作时，总想把自己的思想融入作品，但过于直白地表达观点，反而会让读者产生抵触心理。因此，高明的作家往往通过含蓄的方式传递思想。这段话意在强调：',
                  options: [
                    { label: 'A', text: '作家不应该在作品中表达思想' },
                    { label: 'B', text: '含蓄表达思想效果更好' },
                    { label: 'C', text: '读者不喜欢有思想的作品' },
                    { label: 'D', text: '直白表达是写作的大忌' },
                  ],
                  correctAnswer: 'B',
                  explanation: '文段通过对比直白表达和含蓄表达的效果，意在强调含蓄表达思想的优越性，B项最符合作者意图。',
                },
              ],
              children: [],
            },
          ],
        },
        {
          id: 'sk_2',
          name: '逻辑填空',
          type: 'subknowledge',
          content: '在文段中填入最恰当的词语，考查实词、成语、虚词的辨析能力。',
          questions: [],
          children: [
            {
              id: 'a_3',
              name: '实词辨析',
              type: 'angle',
              content: '辨析近义实词的细微差别，包括词义轻重、范围大小、感情色彩、搭配习惯等维度。',
              questions: [
                {
                  id: 'q_4',
                  content: '面对复杂多变的国际形势，我们必须保持清醒的头脑，_______地分析和处理问题。',
                  options: [
                    { label: 'A', text: '冷静' },
                    { label: 'B', text: '寂静' },
                    { label: 'C', text: '清静' },
                    { label: 'D', text: '安静' },
                  ],
                  correctAnswer: 'A',
                  explanation: '"冷静"指沉着、不感情用事，与"保持清醒的头脑"搭配最恰当。"寂静""清静""安静"均侧重安静无声，不符合语境。',
                },
              ],
              children: [],
            },
            {
              id: 'a_4',
              name: '成语辨析',
              type: 'angle',
              content: '辨析常见成语的含义、适用对象、感情色彩、近义成语的区别。高频成语约200个。',
              annotation: '常考成语：独树一帜、标新立异、别出心裁、另起炉灶、不落窠臼等',
              questions: [
                {
                  id: 'q_5',
                  content: '他在学术研究上_______，从不人云亦云，总能提出独到的见解。',
                  options: [
                    { label: 'A', text: '独树一帜' },
                    { label: 'B', text: '标新立异' },
                    { label: 'C', text: '别出心裁' },
                    { label: 'D', text: '另起炉灶' },
                  ],
                  correctAnswer: 'A',
                  explanation: '"独树一帜"指自成一家，与"不人云亦云""独到见解"呼应，强调独特性。"标新立异"偏向故意不同，"别出心裁"偏重设计，"另起炉灶"指重新开始。',
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'k_2',
      name: '数量关系',
      type: 'knowledge',
      content: '主要测查理解、把握事物间量化关系和解决数量关系问题的能力，包括数据关系的分析、推理、判断、运算等。',
      questions: [],
      children: [
        {
          id: 'sk_3',
          name: '数学运算',
          type: 'subknowledge',
          questions: [],
          children: [
            {
              id: 'a_5',
              name: '行程问题',
              type: 'angle',
              content: '研究速度、时间和路程三者关系的问题。核心公式：路程=速度×时间。常见题型：相遇问题、追及问题、流水行船问题。',
              annotation: '行程问题公式图解可帮助理解',
              images: ['https://placehold.co/400x200/e8f4f8/333?text=行程问题+公式%3A+S%3DV×T'],
              questions: [
                {
                  id: 'q_6',
                  content: '甲、乙两人从A、B两地同时出发相向而行，甲的速度是60公里/小时，乙的速度是40公里/小时。两人在距A地180公里处相遇，则A、B两地相距多少公里？',
                  options: [
                    { label: 'A', text: '280' },
                    { label: 'B', text: '300' },
                    { label: 'C', text: '320' },
                    { label: 'D', text: '360' },
                  ],
                  correctAnswer: 'B',
                  explanation: '甲行180公里用时180÷60=3小时。乙行40×3=120公里。总距离=180+120=300公里。',
                },
              ],
              children: [],
            },
            {
              id: 'a_6',
              name: '工程问题',
              type: 'angle',
              content: '研究工作效率、工作时间和工作量三者关系的问题。核心思路：设工作总量为1（或最小公倍数），用效率的倒数表示时间。',
              images: ['https://placehold.co/400x200/fef3c7/333?text=工程问题+总量%3D效率×时间'],
              questions: [
                {
                  id: 'q_7',
                  content: '一项工程，甲单独做需12天完成，乙单独做需18天完成。甲、乙合作3天后，剩下的由乙单独完成，还需多少天？',
                  options: [
                    { label: 'A', text: '4.5天' },
                    { label: 'B', text: '5天' },
                    { label: 'C', text: '6天' },
                    { label: 'D', text: '7.5天' },
                  ],
                  correctAnswer: 'D',
                  explanation: '甲效率1/12，乙效率1/18。合作3天完成3×(1/12+1/18)=3×5/36=5/12。剩余7/12，乙单独需(7/12)÷(1/18)=7/12×18=10.5天，但3天已做，还需10.5-3=7.5天。实际计算：剩余7/12÷(1/18)=7×18/12=10.5天。注意这里合作3天已含在内，剩余=1-5/12=7/12，乙需7/12÷(1/18)=10.5天完成剩余部分。',
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'k_3',
      name: '判断推理',
      type: 'knowledge',
      content: '主要测查对各种事物关系的分析推理能力，包括图形推理、定义判断、类比推理、逻辑判断等。',
      questions: [],
      children: [
        {
          id: 'sk_4',
          name: '图形推理',
          type: 'subknowledge',
          questions: [],
          children: [
            {
              id: 'a_7',
              name: '位置规律',
              type: 'angle',
              questions: [
                {
                  id: 'q_8',
                  content: '一组图形中，黑色方块依次向右移动一格，到最右端后从左侧重新出现，这属于哪种规律？',
                  options: [
                    { label: 'A', text: '平移规律' },
                    { label: 'B', text: '旋转规律' },
                    { label: 'C', text: '翻转规律' },
                    { label: 'D', text: '叠加规律' },
                  ],
                  correctAnswer: 'A',
                  explanation: '黑色方块沿水平方向依次移动，到边界后循环出现，属于典型的平移规律。',
                },
              ],
              children: [],
            },
          ],
        },
        {
          id: 'sk_5',
          name: '逻辑判断',
          type: 'subknowledge',
          questions: [],
          children: [
            {
              id: 'a_8',
              name: '削弱论证',
              type: 'angle',
              questions: [
                {
                  id: 'q_9',
                  content: '某研究显示，每天喝咖啡的人患心脏病的概率低于不喝咖啡的人。因此，喝咖啡有助于预防心脏病。以下哪项如果为真，最能削弱上述论证？',
                  options: [
                    { label: 'A', text: '喝咖啡的人通常也注重锻炼' },
                    { label: 'B', text: '咖啡的种类不同效果不同' },
                    { label: 'C', text: '有些人喝咖啡会失眠' },
                    { label: 'D', text: '心脏病有遗传因素' },
                  ],
                  correctAnswer: 'A',
                  explanation: 'A项指出存在他因（锻炼），可能是锻炼而非咖啡降低了心脏病风险，属于他因削弱，最能削弱原论证的因果关系。',
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'k_4',
      name: '资料分析',
      type: 'knowledge',
      questions: [],
      children: [
        {
          id: 'sk_6',
          name: '增长率计算',
          type: 'subknowledge',
          questions: [],
          children: [
            {
              id: 'a_9',
              name: '同比/环比增长',
              type: 'angle',
              content: '同比增长率=(本期数-上年同期数)/上年同期数×100%；环比增长率=(本期数-上期数)/上期数×100%。',
              annotation: '注意区分同比（与去年同期比）和环比（与上一时期比）',
              images: ['https://placehold.co/400x200/dcfce7/333?text=增长率公式%3A+%28本期-基期%29÷基期'],
              questions: [
                {
                  id: 'q_10',
                  content: '2023年某市GDP为8000亿元，2022年为7200亿元，则该市GDP同比增长率为：',
                  options: [
                    { label: 'A', text: '10.0%' },
                    { label: 'B', text: '11.1%' },
                    { label: 'C', text: '12.5%' },
                    { label: 'D', text: '8.0%' },
                  ],
                  correctAnswer: 'B',
                  explanation: '同比增长率=(8000-7200)/7200×100%=800/7200×100%≈11.1%。',
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'k_5',
      name: '常识判断',
      type: 'knowledge',
      questions: [],
      children: [
        {
          id: 'sk_7',
          name: '政治常识',
          type: 'subknowledge',
          questions: [],
          children: [
            {
              id: 'a_10',
              name: '习近平新时代中国特色社会主义思想',
              type: 'angle',
              questions: [
                {
                  id: 'q_11',
                  content: '习近平新时代中国特色社会主义思想的核心要义是：',
                  options: [
                    { label: 'A', text: '坚持和发展中国特色社会主义' },
                    { label: 'B', text: '全面深化改革' },
                    { label: 'C', text: '全面依法治国' },
                    { label: 'D', text: '全面从严治党' },
                  ],
                  correctAnswer: 'A',
                  explanation: '坚持和发展中国特色社会主义是习近平新时代中国特色社会主义思想的核心要义。',
                },
              ],
              children: [],
            },
          ],
        },
        {
          id: 'sk_8',
          name: '法律常识',
          type: 'subknowledge',
          questions: [],
          children: [
            {
              id: 'a_11',
              name: '宪法',
              type: 'angle',
              questions: [
                {
                  id: 'q_12',
                  content: '根据我国宪法，中华人民共和国的一切权力属于：',
                  options: [
                    { label: 'A', text: '人民' },
                    { label: 'B', text: '公民' },
                    { label: 'C', text: '人民代表大会' },
                    { label: 'D', text: '国家机关' },
                  ],
                  correctAnswer: 'A',
                  explanation: '《宪法》第二条规定：中华人民共和国的一切权力属于人民。',
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

export const SAMPLE_PRACTICE_SETS: PracticeSet[] = [
  {
    id: 'ps_1',
    name: '行测真题模拟卷一',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'pq_1',
        content: '"绿水青山就是金山银山"这一理念体现了：',
        options: [
          { label: 'A', text: '经济发展与生态保护的辩证统一' },
          { label: 'B', text: '生态保护优先于经济发展' },
          { label: 'C', text: '经济发展可以牺牲环境' },
          { label: 'D', text: '环境保护与经济无关' },
        ],
        correctAnswer: 'A',
        explanation: '该理念体现了经济发展与生态保护的辩证统一关系，不是非此即彼的对立关系。',
        linkedAngleId: 'a_10',
        linkedAngleName: '习近平新时代中国特色社会主义思想',
      },
      {
        id: 'pq_2',
        content: '甲、乙两车同时从A地出发前往B地，甲车速度80km/h，乙车速度60km/h。甲车到达B地后立即返回，在距B地40km处与乙车相遇。A、B两地相距：',
        options: [
          { label: 'A', text: '200km' },
          { label: 'B', text: '240km' },
          { label: 'C', text: '280km' },
          { label: 'D', text: '300km' },
        ],
        correctAnswer: 'C',
        explanation: '设AB距离为S。相遇时甲走S+40，乙走S-40。时间相等：(S+40)/80=(S-40)/60，解得S=280km。',
        linkedAngleId: 'a_5',
        linkedAngleName: '行程问题',
      },
      {
        id: 'pq_3',
        content: '下列关于我国宪法表述正确的是：',
        options: [
          { label: 'A', text: '宪法是国家的根本法' },
          { label: 'B', text: '宪法具有最高的法律效力' },
          { label: 'C', text: '宪法的修改由全国人大以全体代表三分之二以上多数通过' },
          { label: 'D', text: '以上都对' },
        ],
        correctAnswer: 'D',
        explanation: '宪法是国家的根本法，具有最高法律效力，其修改需全国人大全体代表三分之二以上多数通过，三个表述均正确。',
        linkedAngleId: 'a_11',
        linkedAngleName: '宪法',
      },
      {
        id: 'pq_4',
        content: '某企业2023年利润为500万元，2022年为400万元，则利润同比增长：',
        options: [
          { label: 'A', text: '20%' },
          { label: 'B', text: '25%' },
          { label: 'C', text: '30%' },
          { label: 'D', text: '50%' },
        ],
        correctAnswer: 'B',
        explanation: '同比增长率=(500-400)/400×100%=25%。',
        linkedAngleId: 'a_9',
        linkedAngleName: '同比/环比增长',
      },
      {
        id: 'pq_5',
        content: '面对困境，他不但没有退缩，反而_______地迎难而上。填入画横线部分最恰当的是：',
        options: [
          { label: 'A', text: '毅然' },
          { label: 'B', text: '仍然' },
          { label: 'C', text: '忽然' },
          { label: 'D', text: '显然' },
        ],
        correctAnswer: 'A',
        explanation: '"毅然"指坚决地、毫不犹豫地，与"没有退缩""迎难而上"语境最吻合。',
        linkedAngleId: 'a_3',
        linkedAngleName: '实词辨析',
      },
    ],
  },
];

// --- Question Bank: unified bank of all questions, categorized by knowledge path ---
export const SAMPLE_QUESTION_BANK: QuestionBankItem[] = [
  // 主旨概括题
  {
    id: 'qb_1',
    content: '在宋明理学中，"格物致知"的"格物"二字，最准确的理解是：',
    options: [
      { label: 'A', text: '推究事物之理' },
      { label: 'B', text: '抵御外物诱惑' },
      { label: 'C', text: '观察事物表象' },
      { label: 'D', text: '感受事物变化' },
    ],
    correctAnswer: 'A',
    explanation: '"格物"在宋明理学中意为推究事物之理，是认识论的核心概念。朱熹强调通过穷尽事物之理来获取知识。',
    linkedAngleId: 'a_1',
    linkedAngleName: '主旨概括题',
    knowledgePath: '行测/言语理解与表达/片段阅读/主旨概括题',
    source: 'mindmap',
    createdAt: '2024-01-01',
  },
  {
    id: 'qb_2',
    content: '这段文字意在说明：\n"文化是一个国家、一个民族的灵魂。历史和现实都表明，一个抛弃了或者背叛了自己历史文化的民族，不仅不可能发展起来，而且很可能上演一场历史悲剧。"',
    options: [
      { label: 'A', text: '文化的重要性' },
      { label: 'B', text: '历史的教训' },
      { label: 'C', text: '民族的发展' },
      { label: 'D', text: '文化多元化' },
    ],
    correctAnswer: 'A',
    explanation: '文段核心围绕"文化是灵魂"展开，强调文化对民族的重要性，属于主旨概括题的典型解题思路。',
    linkedAngleId: 'a_1',
    linkedAngleName: '主旨概括题',
    knowledgePath: '行测/言语理解与表达/片段阅读/主旨概括题',
    source: 'mindmap',
    createdAt: '2024-01-01',
  },
  {
    id: 'qb_3',
    content: '俗话说："良药苦口利于病，忠言逆耳利于行。"这句话主要说明了：',
    options: [
      { label: 'A', text: '好的建议往往不好听但有用' },
      { label: 'B', text: '药都是苦的' },
      { label: 'C', text: '忠言一定逆耳' },
      { label: 'D', text: '要勇于接受批评' },
    ],
    correctAnswer: 'A',
    explanation: '这是一个比喻论证，用"良药苦口"类比"忠言逆耳"，说明好的建议虽然不好听但有实际价值。',
    linkedAngleId: 'a_1',
    linkedAngleName: '主旨概括题',
    knowledgePath: '行测/言语理解与表达/片段阅读/主旨概括题',
    source: 'upload',
    createdAt: '2024-01-15',
  },
  // 意图判断题
  {
    id: 'qb_4',
    content: '作家写作时，总想把自己的思想融入作品，但过于直白地表达观点，反而会让读者产生抵触心理。因此，高明的作家往往通过含蓄的方式传递思想。这段话意在强调：',
    options: [
      { label: 'A', text: '含蓄表达比直白表达更好' },
      { label: 'B', text: '作家不应该表达自己的观点' },
      { label: 'C', text: '读者不喜欢直白的写作方式' },
      { label: 'D', text: '写作应当追求思想的深度' },
    ],
    correctAnswer: 'A',
    explanation: '文段通过对比直白与含蓄两种方式，强调含蓄表达的优越性，意图判断需把握作者倾向。',
    linkedAngleId: 'a_2',
    linkedAngleName: '意图判断题',
    knowledgePath: '行测/言语理解与表达/片段阅读/意图判断题',
    source: 'mindmap',
    createdAt: '2024-01-01',
  },
  {
    id: 'qb_5',
    content: '近年来，不少城市开始推行垃圾分类制度，但在实际操作中仍面临诸多困难。有专家指出，垃圾分类的关键在于公众意识的培养，而非单纯依赖制度约束。这段话意在强调：',
    options: [
      { label: 'A', text: '垃圾分类制度不够完善' },
      { label: 'B', text: '公众意识比制度约束更重要' },
      { label: 'C', text: '垃圾分类应该完全靠自觉' },
      { label: 'D', text: '制度约束在垃圾分类中没有作用' },
    ],
    correctAnswer: 'B',
    explanation: '专家观点明确指出"关键在于公众意识的培养，而非单纯依赖制度约束"，强调公众意识的重要性。',
    linkedAngleId: 'a_2',
    linkedAngleName: '意图判断题',
    knowledgePath: '行测/言语理解与表达/片段阅读/意图判断题',
    source: 'upload',
    createdAt: '2024-01-20',
  },
  // 实词辨析
  {
    id: 'qb_6',
    content: '面对困境，他不但没有退缩，反而_______地迎难而上。填入画横线部分最恰当的是：',
    options: [
      { label: 'A', text: '毅然' },
      { label: 'B', text: '仍然' },
      { label: 'C', text: '忽然' },
      { label: 'D', text: '显然' },
    ],
    correctAnswer: 'A',
    explanation: '"毅然"指坚决地、毫不犹豫地，与"没有退缩""迎难而上"语境最吻合。',
    linkedAngleId: 'a_3',
    linkedAngleName: '实词辨析',
    knowledgePath: '行测/言语理解与表达/逻辑填空/实词辨析',
    source: 'practice',
    createdAt: '2024-02-01',
  },
  {
    id: 'qb_7',
    content: '_______的秋风吹过田野，金黄的稻穗随风摇曳。填入画横线部分最恰当的是：',
    options: [
      { label: 'A', text: '萧瑟' },
      { label: 'B', text: '凛冽' },
      { label: 'C', text: '和煦' },
      { label: 'D', text: '凛然' },
    ],
    correctAnswer: 'A',
    explanation: '"萧瑟"形容秋风凄凉冷落，与下文"金黄的稻穗"的秋收景象搭配最恰当。"凛冽"形容冬天寒风，"和煦"形容春风，"凛然"形容严肃令人敬畏。',
    linkedAngleId: 'a_3',
    linkedAngleName: '实词辨析',
    knowledgePath: '行测/言语理解与表达/逻辑填空/实词辨析',
    source: 'upload',
    createdAt: '2024-02-10',
  },
  // 成语辨析
  {
    id: 'qb_8',
    content: '他在学术研究中_______，终于取得了突破性成果。填入画横线部分最恰当的是：',
    options: [
      { label: 'A', text: '孜孜不倦' },
      { label: 'B', text: '敷衍塞责' },
      { label: 'C', text: '半途而废' },
      { label: 'D', text: '得过且过' },
    ],
    correctAnswer: 'A',
    explanation: '"孜孜不倦"指勤奋努力不知疲倦，与"终于取得突破性成果"的逻辑因果一致。',
    linkedAngleId: 'a_4',
    linkedAngleName: '成语辨析',
    knowledgePath: '行测/言语理解与表达/逻辑填空/成语辨析',
    source: 'mindmap',
    createdAt: '2024-01-01',
  },
  {
    id: 'qb_9',
    content: '这部电影的情节_______，让人看得目不转睛。填入画横线部分最恰当的是：',
    options: [
      { label: 'A', text: '跌宕起伏' },
      { label: 'B', text: '平淡无奇' },
      { label: 'C', text: '索然无味' },
      { label: 'D', text: '千篇一律' },
    ],
    correctAnswer: 'A',
    explanation: '"跌宕起伏"形容事物起伏变化大，与"目不转睛"的关注度一致。其他选项为贬义，与语境不符。',
    linkedAngleId: 'a_4',
    linkedAngleName: '成语辨析',
    knowledgePath: '行测/言语理解与表达/逻辑填空/成语辨析',
    source: 'upload',
    createdAt: '2024-02-15',
  },
  // 行程问题
  {
    id: 'qb_10',
    content: '甲乙两地相距300公里，一辆汽车从甲地出发，以每小时60公里的速度行驶，另一辆汽车同时从乙地出发，以每小时40公里的速度行驶，两车相向而行，几小时后相遇？',
    options: [
      { label: 'A', text: '2小时' },
      { label: 'B', text: '3小时' },
      { label: 'C', text: '4小时' },
      { label: 'D', text: '5小时' },
    ],
    correctAnswer: 'B',
    explanation: '相遇时间 = 路程 ÷ 速度和 = 300 ÷ (60+40) = 3小时。',
    linkedAngleId: 'a_5',
    linkedAngleName: '行程问题',
    knowledgePath: '行测/数量关系/数学运算/行程问题',
    source: 'mindmap',
    createdAt: '2024-01-01',
  },
  {
    id: 'qb_11',
    content: '一列火车长200米，以每秒20米的速度通过一座长800米的桥，需要多少秒？',
    options: [
      { label: 'A', text: '40秒' },
      { label: 'B', text: '50秒' },
      { label: 'C', text: '60秒' },
      { label: 'D', text: '30秒' },
    ],
    correctAnswer: 'B',
    explanation: '通过桥的总距离 = 车长 + 桥长 = 200 + 800 = 1000米，时间 = 1000 ÷ 20 = 50秒。',
    linkedAngleId: 'a_5',
    linkedAngleName: '行程问题',
    knowledgePath: '行测/数量关系/数学运算/行程问题',
    source: 'upload',
    createdAt: '2024-02-20',
  },
  // 工程问题
  {
    id: 'qb_12',
    content: '一项工程，甲单独做需12天完成，乙单独做需18天完成，两人合作几天可以完成？',
    options: [
      { label: 'A', text: '6天' },
      { label: 'B', text: '7.2天' },
      { label: 'C', text: '8天' },
      { label: 'D', text: '9天' },
    ],
    correctAnswer: 'B',
    explanation: '甲效率1/12，乙效率1/18，合作效率=1/12+1/18=5/36，时间=36/5=7.2天。',
    linkedAngleId: 'a_6',
    linkedAngleName: '工程问题',
    knowledgePath: '行测/数量关系/数学运算/工程问题',
    source: 'mindmap',
    createdAt: '2024-01-01',
  },
  // 增长率
  {
    id: 'qb_13',
    content: '某企业2023年利润为500万元，2022年为400万元，则利润同比增长：',
    options: [
      { label: 'A', text: '20%' },
      { label: 'B', text: '25%' },
      { label: 'C', text: '30%' },
      { label: 'D', text: '50%' },
    ],
    correctAnswer: 'B',
    explanation: '同比增长率=(500-400)/400×100%=25%。',
    linkedAngleId: 'a_9',
    linkedAngleName: '同比/环比增长',
    knowledgePath: '行测/资料分析/增长量与增长率/同比/环比增长',
    source: 'practice',
    createdAt: '2024-01-01',
  },
  {
    id: 'qb_14',
    content: '某市2023年上半年GDP为8000亿元，同比增长8%，则2022年上半年GDP约为：',
    options: [
      { label: 'A', text: '7200亿元' },
      { label: 'B', text: '7407亿元' },
      { label: 'C', text: '7360亿元' },
      { label: 'D', text: '7600亿元' },
    ],
    correctAnswer: 'B',
    explanation: '基期值=现期值÷(1+增长率)=8000÷1.08≈7407亿元。',
    linkedAngleId: 'a_9',
    linkedAngleName: '同比/环比增长',
    knowledgePath: '行测/资料分析/增长量与增长率/同比/环比增长',
    source: 'upload',
    createdAt: '2024-03-01',
  },
];
