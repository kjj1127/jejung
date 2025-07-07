'use client';

import { supabase } from '@/lib/supabaseClient';
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './style.css';

// 메뉴에 표시될 항목 목록을 정의합니다.
const MENU_ITEMS = ['Work', 'Services', 'Blog', 'Contact'];

// 1️⃣ App 컴포넌트: 모든 로직과 상태를 관리합니다.
function App() {
  // --- 상태(State) 변수 선언부 ---

  // 섹션 스크롤 및 메뉴 관련 상태
  const [activeSection, setActiveSection] = useState('work');
  const [hoveredSection, setHoveredSection] = useState(null);

  // 블로그 게시물 및 모달 관련 상태
  const [posts, setPosts] = useState([]);
  const [readModal, setReadModal] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('공부');

  // DOM 요소를 직접 참조하기 위한 Ref
  const sectionRefs = useRef({});
  const contentsWrapRef = useRef(null);
  const isClickScrolling = useRef(false);

  // 마우스 오버 또는 활성 상태에 따라 시각적으로 강조될 섹션
  const visualActiveSection = hoveredSection || activeSection;


  // --- 함수 선언부 ---

  // 메뉴 클릭 시 부드럽게 스크롤하는 함수
  const handleMenuClick = (event, sectionId) => {
    event.preventDefault();
    const scrollContainer = contentsWrapRef.current;
    const section = sectionRefs.current[sectionId];
    if (scrollContainer && section) {
      isClickScrolling.current = true;
      setActiveSection(sectionId);
      scrollContainer.scrollTo({
        top: section.offsetTop,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isClickScrolling.current = false;
      }, 1000);
    }
  };

  // Supabase에서 게시물을 가져오는 함수
  const fetchPosts = async () => {
    const { data, error } = await supabase.from('blog').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching posts: ', error); }
    else { setPosts(data); }
  };

  // --- useEffect (Life Cycle) 선언부 ---

  // 컴포넌트가 처음 렌더링될 때 데이터 로딩 및 세션 확인
  useEffect(() => {
    fetchPosts();
  }, []);

  // 스크롤 이벤트 및 헤더 애니메이션 처리
  useEffect(() => {
    const header = document.querySelector('header');
    const gnb = document.querySelector('.gnb');
    if (header) {
      header.classList.add('loaded');
      setTimeout(() => {
        if(gnb) gnb.style.opacity = '1';
      }, 700);
    }

    const scrollContainer = contentsWrapRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isClickScrolling.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const topOffset = 50;

      if (scrollHeight - scrollTop - clientHeight < 1) {
        const lastSectionId = MENU_ITEMS[MENU_ITEMS.length - 1].toLowerCase();
        if (activeSection !== lastSectionId) {
          setActiveSection(lastSectionId);
        }
        return;
      }
      let currentSectionId = 'work';
      for (const sectionId of MENU_ITEMS.map(s => s.toLowerCase())) {
        const sectionEl = sectionRefs.current[sectionId];
        if (sectionEl && scrollTop >= sectionEl.offsetTop - topOffset) {
          currentSectionId = sectionId;
        }
      }
      if (activeSection !== currentSectionId) {
        setActiveSection(currentSectionId);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [activeSection]);


  // --- 렌더링 (Return) 부 ---

  return (
    <div className="app-container">
      <header className="fixed-header">
        <div className="gnb">
          <a href="#work" onClick={(e) => handleMenuClick(e, 'work')} className="logo">LOGO</a>
          <ul className="nav-links" onMouseLeave={() => setHoveredSection(null)}>
            <Highlighter visualActiveSection={visualActiveSection} />
            {MENU_ITEMS.map(item => {
              const sectionId = item.toLowerCase();
              return (
                <li
                  key={sectionId}
                  data-section={sectionId}
                  className={visualActiveSection === sectionId ? 'active' : ''}
                  onMouseOver={() => setHoveredSection(sectionId)}
                >
                  <a href={`#${sectionId}`} onClick={(e) => handleMenuClick(e, sectionId)}>
                    {item}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </header>
      
      <main className="contents-wrap" ref={contentsWrapRef}>
        {MENU_ITEMS.map(item => {
          const sectionId = item.toLowerCase();
          if (sectionId === 'blog') {
            const filteredPosts = posts.filter(post => selectedCategory === '공부');
            return (
              <section key={sectionId} id={sectionId} ref={el => sectionRefs.current[sectionId] = el}>
                <h1>Blog Posts</h1>
                <div className="posts-grid">
                  {filteredPosts.map((post, index) => (
                    <article className="post-card" key={post.id}>
                      <div className="post-content">
                        <span className="post-category-badge">{post.category}</span>
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
              </section>
            );
          } 
          // 나머지 섹션들은 동일한 구조로 렌더링
          else {
            return (
              <section key={sectionId} id={sectionId} ref={el => sectionRefs.current[sectionId] = el}>
                <h1>{item}</h1>
                <div className="content-grid">
                  <div className="grid-item"></div>
                </div>
              </section>
            );
          }
        })}
      </main>
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

// 2️⃣ ReadModal 컴포넌트: 게시물 내용을 보여줍니다.
function ReadModal({ posts, currentPostIndex, closeModal }) {
  const post = posts[currentPostIndex];
  if (!post) return null; // 게시물이 없으면 아무것도 렌더링하지 않음

  const createMarkup = (htmlContent) => ({ __html: htmlContent });

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="read-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="post-category-badge">{post.category}</span>
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

const Highlighter = ({ visualActiveSection }) => {
  const highlighterRef = useRef(null);
  const navRef = useRef(null);

  useLayoutEffect(() => {
    if (highlighterRef.current) {
      navRef.current = highlighterRef.current.closest('.nav-links');
    }
    const navNode = navRef.current;
    if (!navNode) return;
    const activeMenu = navNode.querySelector(`li[data-section="${visualActiveSection}"]`);
    if (activeMenu) {
      highlighterRef.current.style.width = `${activeMenu.offsetWidth}px`;
      highlighterRef.current.style.transform = `translateX(${activeMenu.offsetLeft}px)`;
    }
  }, [visualActiveSection]);

  return <div className="highlighter" ref={highlighterRef}></div>;
};

export default App;