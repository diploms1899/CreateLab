interface Props {
  output: string;
}

export default function BuildOutput({ output }: Props) {
  if (!output) return null;
  return (
    <div className="build-output">
      <pre>{output}</pre>
    </div>
  );
}
