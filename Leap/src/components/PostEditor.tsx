import axios from 'axios';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import React, { useEffect, useRef } from 'react';

// Optional: Add this if you want more blocks like columns, buttons, etc.
import 'grapesjs-preset-newsletter';

const PostEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const editorContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current && editorContainer.current) {
      const editor = grapesjs.init({
        container: editorContainer.current,
        height: '100vh',
        width: 'auto',
        storageManager: false,
        fromElement: false,
        blockManager: {
          appendTo: '#blocks',
        },
        styleManager: {
          appendTo: '#styles',
        },
        plugins: ['gjs-preset-newsletter'],
        pluginsOpts: {
          'gjs-preset-newsletter': {},
        },
      });

      // Add custom blocks
      editor.BlockManager.add('text', {
        label: 'Text',
        content: '<div class="p-2 text-lg">Insert your text</div>',
        category: 'Basic',
      });

      editor.BlockManager.add('image', {
        label: 'Image',
        content: { type: 'image' },
        category: 'Basic',
      });

      editor.BlockManager.add('button', {
        label: 'Button',
        content: '<button class="bg-blue-500 text-white px-4 py-2 rounded">Click Me</button>',
        category: 'Basic',
      });

      editor.BlockManager.add('2-column', {
        label: '2 Columns',
        content: `
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-100 p-4">Left</div>
            <div class="bg-gray-200 p-4">Right</div>
          </div>`,
        category: 'Layout',
      });

      editorRef.current = editor;
    }
  }, []);

  const handleSave = async () => {
    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();

    try {
      const response = await axios.post('http://localhost:8000/api/posts/create', {
        html,
        css,
        created_by: 1, // replace with actual user ID if available
      });
      alert('✅ Post saved to database!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save post.');
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 mb-16">
      {/* Save Button */}
      <div className="flex justify-end p-2 bg-gray-100 border-b">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          💾 Save Post
        </button>
      </div>

      {/* Editor Layout */}
      <div className="flex h-[calc(100vh-50px)]">
        {/* Left Block Panel */}
        <div id="blocks" className="w-56 bg-white border-r overflow-y-auto" />

        {/* GrapesJS Editor */}
        <div ref={editorContainer} className="flex-1" />

        {/* Right Style Panel */}
        <div id="styles" className="w-64 bg-white border-l overflow-y-auto" />
      </div>
    </div>
  );
};

export default PostEditor;
