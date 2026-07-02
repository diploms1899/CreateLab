import { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: Props) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className={clsx("input", error && "input-error", className)} {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
