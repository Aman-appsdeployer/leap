// src/components/PostViewer.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Post {
  html: string;
  css: string;
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
      <style>{post.css}</style>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </div>
  );
};

export default PostViewer;
