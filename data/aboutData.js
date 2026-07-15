/**
 * About-page content: experience, education, skills, publications,
 * certifications, and conferences. Single source of truth consumed by
 * layouts/AuthorLayout.tsx (rendering) and scripts/ingest-knowledge.mjs
 * (chatbot knowledge base) — edit here and both stay in sync.
 */
const aboutData = {
  experience: [
    {
      period: 'May 2025 – Aug 2025',
      location: 'Palo Alto, CA',
      role: 'Data Scientist',
      company: 'Rivian & Volkswagen Group Technologies',
      logoUrl: '/static/images/logos/rivian.png',
      logoInitial: 'R',
      logoBg: 'bg-yellow-600',
      bullets: [
        'Built scalable <strong>RAG pipelines</strong> on <strong>Databricks</strong> (Delta Lake, MLflow) using <strong>vector embeddings</strong> (Pinecone/FAISS) and <strong>LangChain</strong> to enable intelligent retrieval across large automotive regulatory corpora, reducing manual review effort by <strong>95%</strong>.',
        'Preprocessed and analyzed <strong>50,000+ unstructured customer reviews</strong> from Reddit and X (Twitter); built and evaluated an <strong>NLP sentiment classifier</strong> (<strong>85%+ accuracy</strong>) and <strong>entity recognition pipeline</strong>, surfacing 200+ actionable automotive product insights per month and reducing issue response time by <strong>40%</strong>.',
        'Tracked model performance and hyperparameter configurations in <strong>MLflow</strong>; maintained reproducible experiment logs and version-controlled all pipeline code via <strong>Git</strong>.',
        'Built <strong>Tableau dashboards</strong> to communicate model behavior and insights to senior leadership; partnered with cross-functional stakeholders to accelerate delivery by <strong>20%</strong>.',
      ],
    },
    {
      period: 'Jan 2024 – Dec 2025',
      location: 'Lafayette, LA',
      role: 'Data Science & AI Teaching Assistant',
      company: 'CGI / University of Louisiana at Lafayette',
      logoUrl: '/static/images/logos/cgi.png',
      logoInitial: 'C',
      logoBg: 'bg-red-600',
      bullets: [
        'Led applied <strong>ML and GenAI</strong> curriculum with <strong>CGI Inc.</strong>, mentoring <strong>150+ students</strong> on statistical modeling, model evaluation, EDA, and <strong>LLM fine-tuning</strong>; designed hands-on Python labs covering regression, classification, and ensemble methods.',
        'Delivered comprehensive training on AI frameworks including <strong>PyTorch</strong>, <strong>Transformer architectures</strong>, <strong>GPT</strong>, <strong>BERT</strong>, and <strong>prompt engineering</strong>; designed hands-on labs covering machine learning algorithms for <strong>50+ students</strong>.',
      ],
    },
    {
      period: 'Apr 2021 – Nov 2022',
      location: 'New York, NY',
      role: 'Machine Learning Engineer',
      company: 'FuseMachines, Inc.',
      logoUrl: '/static/images/logos/fusemachines.png',
      logoInitial: 'F',
      logoBg: 'bg-blue-600',
      bullets: [
        'Built and evaluated deep learning models (<strong>3D U-Net</strong>, <strong>PyTorch</strong>) for medical image segmentation achieving <strong>~0.85 Dice score</strong>; assessed new clinical data sources and preprocessed multi-modal datasets using <strong>PySpark</strong> for scalable downstream modeling.',
        'Developed <strong>EHR-based</strong> disease prognosis pipelines using <strong>Cox proportional hazards</strong> and <strong>XGBoost</strong>; improved early-detection <strong>AUC from 0.72 to 0.81</strong> and presented results to clinical stakeholders via dashboards.',
        'Contributed to <strong>REST API</strong> integrations for model inference; collaborated with IT on deployment workflows, <strong>model versioning</strong>, and production readiness.',
      ],
    },
  ],

  education: [
    {
      period: 'Jan 2024 – Dec 2025',
      location: 'Lafayette, LA',
      degree: 'M.S. Computer Science',
      school: 'University of Louisiana at Lafayette',
      logoUrl: '/static/images/logos/ul-lafayette.png',
      logoInitial: 'UL',
      logoBg: 'bg-red-700',
      note: '4.0 GPA',
    },
  ],

  skillGroups: [
    { label: 'Languages', value: 'Python, SQL, C++, TypeScript' },
    {
      label: 'AI Frameworks',
      value: 'LangChain, PyTorch, TensorFlow, OpenAI, HuggingFace, LlamaIndex',
    },
    {
      label: 'Machine Learning',
      value: 'Natural Language Processing, Deep Learning, Pre-trained Models, Model Integration',
    },
    {
      label: 'Cloud Technologies',
      value: 'AWS, Azure, GCP, Databricks (Delta Lake, MLflow), Data Lakes',
    },
    {
      label: 'Data & Analytics',
      value: 'Large Datasets, Data Pipelines, Vector Databases (Pinecone, FAISS), ETL',
    },
    {
      label: 'Development',
      value:
        'Version Control Systems (Git), Agile Methodologies, CI/CD, Docker, Software Development',
    },
  ],

  publications: [
    {
      citationParts: [
        { text: 'Gaire R.R., Subedi R., ', bold: false },
        { text: 'Sharma A.', bold: true },
        {
          text: ', Subedi S., Ghimire S.K., Shakya S. (2022) GAN-Based Two-Step Pipeline for Real-World Image Super-Resolution.',
          bold: false,
        },
      ],
      venue:
        'ICT with Intelligent Applications. Smart Innovation, Systems and Technologies, vol 248. Springer, Singapore.',
      url: 'https://link.springer.com/chapter/10.1007%2F978-981-16-4177-0_75',
    },
  ],

  certifications: [
    {
      title: 'Machine Learning Specialization',
      issuer: 'Stanford University',
      logoInitial: 'S',
      logoBg: 'bg-red-700',
      logoUrl: '/static/images/logos/stanford.png',
      url: 'https://www.coursera.org/account/accomplishments/verify/ZD4PHJ2FEF4H',
    },
    {
      title: 'Data Engineering Specialization',
      issuer: 'Amazon Web Services (AWS)',
      logoInitial: 'AWS',
      logoBg: 'bg-gray-900',
      logoUrl: '/static/images/logos/aws.png',
      url: 'https://www.coursera.org/account/accomplishments/specialization/637M2BBSLAF5',
    },
    {
      title: 'Deep Learning Specialization',
      issuer: 'Coursera',
      logoInitial: 'C',
      logoBg: 'bg-blue-600',
      logoUrl: '/static/images/logos/coursera.png',
      cover: true,
      url: 'https://www.coursera.org/account/accomplishments/specialization/UZE6U8PEXWGV',
    },
    {
      title: 'Linear Algebra & Calculus',
      issuer: 'MIT OpenCourseWare',
      logoInitial: 'MIT',
      logoBg: 'bg-red-800',
      logoUrl: '/static/images/logos/mit.svg',
      url: '',
    },
    {
      title: 'MCP · Claude Code · Claude API · Agent Skills · Subagents · Amazon Bedrock',
      issuer: 'Anthropic',
      logoInitial: 'A',
      logoBg: 'bg-gray-900',
      logoUrl: '/static/images/logos/anthropic.svg',
      url: '',
    },
  ],

  conferences: [
    {
      name: 'NVIDIA GTC 2026',
      detail: 'March 16–19, 2026 · San Jose, CA',
      logoUrl: '/static/images/logos/nvidia-gtc.jpg',
      logoBg: 'bg-black',
      logoInitial: 'GTC',
      cover: true,
    },
    {
      name: 'Stanford AI+Health 2025',
      detail: 'December 9–10, 2025 · Stanford University · Virtual',
      logoUrl: '/static/images/logos/stanford.png',
      logoBg: 'bg-red-800',
      logoInitial: 'AI+H',
      cover: false,
    },
  ],
}

module.exports = aboutData
