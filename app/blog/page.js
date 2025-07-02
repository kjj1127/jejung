'use client';

import './blog.css';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readModal, setReadModal] = useState(false);
  const [writeModal, setWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts: ', error);
    } else {
      setPosts(data);
    }
    setLoading(false);
  };

  // ✅ 파일 객체를 직접 받도록 수정
  const handleImageUpload = async (file) => {
    if (!file) return;

    // ✅ 이미지 파일인지 간단히 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://jejungserver.mycafe24.com/upload.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        const imageHtml = `\n${result.html}\n`;
        setWriteContent(prevContent => prevContent + imageHtml);
        alert('이미지가 성공적으로 첨부되었습니다.');
      } else {
        alert(`이미지 업로드 실패: ${result.error}`);
      }
    } catch (error) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  const addPost = async () => {
    if (writeTitle.trim() === '') {
      alert('제목을 입력하세요.');
      return;
    }
    const { data, error } = await supabase
      .from('blog')
      .insert([{ title: writeTitle, content: writeContent }])
      .select();

    if (error) {
      console.error('Error adding post: ', error);
    } else {
      setPosts([data[0], ...posts]);
      setWriteTitle('');
      setWriteContent('');
      setWriteModal(false);
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm("정말로 이 글을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('blog').delete().match({ id: postId });
      if (error) {
        console.error('Error deleting post: ', error);
      } else {
        setPosts(posts.filter(post => post.id !== postId));
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1>JeJungTop</h1>
          <p>custom blog</p>
        </div>
        <button className="write-btn" onClick={() => setWriteModal(true)}>
          + 새 글 작성
        </button>
      </header>

      <main className="main-content">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>아직 작성된 글이 없습니다.</p>
            <button onClick={() => setWriteModal(true)}>첫 번째 글 작성하기</button>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post, i) => (
              <article className="post-card" key={post.id}>
                <div className="post-content">
                  <h2 onClick={() => { setReadModal(true); setCurrentPostIndex(i); }}>
                    {post.title}
                  </h2>
                  <p className="post-preview">
                    {post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                  </p>
                  <div className="post-meta">
                    <time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
                    <button className="delete-btn" onClick={() => deletePost(post.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {writeModal && (
        <WriteModal 
          writeTitle={writeTitle}
          setWriteTitle={setWriteTitle}
          writeContent={writeContent}
          setWriteContent={setWriteContent}
          handleImageUpload={handleImageUpload} // ✅ 수정된 함수 전달
          uploading={uploading}
          fileInputRef={fileInputRef}
          addPost={addPost}
          closeModal={() => setWriteModal(false)}
        />
      )}

      {readModal && (
        <ReadModal 
          posts={posts} 
          currentPostIndex={currentPostIndex} 
          closeModal={() => setReadModal(false)} 
        />
      )}
    </div>
  );
}

// ✅ 드래그 앤 드롭 기능이 추가된 WriteModal
function WriteModal({ 
  writeTitle, setWriteTitle, 
  writeContent, setWriteContent, 
  handleImageUpload, uploading, 
  fileInputRef, addPost, closeModal 
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 드래그 중이라는 것을 계속 알려주기 위해 isDragging을 true로 유지
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleImageUpload(file); // ✅ 파일 객체를 직접 전달
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="write-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>새 글 작성</h3>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>
        
        <div 
          className="modal-body"
          // ✅ 드래그 이벤트 핸들러 추가
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="text" 
            placeholder="제목을 입력하세요"
            value={writeTitle}
            onChange={(e) => setWriteTitle(e.target.value)}
            className="title-input"
          />
          
          <textarea 
            placeholder="내용을 입력하거나 이미지를 드래그 앤 드롭하세요."
            value={writeContent}
            onChange={(e) => setWriteContent(e.target.value)}
            // ✅ isDragging 상태에 따라 클래스 동적 적용
            className={`content-textarea ${isDragging ? 'drag-over' : ''}`}
            rows="15"
          />
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleImageUpload(e.target.files[0])} // ✅ 파일 객체 전달
            style={{ display: 'none' }} 
            accept="image/*" 
          />
          
          <div className="modal-actions">
            <button 
              className="image-btn"
              onClick={() => fileInputRef.current.click()} 
              disabled={uploading}
            >
              {uploading ? '업로드 중...' : '📷 이미지 첨부'}
            </button>
            
            <div className="action-buttons">
              <button className="cancel-btn" onClick={closeModal}>취소</button>
              <button className="publish-btn" onClick={addPost}>작성</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadModal({ posts, currentPostIndex, closeModal }) {
  const post = posts[currentPostIndex];
  if (!post) return null;

  const createMarkup = (htmlContent) => {
    return { __html: htmlContent.replace(/\n/g, '<br />') };
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="read-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{post.title}</h3>
            <time>{new Date(post.created_at).toLocaleString('ko-KR')}</time>
          </div>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body">
          <div className="content" dangerouslySetInnerHTML={createMarkup(post.content)} />
        </div>
      </div>
    </div>
  );
}

export default App;