import React, { useRef, useEffect, useImperativeHandle } from "react";
import {
  EditorView,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  keymap
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput } from "@codemirror/language";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { lintKeymap } from "@codemirror/lint";
import markdownLanguage from "./markdownLanguage";
import { defaultHighlightStyle } from "@codemirror/highlight";
import {
  oneDarkTheme,
  oneDarkHighlightStyle
} from '@codemirror/theme-one-dark'

const THEME = {
  light: [defaultHighlightStyle],
  dark: [oneDarkTheme, oneDarkHighlightStyle]
}

const CodeEditor = React.forwardRef<any, any>(
  // @ts-ignore
  ({ initialValue = "", editorViewRef: editorViewRefProp, onChange }, ref) => {
    const editorViewRefInternal = useRef();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const onChangeRef = useRef();
    onChangeRef.current = onChange;


    const editorViewRef = editorViewRefProp || editorViewRefInternal;

    useImperativeHandle(ref, () => ({
      getValue: () => editorViewRef.current.state.doc.toString()
    }));

    useEffect(() => {
      const updateListener = EditorView.updateListener.of((v) => {
        if (v.docChanged) {
          if (typeof onChangeRef.current === "function") {
            // @ts-ignore
            onChangeRef.current();
          }
        }
      });

      if (containerRef.current) {
        if (!editorViewRef.current) {
          const extensions = [
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            highlightActiveLine(),
            highlightSelectionMatches(),
            keymap.of([
              ...closeBracketsKeymap,
              ...defaultKeymap,
              ...searchKeymap,
              ...historyKeymap,
              ...foldKeymap,
              ...commentKeymap,
              ...completionKeymap,
              ...lintKeymap
            ]),
            ...THEME.dark,
            markdownLanguage,
            updateListener
          ];
          editorViewRef.current = new EditorView({
            state: EditorState.create({
              doc: initialValue,
              extensions
            }),
            parent: containerRef.current
          });
        }
      }

      return () => {
        console.log('卸载');
        editorViewRef.current?.destroy();
      }
    }, []);

    return <div className="h-full" ref={containerRef} />;
  }
);

export default CodeEditor;
