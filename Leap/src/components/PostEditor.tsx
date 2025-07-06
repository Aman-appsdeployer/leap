import axios from 'axios';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

import pluginCustomCode from 'grapesjs-custom-code';
import pluginExport from 'grapesjs-plugin-export';
import pluginForms from 'grapesjs-plugin-forms';
import pluginNewsletter from 'grapesjs-preset-newsletter';
import pluginStyleBg from 'grapesjs-style-bg';
import pluginTouch from 'grapesjs-touch';

import { ArrowLeft } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const editorContainer = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [titleConfirmed, setTitleConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (titleConfirmed && !editorRef.current && editorContainer.current) {
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
  }, [titleConfirmed]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    setIsSaving(true);

    let html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const imgs = Array.from(tempDiv.getElementsByTagName('img'));
    const image_urls: string[] = [];

    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (!src) continue;

      if (src.startsWith('data:image')) {
        try {
          const blob = await (await fetch(src)).blob();
          const formData = new FormData();
          formData.append('file', blob, 'image.jpg');

          const res = await axios.post('http://localhost:8000/api/posts/upload-image', formData);
          const imageUrl = res.data.url;

          img.setAttribute('src', imageUrl);
          image_urls.push(imageUrl);
        } catch (err) {
          console.error('Image upload failed:', err);
        }
      } else {
        image_urls.push(src);
      }
    }

    html = tempDiv.innerHTML;

    try {
      await axios.post('http://localhost:8000/api/posts/create', {
        title,
        html,
        css,
        created_by: 1,
        image_urls,
      });

      setSuccessMessage('✅ Post saved successfully!!');
      setTimeout(() => {
        navigate(-1);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save post.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 mb-40">
      {!titleConfirmed ? (
        <div className="flex flex-col items-center justify-center h-screen bg-white p-6">
          <h1 className="text-xl font-semibold mb-4">Enter Post Title</h1>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post Title"
            className="border p-2 rounded w-full max-w-md"
          />
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!title.trim()}
            onClick={() => setTitleConfirmed(true)}
          >
            Start Editing
          </button>
        </div>
      ) : (
        <>
          {/* Top Toolbar */}
          <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-black px-2"
              title="Go Back"
            >
              <ArrowLeft size={24} />
            </button>

            <h2 className="text-lg font-semibold">{title}</h2>

            <button
              onClick={handleSave}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isSaving}
            >
              📂 {isSaving ? 'Saving...' : 'Save Post'}
            </button>
          </div>

          {successMessage && (
            <div className="text-center p-4 text-green-600 font-medium bg-green-100">
              {successMessage}
            </div>
          )}

          <div className="flex h-[calc(100vh-50px)]">
            <div id="blocks" className="w-64 bg-white border-r overflow-y-auto" />
            <div ref={editorContainer} className="flex-1" />
            <div id="styles" className="w-72 bg-white border-l overflow-y-auto" />
          </div>
        </>
      )}
    </div>
  );
};

export default PostEditor;



// import axios from 'axios';
// import grapesjs from 'grapesjs';
// import 'grapesjs/dist/css/grapes.min.css';

// import pluginCustomCode from 'grapesjs-custom-code';
// import pluginExport from 'grapesjs-plugin-export';
// import pluginForms from 'grapesjs-plugin-forms';
// import pluginNewsletter from 'grapesjs-preset-newsletter';
// import pluginStyleBg from 'grapesjs-style-bg';
// import pluginTouch from 'grapesjs-touch';

// import { ArrowLeft } from 'lucide-react'; // Icon library (if using lucide-react)
// import React, { useEffect, useRef, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// const PostEditor: React.FC = () => {
//   const editorRef = useRef<any>(null);
//   const editorContainer = useRef<HTMLDivElement>(null);
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [title, setTitle] = useState('');
//   const [titleConfirmed, setTitleConfirmed] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');

//   useEffect(() => {
//     if (titleConfirmed && !editorRef.current && editorContainer.current) {
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
//   }, [titleConfirmed]);

//   const handleSave = async () => {
//     if (!editorRef.current) return;
//     setIsSaving(true);

//     const html = editorRef.current.getHtml();
//     const css = editorRef.current.getCss();

//     const tempDiv = document.createElement("div");
//     tempDiv.innerHTML = html;
//     const imgs = Array.from(tempDiv.getElementsByTagName("img"));
//     const image_urls = imgs.map(img => img.getAttribute("src")).filter(Boolean);

//     try {
//       await axios.post('http://localhost:8000/api/posts/create', {
//         html,
//         css,
//         title,
//         created_by: 1,
//         image_urls,
//       });

