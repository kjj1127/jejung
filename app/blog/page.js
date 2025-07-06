'use client';

import './blog.css';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// App 컴포넌트는 메인 페이지 로직을 담당합니다.
function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readModal, setReadModal] = useState(false);
  const [writeModal, setWriteModal] = useState(false);
  
  const [writeTitle, setWriteTitle] = useState('');
  const [writeCategory, setWriteCategory] = useState('공부'); // ✅ 기본 카테고리 설정
  const [writeContent, setWriteContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);

  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ [신규] 선택된 카테고리를 관리하는 상태
  const [selectedCategory, setSelectedCategory] = useState('전체');

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
  
  const runImageCleanup = async () => {
    // (기존 코드와 동일)
    if (!window.confirm('정말로 사용하지 않는 이미지 정리를 시작할까요?\n이 작업은 서버의 파일을 영구적으로 삭제합니다.')) return;
    try {
      alert('서버로부터 모든 게시글 데이터를 가져와 분석을 시작합니다. 잠시만 기다려주세요.');
      const { data: posts, error } = await supabase.from('blog').select('content');
      if (error) throw new Error(`Supabase 데이터 조회 오류: ${error.message}`);
      if (!posts || posts.length === 0) { alert('분석할 게시글이 없습니다.'); return; }
      const allContentString = posts.map(post => post.content).join('');
      const usedImageUrls = allContentString.match(/https:\/\/jejungserver\.mycafe24\.com\/uploads\/[^'"]+/g) || [];
      const usedImageFileNames = [...new Set(usedImageUrls.map(url => url.split('/').pop()))];
      const phpCleanupUrl = 'https://jejungserver.mycafe24.com/cleanup_api.php';
      const secretKey = "JJTtoJJScleanup";
      const response = await fetch(phpCleanupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': secretKey },
        body: JSON.stringify({ usedImages: usedImageFileNames })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'PHP 서버에서 오류가 발생했습니다.');
      alert(`이미지 정리 완료!\n\n- 디스크의 총 이미지: ${result.total_disk_images}\n- 사용 중인 이미지: ${result.used_images_count}\n- 삭제된 이미지: ${result.deleted_count}개`);
    } catch (err) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleImageUpload = async (file) => {
    // (기존 코드와 동일)
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('이미지 파일만 업로드할 수 있습니다.'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('https://jejungserver.mycafe24.com/upload.php', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.success) {
        setWriteContent(prevContent => prevContent + `\n${result.html}\n`);
      } else {
        alert(`이미지 업로드 실패: ${result.error}`);
      }
    } catch (error) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const closeWriteModal = () => {
    setWriteModal(false);
    setEditingPost(null);
    setWriteTitle('');
    setWriteCategory('공부'); // ✅ 모달 닫을 때 기본값으로
    setWriteContent('');
  };
  
  const addPost = async () => {
    if (writeTitle.trim() === '') { alert('제목을 입력하세요.'); return; }
    const { data, error } = await supabase
      .from('blog')
      .insert([{ title: writeTitle, category: writeCategory, content: writeContent }])
      .select();

    if (error) { console.error('Error adding post: ', error); } 
    else { setPosts([data[0], ...posts]); closeWriteModal(); }
  };

  const updatePost = async () => {
    if (!editingPost) return;
    const { data, error } = await supabase
      .from('blog')
      .update({ title: writeTitle, category: writeCategory, content: writeContent })
      .match({ id: editingPost.id })
      .select();

    if (error) { console.error('Error updating post: ', error); } 
    else { setPosts(posts.map(p => p.id === editingPost.id ? data[0] : p)); closeWriteModal(); }
  };

  const deletePost = async (postId) => {
    if (confirm("정말로 이 글을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('blog').delete().match({ id: postId });
      if (error) { console.error('Error deleting post: ', error); } 
      else { setPosts(posts.filter(post => post.id !== postId)); setReadModal(false); }
    }
  };
  
  const handleEdit = (post) => {
    setEditingPost(post);
    setWriteTitle(post.title);
    setWriteCategory(post.category);
    setWriteContent(post.content);
    setReadModal(false);
    setWriteModal(true);
  };

  // ✅ [신규] 렌더링할 포스트를 필터링하는 로직
  const filteredPosts = posts.filter(post => 
    selectedCategory === '전체' ? true : post.category === selectedCategory
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1>JeJungTop</h1>
          <p>custom blog</p>
        </div>
        <div className="header-actions">
          <button className="cleanup-btn" onClick={runImageCleanup}>
            이미지 정리
          </button>
          <button className="write-btn" onClick={() => setWriteModal(true)}>
            + 새 글 작성
          </button>
        </div>
        {/* ✅ 카테고리 필터링 UI 수정 */}
        <ul className="category-nav">
          <li className={selectedCategory === '전체' ? 'active' : ''} onClick={() => setSelectedCategory('전체')}>전체</li>
          <li className={selectedCategory === '공부' ? 'active' : ''} onClick={() => setSelectedCategory('공부')}>공부</li>
          <li className={selectedCategory === '일상' ? 'active' : ''} onClick={() => setSelectedCategory('일상')}>일상</li>
        </ul>
      </header>

      {/* ✅ filteredPosts를 사용하여 렌더링 */}
      <main className="main-content">
        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <p>아직 작성된 글이 없습니다.</p>
            {selectedCategory !== '전체' && <p>'{selectedCategory}' 카테고리에는 글이 없네요!</p>}
            <button onClick={() => setWriteModal(true)}>첫 번째 글 작성하기</button>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post, i) => (
              <article className="post-card" key={post.id}>
                <div className="post-content">
                  <span className="post-category-badge">{post.category}</span>
                  {/* ✅ filteredPosts의 인덱스가 아닌 원본 posts의 인덱스를 찾아야 함 */}
                  <h2 onClick={() => { 
                      const originalIndex = posts.findIndex(p => p.id === post.id);
                      setCurrentPostIndex(originalIndex);
                      setReadModal(true); 
                    }}>
                    {post.title}
                  </h2>
                  <p className="post-preview">
                    {post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                  </p>
                  <div className="post-meta">
                    <time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
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
          writeCategory={writeCategory}
          setWriteCategory={setWriteCategory}
          writeContent={writeContent}
          setWriteContent={setWriteContent}
          handleImageUpload={handleImageUpload}
          uploading={uploading}
          fileInputRef={fileInputRef}
          addPost={addPost}
          updatePost={updatePost}
          editingPost={editingPost}
          closeModal={closeWriteModal}
        />
      )}

      {readModal && (
        <ReadModal 
          posts={posts} 
          currentPostIndex={currentPostIndex} 
          closeModal={() => setReadModal(false)} 
          handleEdit={handleEdit}
          deletePost={deletePost}
        />
      )}
      
      {/* ✅ 카테고리 필터 UI 스타일 추가 */}
      <style jsx>{`
        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .cleanup-btn {
          background-color: #555;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        .cleanup-btn:hover {
          background-color: #777;
        }
        .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid #3e3e3e;
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            flex-shrink: 0;
        }
        /* ✅ 카테고리 네비게이션 스타일 */
        .category-nav {
          list-style: none;
          display: flex;
          gap: 20px;
          padding: 0;
          width: 100%; /* 헤더 전체 너비 사용 */
          margin-top: 1rem;
          border-top: 1px solid #3e3e3e;
        }
        .category-nav li {
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 5px;
          transition: all 0.2s ease;
          color: #888;
        }
        .category-nav li:hover {
          color: #ddd;
          background-color: #333;
        }
        .category-nav li.active {
          color: #0e639c; /* Accent color */
          font-weight: bold;
          background-color: rgba(14, 99, 156, 0.1);
        }
        /* ✅ 포스트 카드에 붙는 카테고리 뱃지 스타일 */
        .post-category-badge {
          display: inline-block;
          background-color: #3e3e3e;
          color: #ccc;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          align-self: flex-start; /* 왼쪽 정렬 */
        }
      `}</style>
    </div>
  );
}


function WriteModal({ 
  writeTitle, setWriteTitle, 
  writeCategory, setWriteCategory,
  writeContent, setWriteContent, 
  handleImageUpload, uploading, 
  fileInputRef, addPost, closeModal,
  updatePost, editingPost
}) {
  const [isDragging, setIsDragging] = useState(false);
  const contentTextAreaRef = useRef(null);
  
  // (useEffect 및 드래그앤드롭 핸들러는 기존과 동일)
  useEffect(() => {
    const textAreaElement = contentTextAreaRef.current;
    if (textAreaElement) {
      const handleKeyDown = (e) => {
        if (e.shiftKey && e.key === 'Enter') {
          e.preventDefault();
          const start = e.target.selectionStart; const end = e.target.selectionEnd; const text = e.target.value;
          let newText = (text.substring(start - 1, start) === '\n' || text.length === 0) ? '<p></p>' : '\n<p></p>';
          const updatedContent = text.substring(0, start) + newText + text.substring(end);
          setWriteContent(updatedContent);
          setTimeout(() => { const newCursorPosition = start + newText.indexOf('</p>'); e.target.selectionStart = newCursorPosition; e.target.selectionEnd = newCursorPosition; }, 0);
        }
      };
      textAreaElement.addEventListener('keydown', handleKeyDown);
      return () => { textAreaElement.removeEventListener('keydown', handleKeyDown); };
    }
  }, [setWriteContent]); 
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]; handleImageUpload(file); e.dataTransfer.clearData();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="write-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingPost ? '글 수정' : '새 글 작성'}</h3>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>
        
        <div className="modal-body" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
          {/* ✅ className 수정 */}
          <select className="category-select" value={writeCategory} onChange={(e) => setWriteCategory(e.target.value)}>
            <option value="공부">공부</option>
            <option value="일상">일상</option>
          </select>
          <input type="text" placeholder="제목을 입력하세요" value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} className="title-input" />
          <textarea ref={contentTextAreaRef} placeholder="내용을 입력하거나 이미지를 드래그 앤 드롭하세요." value={writeContent} onChange={(e) => setWriteContent(e.target.value)} className={`content-textarea ${isDragging ? 'drag-over' : ''}`} rows="15" />
          <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e.target.files[0])} style={{ display: 'none' }} accept="image/*" />
          
          <div className="modal-actions">
            <button className="image-btn" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              {uploading ? '업로드 중...' : '이미지 첨부'}
            </button>
            
            <div className="action-buttons">
              <button className="cancel-btn" onClick={closeModal}>취소</button>
              <button className="publish-btn" onClick={editingPost ? updatePost : addPost}>
                {editingPost ? '수정' : '작성'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function ReadModal({ posts, currentPostIndex, closeModal, handleEdit, deletePost }) {
  const post = posts[currentPostIndex];
  if (!post) return null;

  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="read-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            {/* ✅ 카테고리 뱃지 추가 */}
            <span className="post-category-badge">{post.category}</span>
            <h3>{post.title}</h3>
            <time>{new Date(post.created_at).toLocaleString('ko-KR')}</time>
          </div>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>
        <div className="modal-body">
          <div className="content" dangerouslySetInnerHTML={createMarkup(post.content)} />
        </div>
        <div className="modal-footer">
          {/* ✅ cancel-btn을 edit-btn으로 클래스명 변경 */}
          <button className="edit-btn" onClick={() => handleEdit(post)}>수정</button>
          <button className="delete-btn" style={{backgroundColor: '#f44747', color: 'white'}} onClick={() => deletePost(post.id)}>삭제</button>
        </div>
      </div>
    </div>
  );
}

export default App;