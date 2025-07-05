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
  
  // ✅ 수정/작성 상태 관리
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [editingPost, setEditingPost] = useState(null); // ✅ 수정 중인 포스트 정보 저장

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
  
  const runImageCleanup = async () => {
    // (기존 코드와 동일)
    if (!window.confirm('정말로 사용하지 않는 이미지 정리를 시작할까요?\n이 작업은 서버의 파일을 영구적으로 삭제합니다.')) {
      return;
    }
    try {
      alert('서버로부터 모든 게시글 데이터를 가져와 분석을 시작합니다. 잠시만 기다려주세요.');
      const { data: posts, error } = await supabase.from('blog').select('content');
      if (error) throw new Error(`Supabase 데이터 조회 오류: ${error.message}`);
      if (!posts || posts.length === 0) {
        alert('분석할 게시글이 없습니다.');
        return;
      }
      const allContentString = posts.map(post => post.content).join('');
      const usedImageUrls = allContentString.match(/https:\/\/jejungserver\.mycafe24\.com\/uploads\/[^'"]+/g) || [];
      const usedImageFileNames = [...new Set(usedImageUrls.map(url => url.split('/').pop()))];
      const phpCleanupUrl = 'https://jejungserver.mycafe24.com/cleanup_api.php';
      const secretKey = "JJTtoJJScleanup";
      const response = await fetch(phpCleanupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': secretKey
        },
        body: JSON.stringify({ usedImages: usedImageFileNames })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'PHP 서버에서 오류가 발생했습니다.');
      }
      alert(`이미지 정리 완료!\n\n- 디스크의 총 이미지: ${result.total_disk_images}\n- 사용 중인 이미지: ${result.used_images_count}\n- 삭제된 이미지: ${result.deleted_count}개`);
    } catch (err) {
      alert(`오류 발생: ${err.message}`);
    }
  };

  const handleImageUpload = async (file) => {
    // (기존 코드와 동일)
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('https://jejungserver.mycafe24.com/upload.php', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        const imageHtml = `\n${result.html}\n`;
        setWriteContent(prevContent => prevContent + imageHtml);
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

  // ✅ 글쓰기 모달을 닫는 전용 함수
  const closeWriteModal = () => {
    setWriteModal(false);
    setEditingPost(null); // 수정 상태 초기화
    setWriteTitle('');
    setWriteContent('');
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
      closeWriteModal(); // 모달 닫기 및 상태 초기화
    }
  };

  // ✅ [신규] 글 수정 함수
  const updatePost = async () => {
    if (!editingPost) return;

    const { data, error } = await supabase
      .from('blog')
      .update({ title: writeTitle, content: writeContent })
      .match({ id: editingPost.id })
      .select();

    if (error) {
      console.error('Error updating post: ', error);
    } else {
      // 로컬 상태 업데이트로 새로고침 없이 변경사항 반영
      setPosts(posts.map(p => p.id === editingPost.id ? data[0] : p));
      closeWriteModal(); // 모달 닫기 및 상태 초기화
    }
  };

  const deletePost = async (postId) => {
    if (confirm("정말로 이 글을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('blog').delete().match({ id: postId });
      if (error) {
        console.error('Error deleting post: ', error);
      } else {
        setPosts(posts.filter(post => post.id !== postId));
        setReadModal(false); // ✅ 삭제 후 읽기 모달 닫기
      }
    }
  };
  
  // ✅ [신규] 수정 버튼 클릭 핸들러
  const handleEdit = (post) => {
    setEditingPost(post);
    setWriteTitle(post.title);
    setWriteContent(post.content);
    setReadModal(false); // 읽기 모달 닫고
    setWriteModal(true);  // 쓰기 모달 열기 (수정 모드로)
  };


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
                    {/* ✅ 삭제 버튼을 ReadModal로 이동시켰으므로 여기서 제거 */}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ✅ WriteModal에 수정 관련 props 전달 */}
      {writeModal && (
        <WriteModal 
          writeTitle={writeTitle}
          setWriteTitle={setWriteTitle}
          writeContent={writeContent}
          setWriteContent={setWriteContent}
          handleImageUpload={handleImageUpload}
          uploading={uploading}
          fileInputRef={fileInputRef}
          addPost={addPost}
          updatePost={updatePost}       // ✅ 수정 함수 전달
          editingPost={editingPost}   // ✅ 수정 중인 포스트 정보 전달
          closeModal={closeWriteModal}  // ✅ 전용 닫기 함수 사용
        />
      )}

      {/* ✅ ReadModal에 수정/삭제 관련 props 전달 */}
      {readModal && (
        <ReadModal 
          posts={posts} 
          currentPostIndex={currentPostIndex} 
          closeModal={() => setReadModal(false)} 
          handleEdit={handleEdit}     // ✅ 수정 핸들러 전달
          deletePost={deletePost}     // ✅ 삭제 함수 전달
        />
      )}
      
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
        /* ✅ modal-footer 스타일 추가 */
        .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid #3e3e3e; /* var(--border-color)와 동일 */
            display: flex;
            justify-content: flex-end; /* 버튼을 오른쪽으로 정렬 */
            gap: 0.75rem;
            flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}