//       setSuccessMessage("✅ Post saved successfully! Redirecting...");
//       setTimeout(() => {
//         navigate(-1); // go back to previous page
//       }, 5000);
//     } catch (err) {
//       console.error(err);
//       alert('❌ Failed to save post.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="w-full h-full min-h-screen bg-gray-50 mb-40">
//       {!titleConfirmed ? (
//         <div className="flex flex-col items-center justify-center h-screen bg-white p-6">
//           <h1 className="text-xl font-semibold mb-4">Enter Post Title</h1>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Post Title"
//             className="border p-2 rounded w-full max-w-md"
//           />
//           <button
//             className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
//             disabled={!title.trim()}
//             onClick={() => setTitleConfirmed(true)}
//           >
//             Start Editing
//           </button>
//         </div>
//       ) : (
//         <>
//           {/* Top Toolbar */}
//           <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
//             {/* Back Icon */}
//             <button
//               onClick={() => navigate(-1)}
//               className="text-gray-600 hover:text-black px-2"
//               title="Go Back"
//             >
//               <ArrowLeft size={24} />
//             </button>

//             <h2 className="text-lg font-semibold">{title}</h2>

//             <button
//               onClick={handleSave}
//               className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
//               disabled={isSaving}
//             >
//               📂 {isSaving ? "Saving..." : "Save Post"}
//             </button>
//           </div>

//           {/* Success Message */}
//           {successMessage && (
//             <div className="text-center p-4 text-green-600 font-medium bg-green-100">
//               {successMessage}
//             </div>
//           )}

//           {/* Editor UI */}
//           <div className="flex h-[calc(100vh-50px)]">
//             <div id="blocks" className="w-64 bg-white border-r overflow-y-auto" />
//             <div ref={editorContainer} className="flex-1" />
//             <div id="styles" className="w-72 bg-white border-l overflow-y-auto" />
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default PostEditor;




// import axios from 'axios';
// import grapesjs from 'grapesjs';
// import 'grapesjs/dist/css/grapes.min.css';

// import pluginCustomCode from 'grapesjs-custom-code';
// import pluginExport from 'grapesjs-plugin-export';
// import pluginForms from 'grapesjs-plugin-forms';
// import pluginNewsletter from 'grapesjs-preset-newsletter';
// import pluginStyleBg from 'grapesjs-style-bg';
// import pluginTouch from 'grapesjs-touch';

// import React, { useEffect, useRef, useState } from 'react';
// import { useLocation } from 'react-router-dom';

// const PostEditor: React.FC = () => {
//   const editorRef = useRef<any>(null);
//   const editorContainer = useRef<HTMLDivElement>(null);
//   const location = useLocation();
//   const [title, setTitle] = useState('');
//   const [titleConfirmed, setTitleConfirmed] = useState(false);

//   useEffect(() => {
//     if (titleConfirmed && !editorRef.current && editorContainer.current) {
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

//       // Optional: add your own custom blocks
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
//   }, [titleConfirmed]);

//   const handleSave = async () => {
//     if (!editorRef.current) return;

//     const html = editorRef.current.getHtml();
//     const css = editorRef.current.getCss();

//     const tempDiv = document.createElement("div");
//     tempDiv.innerHTML = html;
//     const imgs = Array.from(tempDiv.getElementsByTagName("img"));
//     const image_urls = imgs.map(img => img.getAttribute("src")).filter(Boolean);

//     try {
//       await axios.post('http://localhost:8000/api/posts/create', {
//         html,
//         css,
//         title,
//         created_by: 1, // Replace with dynamic teacher ID if available
//         image_urls,
//       });
//       alert('✅ Post saved to database!');
//     } catch (err) {
//       console.error(err);
//       alert('❌ Failed to save post.');
//     }
//   };

//   return (
//     <div className="w-full h-full min-h-screen bg-gray-50 mb-40">
//       {!titleConfirmed ? (
//         <div className="flex flex-col items-center justify-center h-screen bg-white p-6">
//           <h1 className="text-xl font-semibold mb-4">Enter Post Title</h1>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Post Title"
//             className="border p-2 rounded w-full max-w-md"
//           />
//           <button
//             className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
//             disabled={!title.trim()}
//             onClick={() => setTitleConfirmed(true)}
//           >
//             Start Editing
//           </button>
//         </div>
//       ) : (
//         <>
//           {/* Save Button */}
//           <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
//             <h2 className="text-lg font-semibold">{title}</h2>
//             <button
//               onClick={handleSave}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//             >
//               📂 Save Post
//             </button>
//           </div>

//           {/* Editor UI */}
//           <div className="flex h-[calc(100vh-50px)]">
//             <div id="blocks" className="w-64 bg-white border-r overflow-y-auto" />
//             <div ref={editorContainer} className="flex-1" />
//             <div id="styles" className="w-72 bg-white border-l overflow-y-auto" />
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default PostEditor;




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

//     // 🔍 Extract image URLs from HTML
//     const tempDiv = document.createElement("div");
//     tempDiv.innerHTML = html;
//     const imgs = Array.from(tempDiv.getElementsByTagName("img"));
//     const image_urls = imgs.map(img => img.getAttribute("src")).filter(Boolean);

//     try {
//       await axios.post('http://localhost:8000/api/posts/create', {
//         html,
//         css,
//         created_by: 1, // 🔄 Replace with dynamic user ID if needed
//         image_urls,
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
//           📂 Save Post
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






