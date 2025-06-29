'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './style.css';

// 메뉴에 표시될 항목 목록을 정의합니다.
const MENU_ITEMS = ['Work', 'Services', 'About', 'Contact'];

function App() {
  // 현재 활성화된(선택된) 섹션의 id를 저장합니다.
  const [activeSection, setActiveSection] = useState('work');
  // 마우스 오버된 섹션의 id를 저장합니다.
  const [hoveredSection, setHoveredSection] = useState(null);
  // 각 섹션 DOM 요소를 참조하기 위한 객체입니다.
  const sectionRefs = useRef({});
  // 스크롤이 적용되는 메인 컨텐츠 영역을 참조합니다.
  const contentsWrapRef = useRef(null);
  // 메뉴 클릭으로 인한 스크롤 중임을 표시하는 ref입니다.
  const isClickScrolling = useRef(false);

  // 실제로 강조(하이라이트)되어야 할 섹션 id를 계산합니다.
  const visualActiveSection = hoveredSection || activeSection;

  // 메뉴 클릭 시 해당 섹션으로 스크롤 이동하는 함수입니다.
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

  // 컴포넌트 마운트 시 헤더 애니메이션 및 스크롤 이벤트를 등록합니다.
  useEffect(() => {
    // 헤더와 메뉴에 로딩 애니메이션을 적용합니다.
    const header = document.querySelector('header');
    let gnb = document.querySelector('.gnb');
    if (header) {
      header.classList.add('loaded');
      setTimeout(() => {
        gnb.style.opacity = '1';
      }, 700);
    }

    // 스크롤 컨테이너를 가져옵니다.
    const scrollContainer = contentsWrapRef.current;
    if (!scrollContainer) return;

    // 스크롤 시 현재 위치에 따라 활성 섹션을 변경합니다.
    const handleScroll = () => {
      // 메뉴 클릭으로 인한 스크롤 중에는 무시합니다.
      if (isClickScrolling.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const topOffset = 50;

      // 스크롤이 맨 아래에 도달하면 마지막 섹션을 활성화합니다.
      if (scrollHeight - scrollTop - clientHeight < 1) {
        const lastSectionId = MENU_ITEMS[MENU_ITEMS.length - 1].toLowerCase();
        if (activeSection !== lastSectionId) {
          setActiveSection(lastSectionId);
        }
        return;
      }

      // 현재 스크롤 위치에 따라 활성화할 섹션을 찾습니다.
      let currentSectionId = 'work';
      for (const sectionId of MENU_ITEMS.map(s => s.toLowerCase())) {
        const sectionEl = sectionRefs.current[sectionId];
        if (sectionEl && scrollTop >= sectionEl.offsetTop - topOffset) {
          currentSectionId = sectionId;
        }
      }

      // 활성 섹션이 변경될 때만 상태를 업데이트합니다.
      if (activeSection !== currentSectionId) {
        setActiveSection(currentSectionId);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  return (
    <div className="app-container">
      {/* 상단 고정 헤더 영역 */}
      <header className="fixed-header">
        <div className="gnb">
          {/* 로고 클릭 시 work 섹션으로 이동 */}
          <a href="#work" onClick={(e) => handleMenuClick(e, 'work')} className="logo">LOGO</a>
          {/* 메뉴 리스트 */}
          <ul className="nav-links" onMouseLeave={() => setHoveredSection(null)}>
            {/* 메뉴 하이라이터(밑줄 등 강조 효과) */}
            <Highlighter visualActiveSection={visualActiveSection} />
            {/* 각 메뉴 항목을 렌더링 */}
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
      {/* 메인 컨텐츠 영역(스크롤 대상) */}
      <main className="contents-wrap" ref={contentsWrapRef}>
        {/* 각 섹션을 렌더링 */}
        {MENU_ITEMS.map(item => {
          const sectionId = item.toLowerCase();
          return (
            <section
              key={sectionId}
              id={sectionId}
              ref={el => sectionRefs.current[sectionId] = el}
            >
              <h1>{item}</h1>
            </section>
          );
        })}
      </main>
    </div>
  );
}

// 메뉴 하이라이터 컴포넌트
const Highlighter = ({ visualActiveSection }) => {
  // 하이라이터 DOM을 참조합니다.
  const highlighterRef = useRef(null);
  // 네비게이션 리스트 DOM을 참조합니다.
  const navRef = useRef(null);

  // 활성 메뉴 위치에 맞게 하이라이터 위치와 크기를 조정합니다.
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