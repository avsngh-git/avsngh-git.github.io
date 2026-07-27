export type Expertise = {
  title: string;
  description: string;
  skills: string[];
  icon: "statistics" | "machine-learning" | "research";
};

export type TimelineEntry = {
  title: string;
  organization?: string;
  period: string;
  description: string;
  kind: "work" | "education";
};

export type Project = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  sourceUrl: string;
  tags: string[];
  kind: "internal" | "external";
  actionLabel: string;
};

export type Proficiency = {
  name: string;
  percentage: 85 | 90;
  group: "methods" | "tools";
};

export const portfolio = {
  name: "Avinash Singh",
  headline: "Statistician & Machine-Learning Researcher",
  description:
    "Statistician and machine-learning researcher focused on robust, interpretable data solutions.",
  imageUrl: "https://github.com/avsngh-git.png",
  about:
    "I’m Avinash Singh, an analytically driven statistician with a foundation in mathematical statistics and machine learning from Stockholm University’s Department of Mathematics. I specialize in evaluating model stability, investigating statistical assumptions, and building uncertainty-quantification frameworks for robust, interpretable data solutions.",
  aboutDetails: [
    "I completed my master’s thesis with the Autonomous Driving Post-Perception & Planning Research Team at TRATON / Scania Group. My work evaluated the UniAD framework under the domain shift from passenger cars to heavy-duty vehicles and applied Conformalized Quantile Regression to produce verifiable predictive uncertainty intervals for trajectory planning.",
    "Previously, as a Data Science Intern at Alyst AB, I built an automated information-extraction and multi-threaded report-summarization pipeline using the Gmail API and Gemini Flash.",
  ],
  links: {
    email: "mailto:avinjsingh@gmail.com",
    github: "https://github.com/avsngh-git",
    linkedin: "https://www.linkedin.com/in/avinashsinghsu",
  },
  resumeUrl: "/assets/resume/Avi_resume_statisticaldatascience.pdf",
  proficiencies: [
    {
      name: "Statistical inference & uncertainty quantification",
      percentage: 90,
      group: "methods",
    },
    {
      name: "Machine learning & deep learning",
      percentage: 85,
      group: "methods",
    },
    {
      name: "Predictive modeling & model validation",
      percentage: 85,
      group: "methods",
    },
    {
      name: "Python, SQL & data tooling",
      percentage: 90,
      group: "tools",
    },
    {
      name: "PyTorch, TensorFlow & Apache Spark",
      percentage: 85,
      group: "tools",
    },
    {
      name: "Research, analysis & technical communication",
      percentage: 90,
      group: "tools",
    },
  ] satisfies Proficiency[],
  expertise: [
    {
      title: "Statistical Inference & Uncertainty",
      description:
        "I evaluate model stability, test statistical assumptions, and build uncertainty-quantification methods for decisions that need calibrated, interpretable evidence.",
      skills: [
        "Statistical inference",
        "Uncertainty quantification",
        "Predictive modeling",
        "Model validation",
        "Conformalized quantile regression",
      ],
      icon: "statistics",
    },
    {
      title: "Machine Learning & Deep Learning",
      description:
        "I design controlled experiments around neural architectures, robustness, representation behavior, and the trade-offs between statistical quality and realized system performance.",
      skills: [
        "Machine learning",
        "Deep learning",
        "PyTorch",
        "TensorFlow",
        "Transformer architectures",
        "Apache Spark",
      ],
      icon: "machine-learning",
    },
    {
      title: "Research Engineering",
      description:
        "I build reproducible data and evaluation pipelines that connect research questions to inspectable artifacts, automated checks, and clear technical communication.",
      skills: [
        "Python",
        "SQL",
        "Data tooling",
        "Research analysis",
        "Technical communication",
        "Reproducible evaluation",
      ],
      icon: "research",
    },
  ] satisfies Expertise[],
  timeline: [
    {
      title: "Master’s Thesis Worker",
      organization: "TRATON / Scania Group",
      period: "2026",
      description:
        "Evaluated autonomous-driving model robustness under domain shift and applied conformalized quantile regression to trajectory-planning uncertainty.",
      kind: "work",
    },
    {
      title: "Summer Data Science Intern",
      organization: "Alyst AB",
      period: "2025",
      description:
        "Built an automated information-extraction and multi-threaded report-summarization pipeline using the Gmail API and Gemini Flash.",
      kind: "work",
    },
    {
      title: "M.Sc. Mathematical Statistics and Machine Learning",
      organization: "Stockholm University",
      period: "2024 – Present",
      description:
        "Focused on probability theory, statistical inference, data structures, and the mathematical properties of deep neural architectures.",
      kind: "education",
    },
    {
      title: "B.Tech. Electrical Engineering",
      organization: "National Institute of Technology Srinagar",
      period: "2011 – 2015",
      description:
        "Built a foundation in linear algebra, calculus, numerical methods, and differential modeling.",
      kind: "education",
    },
  ] satisfies TimelineEntry[],
  projects: [
    {
      title: "Transformer Variants: A Controlled 50-Run Study",
      description:
        "Ten Transformer recipes, fifty controlled runs, five seeds, and 25B processed training tokens—measuring quality, long-context behavior, throughput, model internals, and exact fault recovery.",
      image: "/assets/transformer-variants/thumbnail.svg",
      imageAlt:
        "Abstract comparison of dense, local, and mixture-of-experts Transformer paths",
      href: "/projects/transformer-variants/",
      sourceUrl: "https://github.com/avsngh-git/TransformerVariants",
      kind: "internal",
      actionLabel: "Read Transformer Variants case study",
      tags: [
        "Transformers",
        "PyTorch",
        "CUDA",
        "FlashAttention",
        "FineWeb-Edu",
      ],
    },
    {
      title: "Portfolio Website",
      description:
        "The source for this personal portfolio, migrated to a React and TypeScript application and published on GitHub Pages.",
      image: "https://github.com/avsngh-git.png",
      imageAlt: "Avinash Singh’s GitHub profile avatar",
      href: "https://github.com/avsngh-git/avsngh-git.github.io",
      sourceUrl: "https://github.com/avsngh-git/avsngh-git.github.io",
      kind: "external",
      actionLabel: "Open Portfolio Website project",
      tags: ["React", "TypeScript", "Vite", "GitHub Pages"],
    },
  ] satisfies Project[],
} as const;
