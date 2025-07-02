import axios from 'axios';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

// ✅ Import GrapesJS plugins as functions
import pluginCustomCode from 'grapesjs-custom-code';
import pluginExport from 'grapesjs-plugin-export';
import pluginForms from 'grapesjs-plugin-forms';
import pluginNewsletter from 'grapesjs-preset-newsletter';
import pluginStyleBg from 'grapesjs-style-bg';
import pluginTouch from 'grapesjs-touch';

import React, { useEffect, useRef } from 'react';

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
        blockManager: { appendTo: '#blocks' },
        styleManager: { appendTo: '#styles' },
        plugins: [
          pluginNewsletter,
          pluginForms,
          pluginExport,
          pluginStyleBg,
          pluginCustomCode,
          pluginTouch,
        ],
      });

      // ✅ Custom blocks
      editor.BlockManager.add('text', {
        label: 'Text',
        content: '<div class="text-lg p-2">Your text here</div>',
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

      editor.BlockManager.add('divider', {
        label: 'Divider',
        content: '<hr class="my-4 border-t border-gray-300"/>',
        category: 'Basic',
      });

      editor.BlockManager.add('2-columns', {
        label: '2 Columns',
        content: `
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-200 p-4">Column 1</div>
            <div class="bg-gray-300 p-4">Column 2</div>
          </div>`,
        category: 'Layout',
      });

      editor.BlockManager.add('hero', {
        label: 'Hero Block',
        content: `
          <div style="padding: 50px; text-align: center; background: #f3f4f6">
            <h1 style="font-size: 2rem;">Welcome!</h1>
            <p>This is a hero section</p>
          </div>`,
        category: 'Layout',
      });

      editorRef.current = editor;
    }
  }, []);

  const handleSave = async () => {
    if (!editorRef.current) return;

    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();

    // 🔍 Extract image URLs from HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const imgs = Array.from(tempDiv.getElementsByTagName("img"));
    const image_urls = imgs.map(img => img.getAttribute("src")).filter(Boolean);

    try {
      await axios.post('http://localhost:8000/api/posts/create', {
        html,
        css,
        created_by: 1, // 🔄 Replace with dynamic user ID if needed
        image_urls,
      });
      alert('✅ Post saved to database!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save post.');
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 mb-40">
      {/* Top Save Button */}
      <div className="flex justify-end p-2 bg-gray-100 border-b">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          📂 Save Post
        </button>
      </div>

      {/* Editor UI */}
      <div className="flex h-[calc(100vh-50px)]">
        <div id="blocks" className="w-64 bg-white border-r overflow-y-auto" />
        <div ref={editorContainer} className="flex-1" />
        <div id="styles" className="w-72 bg-white border-l overflow-y-auto" />
      </div>
    </div>
  );
};

export default PostEditor;



// import axios from 'axios';
// import grapesjs from 'grapesjs';
// import 'grapesjs/dist/css/grapes.min.css';

// // ✅ Import GrapesJS plugins as functions
// import pluginCustomCode from 'grapesjs-custom-code';
// import pluginExport from 'grapesjs-plugin-export';
// import pluginForms from 'grapesjs-plugin-forms';
// import pluginNewsletter from 'grapesjs-preset-newsletter';
// import pluginStyleBg from 'grapesjs-style-bg';
// import pluginTouch from 'grapesjs-touch';

// import React, { useEffect, useRef } from 'react';

// const PostEditor: React.FC = () => {
//   const editorRef = useRef<any>(null);
//   const editorContainer = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!editorRef.current && editorContainer.current) {
//       const editor = grapesjs.init({
//         container: editorContainer.current,
//         height: '100vh',
//         width: 'auto',
//         storageManager: false,
//         blockManager: { appendTo: '#blocks' },
//         styleManager: { appendTo: '#styles' },
//         plugins: [
//           pluginNewsletter,
//           pluginForms,
//           pluginExport,
//           pluginStyleBg,
//           pluginCustomCode,
//           pluginTouch,
//         ],
//       });

//       // ✅ Custom blocks
//       editor.BlockManager.add('text', {
//         label: 'Text',
//         content: '<div class="text-lg p-2">Your text here</div>',
//         category: 'Basic',
//       });

//       editor.BlockManager.add('image', {
//         label: 'Image',
//         content: { type: 'image' },
//         category: 'Basic',
//       });

//       editor.BlockManager.add('button', {
//         label: 'Button',
//         content: '<button class="bg-blue-500 text-white px-4 py-2 rounded">Click Me</button>',
//         category: 'Basic',
//       });

//       editor.BlockManager.add('divider', {
//         label: 'Divider',
//         content: '<hr class="my-4 border-t border-gray-300"/>',
//         category: 'Basic',
//       });

//       editor.BlockManager.add('2-columns', {
//         label: '2 Columns',
//         content: `
//           <div class="grid grid-cols-2 gap-4">
//             <div class="bg-gray-200 p-4">Column 1</div>
//             <div class="bg-gray-300 p-4">Column 2</div>
//           </div>`,
//         category: 'Layout',
//       });

//       editor.BlockManager.add('hero', {
//         label: 'Hero Block',
//         content: `
//           <div style="padding: 50px; text-align: center; background: #f3f4f6">
//             <h1 style="font-size: 2rem;">Welcome!</h1>
//             <p>This is a hero section</p>
//           </div>`,
//         category: 'Layout',
//       });

//       editorRef.current = editor;
//     }
//   }, []);

//   const handleSave = async () => {
//     if (!editorRef.current) return;

//     const html = editorRef.current.getHtml();
//     const css = editorRef.current.getCss();

//     try {
//       await axios.post('http://localhost:8000/api/posts/create', {
//         html,
//         css,
//         created_by: 1, // 🔄 Replace with dynamic user ID if needed
//       });
//       alert('✅ Post saved to database!');
//     } catch (err) {
//       console.error(err);
//       alert('❌ Failed to save post.');
//     }
//   };

//   return (
//     <div className="w-full h-full min-h-screen bg-gray-50 mb-40">
//       {/* Top Save Button */}
//       <div className="flex justify-end p-2 bg-gray-100 border-b">
//         <button
//           onClick={handleSave}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//         >
//           💾 Save Post
//         </button>
//       </div>

//       {/* Editor UI */}
//       <div className="flex h-[calc(100vh-50px)]">
//         <div id="blocks" className="w-64 bg-white border-r overflow-y-auto" />
//         <div ref={editorContainer} className="flex-1" />
//         <div id="styles" className="w-72 bg-white border-l overflow-y-auto" />
//       </div>
//     </div>
//   );
// };

// export default PostEditor;
