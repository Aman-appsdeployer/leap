// import endpoints from '@/api/endpoints'; // ✅ Use centralized endpoint config
// import axios from 'axios';
// import React, { useEffect, useState } from 'react';

// interface PostImage {
//   image_url: string;
// }

// interface Post {
//   id: number;
//   title: string;
//   html: string;
//   css: string;
//   created_at: string;
//   images?: PostImage[];
// }

// const PostViewer: React.FC = () => {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

//   useEffect(() => {
//     axios
//       .get(endpoints.posts.all) // ✅ Use endpoint config
//       .then((res) => {
//         console.log('Posts fetched:', res.data);
//         if (Array.isArray(res.data)) {
//           setPosts(res.data);
//         } else {
//           console.error('Unexpected response format:', res.data);
//         }
//       })
//       .catch((err) => {
//         console.error('Error fetching posts:', err);
//       });
//   }, []);

//   const togglePost = (id: number) => {
//     setExpandedPostId((prev) => (prev === id ? null : id));
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   return (
//     <div className="max-w-4xl mx-auto mt-10 px-4">
//       <h1 className="text-3xl text-red-700 font-bold mb-6">Events</h1>

//       <div className="grid gap-6">
//         {posts.map((post) => (
//           <div
//             key={post.id}
//             className="border border-gray-300 rounded-lg shadow hover:shadow-lg transition bg-white"
//           >
//             <div
//               className="cursor-pointer px-6 py-4 hover:bg-gray-100"
//               onClick={() => togglePost(post.id)}
//             >
//               <h2 className="text-lg font-semibold text-gray-800">{post.title}</h2>
//               <p className="text-sm text-gray-500">
//                 Created on {formatDate(post.created_at)}
//               </p>
//             </div>

//             {expandedPostId === post.id && (
//               <div className="px-6 py-4 border-t bg-gray-50">
//                 {/* ✅ Inject dynamic CSS */}
//                 <style>{post.css}</style>

//                 {/* ✅ Render post content */}
//                 <div dangerouslySetInnerHTML={{ __html: post.html }} />

//                 {/* ✅ Render images if present */}
//                 {post.images && post.images.length > 0 && (
//                   <div className="mt-4">
//                     <h3 className="font-semibold mb-2">Images</h3>
//                     <div className="flex flex-wrap gap-4">
//                       {post.images.map((img, idx) => (
//                         <img
//                           key={idx}
//                           src={img.image_url}
//                           alt={`Post image ${idx + 1}`}
//                           className="w-40 h-auto border rounded"
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* ✅ Close button */}
//                 <div className="mt-6 text-right">
//                   <button
//                     className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
//                     onClick={() => setExpandedPostId(null)}
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default PostViewer;





// import axios from 'axios';
// import React, { useEffect, useState } from 'react';


// interface PostImage {
//   image_url: string;
// }

// interface Post {
//   id: number;
//   title: string;
//   html: string;
//   css: string;
//   created_at: string;
//   images?: PostImage[];
// }

// const PostViewer: React.FC = () => {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

//   useEffect(() => {
//     axios.get(`${BASE_URL}/api/posts/all`)
//       .then((res) => {
//         console.log("Posts fetched:", res.data); // ✅ Debug log
//         setPosts(res.data);
//       })
//       .catch((err) => {
//         console.error("Error fetching posts:", err);
//       });
//   }, []);

//   const togglePost = (id: number) => {
//     setExpandedPostId(prev => (prev === id ? null : id));
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   return (
//     <div className="max-w-4xl mx-auto mt-10 px-4">
//       <h1 className="text-3xl text-red-700 font-bold mb-6">Events</h1>

//       <div className="grid gap-6">
//         {posts.map((post) => (
//           <div
//             key={post.id}
//             className="border border-gray-300 rounded-lg shadow hover:shadow-lg transition bg-white"
//           >
//             <div
//               className="cursor-pointer px-6 py-4 hover:bg-gray-100"
//               onClick={() => togglePost(post.id)}
//             >
//               <h2 className="text-lg font-semibold text-gray-800">{post.title}</h2>
//               <p className="text-sm text-gray-500">
//                 Created on {formatDate(post.created_at)}
//               </p>
//             </div>

//             {expandedPostId === post.id && (
//               <div className="px-6 py-4 border-t bg-gray-50">
//                 {/* ✅ Inject dynamic CSS */}
//                 <style>{post.css}</style>

//                 {/* ✅ Render post content */}
//                 <div dangerouslySetInnerHTML={{ __html: post.html }} />

//                 {/* ✅ Render images if present */}
//                 {post.images && post.images.length > 0 && (
//                   <div className="mt-4">
//                     <h3 className="font-semibold mb-2">Images</h3>
//                     <div className="flex flex-wrap gap-4">
//                       {post.images.map((img, idx) => (
//                         <img
//                           key={idx}
//                           src={img.image_url}
//                           alt={`Post image ${idx + 1}`}
//                           className="w-40 h-auto border rounded"
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* ✅ Close button */}
//                 <div className="mt-6 text-right">
//                   <button
//                     className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
//                     onClick={() => setExpandedPostId(null)}
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default PostViewer;







