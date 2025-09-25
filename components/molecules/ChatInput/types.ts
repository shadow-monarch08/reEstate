export type ChatInputProps = {
  value?: string;
  handleInput: (param: string) => void;
  placeholder?: string;
  handleSubmit: (m?: string) => void;
};
