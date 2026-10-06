// Curated English CV. Facts checked against portfolio-history, project cases,
// and the user's latest career corrections. Client work is listed under LIKE.
module.exports = {
  updated: '2026-10-06',
  name: 'Hyunae Park', role: 'AI Engineer', location: 'Seoul, South Korea',
  email: 'hyunaeee@gmail.com',
  summary: 'I build AI services around real workflows, from retrieval and agent tools to deployment, evaluation, and ongoing maintenance. My work spans language, speech, computer vision, and interactive products.',
  experience: [
    {title:'LIKE Corporation',role:'AI Engineer · Development Division',date:'Sep 2025 — Present',
      items:[
        {title:'Meeting Assistant',url:'../work/meeting/en.html',points:[
          'Own product planning, development, deployment, operations, and maintenance of an internal meeting assistant.',
          'Built a FastAPI and React workflow for transcription, speaker diarization, structured minutes, and Notion/email delivery using faster-whisper, pyannote, Claude, and an RTX 4090.',
          'Separated long-running jobs from HTTP requests, added reconnection after lost upload responses, and preserved transcripts and minutes when downstream steps failed.'
        ]},
        {title:'MED-RAG · client installation',url:'../work/med-rag/en.html',points:[
          'Installed a local RAG assistant on the personal PC of a professor treating breast cancer at Korea University Anam Hospital, and continue to provide remote updates.',
          'Connected case and guideline retrieval with visible source evidence. The installation is scoped to the professor’s PC; public evaluations use a separate synthetic dataset.'
        ]}
      ]},
    {title:'NC AI',role:'AI Research Engineer · Contract',date:'Sep 2025',note:'AI Data Division.'},
    {title:'SolverX',role:'Software Development',date:'Apr — Jun 2024',note:'Startup development work; the company operated as VoltWin during my employment.'},
    {title:'LightMomentus',role:'Software Development · Early Team Member',date:'Oct 2023 — Feb 2024',note:'Contributed to software development as an early member of the startup.'}
  ],
  projects:[
    {title:'Terracotta',url:'../work/terracotta/en.html',role:'Personal AI workspace · Public prototype',date:'Jul 2026 — Present',points:[
      'Implemented model routing, OpenAI and Anthropic tool loops, HTTP MCP connections, and execution traces.',
      'Added approval and resume flows for calls classified as write actions in the agent loop, plus Docker self-hosting and GitHub Actions container publishing.'
    ],links:[['Source','https://github.com/hyunaeee/terracotta']]},
    {title:'MED-RAG · agent evaluation',url:'../work/med-rag/en.html#architecture',role:'Vertex AI · ADK · QLoRA',date:'Jul 2026',points:[
      'Built a researcher–reviewer agent sequence with case and guideline search tools; evaluated retrieval and answer quality separately.',
      'Published a 24-question synthetic evaluation: gold-document retrieval on 23/24; an evidence-aware LLM judge passed 20/24 answers.',
      'Investigated fabricated citations and over-refusal in QLoRA experiments, and recommended the base model after tuning reduced helpfulness.'
    ],links:[['Evaluation','https://github.com/hyunaeee/aengdo-portfolio/blob/main/med-rag-vertex/eval/report.md']]},
    {title:'MED-RAG Serving Lab',url:'../work/serving-lab/en.html',role:'API contracts · Release validation',date:'2026',points:[
      'Pinned model, prompt, dataset, and runtime versions; implemented an SSE gateway, quality checks, and release-artifact validation.',
      'Published 14 rehearsal checks covering HTTP behavior and release gates with synthetic controls and a scripted CPU upstream. GPU inference and production rollout/rollback remain outside the verified scope.'
    ]},
    {title:'Smart Docent',url:'../archive-en.html#docent',role:'Team Lead · Four-person team · Preparing for release',date:'Aug 2025 — Present',points:[
      'Lead product planning, priorities, scheduling, and role allocation for a location-aware AI guide.',
      'Own the place-data pipeline and contribute to architecture and shared LangGraph agent implementation, with Mapbox and multilingual guidance.'
    ]},
    {title:'VisionEye',url:'../work/visioneye/en.html',role:'Detection · Tracking · Model API',date:'Sep 2026',points:[
      'Compared detection and tracking configurations on generated-video inputs, separating observed behavior from unmeasured real-world accuracy.',
      'Built a CPU model API and verified worker recovery after injected timeouts and process exits.'
    ]},
    {title:'RoboSkill Lab',url:'../work/robo-skill/en.html',role:'MuJoCo · Control experiments',date:'Sep 2026',points:[
      'Compared one-shot pushing with repeated observation and re-approach across 24 simulated runs, recording success, task time, contacts, and failures.'
    ]}
  ],
  research:[
    {title:'Korea Brain Research Institute',role:'Research Software Development',date:'Jan — Mar 2023',points:['Developed experimental software and GUIs and contributed to CNN analysis and DeepLabCut-related work using MATLAB, C#, and Python.']},
    {title:'Korea Brain Research Institute',role:'Cognitive Brain Imaging Lab',date:'Jan — Mar 2019',points:['Developed a JavaScript application for delivering behavioral experiments.']}
  ],
  teaching:[
    {title:'Beyond Coding',role:'Computer Science Instructor',date:'Apr 2023 — Dec 2025',points:['Taught computer science and programming in English to international-school students.']},
    {title:'T&B School Edu',role:'Freelance Instructor',date:'Apr — Dec 2022',points:['Delivered computer science career-exploration classes for high-school students across Korea.']}
  ],
  education:[
    {title:'Korea University',role:'Bachelor’s degree',date:'Mar 2017 — Aug 2023',note:'Computer Software and Brain-Cognitive Science.'},
    {title:'National University of Singapore',role:'Computer Science · Exchange',date:'Dec 2019 — May 2020'}
  ],
  training:[
    {title:'Upstage AI Lab',role:'Fourth Cohort',date:'Jul 2024 — Feb 2025',note:'Machine learning, LLMs, RAG, and fine-tuning.'},
    {title:'Korea University',role:'Intelligent Information SW Academy',date:'Sep — Dec 2023',note:'Completed the third-cohort program.'}
  ],
  skills:[
    ['Languages','Python, TypeScript, JavaScript, SQL'],
    ['AI & agents','RAG, Google ADK, LangGraph, LangChain, MCP, PyTorch'],
    ['Models & data','Vertex AI, Claude API, Ollama, Chroma, QLoRA'],
    ['Engineering','FastAPI, React, Next.js, Docker, GitHub Actions'],
    ['Evaluation','Retrieval and answer evaluation, failure analysis, API contract checks']
  ],
  community:[
    {title:'Google Study Jam',role:'AI Study Leader',date:'Jul — Nov 2025',note:'Led a study group through the Google Cloud AI curriculum.'},
    {title:'Google · Built with AI',role:'Hackathon Participant',date:'Jun 2025'},
    {title:'SeoulCon DDP',role:'Invited Artist',date:'Dec 2025',note:'Exhibited N.O.W. in AI Exhibition: Beyond Fluxus.'}
  ],
  contacts:[['Email','mailto:hyunaeee@gmail.com','hyunaeee@gmail.com'],['GitHub','https://github.com/hyunaeee','github.com/hyunaeee'],['Writing','https://velog.io/@hyunaeee','velog.io/@hyunaeee'],['Portfolio','../en.html','Selected work & case studies']]
};
