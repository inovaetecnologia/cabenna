import React, { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { DocumentoJSON } from '../lib/itens';
import { Cores } from '../theme/cores';
export default function DocumentoEditor({
  valor,
  mudar,
  cores,
}: {
  valor: DocumentoJSON | null;
  mudar: (json: DocumentoJSON, texto: string) => void;
  cores: Cores;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          protocols: ['https', 'http', 'mailto'],
          isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && /^(https?:|mailto:)/i.test(url),
        },
      }),
      TableKit.configure({ table: { resizable: false } }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: valor ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
    onUpdate: ({ editor }) => mudar(editor.getJSON() as DocumentoJSON, editor.getText()),
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Conteúdo do documento',
        'aria-multiline': 'true',
        class: 'cabenna-documento',
      },
    },
  });
  const estado = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold'),
      italic: editor?.isActive('italic'),
      heading: editor?.isActive('heading'),
      lista: editor?.isActive('bulletList'),
    }),
  });
  if (!editor) return null;
  const botoes = [
    {
      nome: 'Negrito',
      rotulo: 'B',
      acao: () => editor.chain().focus().toggleBold().run(),
      ativo: estado?.bold,
    },
    {
      nome: 'Itálico',
      rotulo: 'I',
      acao: () => editor.chain().focus().toggleItalic().run(),
      ativo: estado?.italic,
    },
    {
      nome: 'Título',
      rotulo: 'H2',
      acao: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      ativo: estado?.heading,
    },
    {
      nome: 'Lista com marcadores',
      rotulo: '• Lista',
      acao: () => editor.chain().focus().toggleBulletList().run(),
      ativo: estado?.lista,
    },
    {
      nome: 'Lista numerada',
      rotulo: '1. Lista',
      acao: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      nome: 'Checklist',
      rotulo: '☑ Lista',
      acao: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      nome: 'Citação',
      rotulo: '“ Citação',
      acao: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      nome: 'Inserir tabela',
      rotulo: 'Tabela',
      acao: () =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      nome: 'Inserir link',
      rotulo: 'Link',
      acao: () => {
        const url = window.prompt('Endereço completo do link (https://...)');
        if (url && /^https?:\/\//i.test(url)) editor.chain().focus().setLink({ href: url }).run();
      },
    },
    { nome: 'Desfazer', rotulo: '↶', acao: () => editor.chain().focus().undo().run() },
    { nome: 'Refazer', rotulo: '↷', acao: () => editor.chain().focus().redo().run() },
  ];
  return (
    <div
      style={{
        border: '1px solid ' + cores.borda,
        borderRadius: 10,
        background: cores.fundo,
        color: cores.texto,
        overflow: 'hidden',
        fontFamily: 'Inter_400Regular, sans-serif',
      }}
    >
      <style>{`.cabenna-documento{min-height:300px;padding:22px;outline:none;font-size:15px;line-height:1.9;overflow-wrap:anywhere}.cabenna-documento p{margin:0 0 12px}.cabenna-documento h1,.cabenna-documento h2,.cabenna-documento h3{font-family:Manrope_700Bold,sans-serif;line-height:1.4}.cabenna-documento blockquote{border-left:3px solid ${cores.salvia};margin:12px 0;padding-left:16px}.cabenna-documento table{border-collapse:collapse;width:100%;table-layout:fixed}.cabenna-documento td,.cabenna-documento th{border:1px solid ${cores.secundario};padding:8px;vertical-align:top}.cabenna-documento a{color:${cores.destaque};text-decoration:underline}.cabenna-documento ul[data-type=taskList]{padding-left:0;list-style:none}.cabenna-documento li[data-type=taskItem]{display:flex;gap:9px}.cabenna-documento input{accent-color:#174C42}.cabenna-documento .tableWrapper{overflow:auto}.cabenna-documento pre{white-space:pre-wrap;background:${cores.suave};padding:12px;border-radius:7px}`}</style>
      <div
        role="toolbar"
        aria-label="Formatação do documento"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          padding: 8,
          borderBottom: '1px solid ' + cores.borda,
        }}
      >
        {botoes.map((b) => (
          <button
            key={b.nome}
            type="button"
            title={b.nome}
            aria-label={b.nome}
            aria-pressed={b.ativo ?? undefined}
            onClick={b.acao}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: '8px 11px',
              border: 0,
              borderRadius: 7,
              background: b.ativo ? cores.destaque : cores.suave,
              color: b.ativo ? cores.destaqueTexto : cores.texto,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
            }}
          >
            {b.rotulo}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
