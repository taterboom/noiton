import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

import { Editor as TuiEditor } from '@toast-ui/react-editor';
import { useRef } from 'react';

type EditorProps = {
  initialValue: string;
  onChange: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialValue, onChange }) => {
  const editorRef = useRef<any>();
  return (
    <TuiEditor
      // @ts-ignore
      ref={editorRef}
      theme='dark'
      previewStyle="vertical"
      height="100%"
      initialEditType="markdown"
      initialValue={initialValue}
      onChange={() => onChange(editorRef.current.getInstance().getMarkdown())}
    />
  )
}

export default Editor;