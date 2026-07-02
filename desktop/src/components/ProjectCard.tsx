import { motion } from "framer-motion";
import { ProjectTemplate } from "../stores/projectStore";
import { ArrowRight, Gamepad2, Fish, Bot, Calculator } from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  platformer: Gamepad2,
  fishing: Fish,
  robotics: Bot,
  calculator: Calculator,
};

interface Props {
  project: ProjectTemplate;
  onSelect: () => void;
}

export default function ProjectCard({ project, onSelect }: Props) {
  const Icon = iconMap[project.slug] ?? Calculator;

  return (
    <motion.button
      className="project-card"
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="project-card-icon">
        <Icon size={48} />
      </div>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <span className="project-card-action">
        Start Project <ArrowRight size={16} />
      </span>
    </motion.button>
  );
}
