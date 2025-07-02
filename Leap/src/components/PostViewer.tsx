import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface PostImage {
  image_url: string;
}

interface Post {
  html: string;
  css: string;
  images?: PostImage[];
}

const PostViewer: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    axios.get('http://localhost:8000/api/posts/latest').then((res) => {
      setPost(res.data);
    });
  }, []);

  if (!post) return <p>Loading...</p>;

  return (
    <div>
      {/* Inject post-specific CSS */}
      <style>{post.css}</style>

      {/* Render HTML content (includes embedded <img> tags) */}
      <div dangerouslySetInnerHTML={{ __html: post.html }} />

      {/* Optional: Render list of image URLs separately (for debug or preview) */}
      {post.images && post.images.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">Images used in post:</h3>
          <div className="flex flex-wrap gap-4 mt-2">
            {post.images.map((img, idx) => (
              <img
                key={idx}
                src={img.image_url}
                alt={`Post image ${idx + 1}`}
                className="w-40 h-auto border rounded"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostViewer;




// import axios from 'axios';
// import React, { useEffect, useState } from 'react';

// interface Post {
//   html: string;
//   css: string;
// }

// const PostViewer: React.FC = () => {
//   const [post, setPost] = useState<Post | null>(null);

//   useEffect(() => {
//     axios.get('http://localhost:8000/api/posts/latest').then((res) => {
//       setPost(res.data);
//     });
//   }, []);

//   if (!post) return <p>Loading...</p>;

//   return (
//     <div>
//       <style>{post.css}</style>
//       <div dangerouslySetInnerHTML={{ __html: post.html }} />
//     </div>
//   );
// };

// export default PostViewer;