// ✅ WriteModal 컴포넌트 수정: 수정 모드 지원
function WriteModal({ 
  writeTitle, setWriteTitle, 
  writeContent, setWriteContent, 
  handleImageUpload, uploading, 
  fileInputRef, addPost, closeModal,
  updatePost, editingPost // ✅ 추가된 props
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
          const start = e.target.selectionStart;
          const end = e.target.selectionEnd;
          const text = e.target.value;
          let newText = '';
          if (text.substring(start - 1, start) === '\n' || text.length === 0) {
              newText = '<p></p>';
          } else {
              newText = '\n<p></p>';
          }
          const updatedContent = text.substring(0, start) + newText + text.substring(end);
          setWriteContent(updatedContent);
          setTimeout(() => {
            const newCursorPosition = start + newText.indexOf('</p>');
            e.target.selectionStart = newCursorPosition;
            e.target.selectionEnd = newCursorPosition;
          }, 0);
        }
      };
      textAreaElement.addEventListener('keydown', handleKeyDown);
      return () => {
        textAreaElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [setWriteContent]); 
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleImageUpload(file);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="write-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {/* ✅ 수정 모드에 따라 제목 변경 */}
          <h3>{editingPost ? '글 수정' : '새 글 작성'}</h3>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>
        
        <div className="modal-body" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
          <input type="text" placeholder="제목을 입력하세요" value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} className="title-input" />
          <textarea ref={contentTextAreaRef} placeholder="내용을 입력하거나 이미지를 드래그 앤 드롭하세요." value={writeContent} onChange={(e) => setWriteContent(e.target.value)} className={`content-textarea ${isDragging ? 'drag-over' : ''}`} rows="15" />
          <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e.target.files[0])} style={{ display: 'none' }} accept="image/*" />
          
          <div className="modal-actions">
            <button className="image-btn" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              {uploading ? '업로드 중...' : '이미지 첨부'}
            </button>
            
            <div className="action-buttons">
              <button className="cancel-btn" onClick={closeModal}>취소</button>
              {/* ✅ 수정 모드에 따라 버튼 기능 및 텍스트 변경 */}
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


// ✅ ReadModal 컴포넌트 수정: 하단에 버튼 추가
function ReadModal({ posts, currentPostIndex, closeModal, handleEdit, deletePost }) {
  const post = posts[currentPostIndex];
  if (!post) return null;

  const createMarkup = (htmlContent) => {
    return { __html: htmlContent }; // 줄바꿈 처리는 CSS로 관리하는 것이 더 유연합니다.
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
        {/* ✅ 수정/삭제 버튼이 있는 하단 영역 추가 */}
        <div className="modal-footer">
          <button className="edit-btn" onClick={() => handleEdit(post)}>수정</button>
          <button className="delete-btn" style={{backgroundColor: '#f44747', color: 'white'}} onClick={() => deletePost(post.id)}>삭제</button>
        </div>
      </div>
    </div>
  );
}

export default App;