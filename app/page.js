'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './style.css';

const MENU_ITEMS = ['Work', 'Services', 'About', 'Contact'];

function App() {
  const [activeSection, setActiveSection] = useState('work');
  const [hoveredSection, setHoveredSection] = useState(null);
  const sectionRefs = useRef({});
  const contentsWrapRef = useRef(null);
  const isClickScrolling = useRef(false);

  const visualActiveSection = hoveredSection || activeSection;

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
  
  useEffect(() => {

    const header = document.querySelector('header');
    let gnb = document.querySelector('.gnb');
    if (header) {
      header.classList.add('loaded');
      setTimeout(() => {
        gnb.style.opacity = '1';
      }, 700);
    }

    const scrollContainer = contentsWrapRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isClickScrolling.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const topOffset = 50;
      
      // ★★★★★ 수정된 부분 시작 ★★★★★
      // 스크롤이 맨 아래에 도달했는지 확인합니다.
      // (소수점 오차를 고려하여 1px 정도의 여유를 둡니다)
      if (scrollHeight - scrollTop - clientHeight < 1) {
        // 맨 아래라면, 마지막 메뉴 아이템을 활성화합니다.
        const lastSectionId = MENU_ITEMS[MENU_ITEMS.length - 1].toLowerCase();
        if (activeSection !== lastSectionId) {
          setActiveSection(lastSectionId);
        }
        // 맨 아래인 것이 확인되었으므로, 아래의 다른 계산은 하지 않고 함수를 종료합니다.
        return; 
      }
      // ★★★★★ 수정된 부분 끝 ★★★★★

      let currentSectionId = 'work';
      for (const sectionId of MENU_ITEMS.map(s => s.toLowerCase())) {
        const sectionEl = sectionRefs.current[sectionId];
        if (sectionEl && scrollTop >= sectionEl.offsetTop - topOffset) {
          currentSectionId = sectionId;
        }
      }

      // 현재 활성 섹션과 계산된 섹션이 다를 경우에만 상태를 업데이트하여 불필요한 렌더링을 방지합니다.
      if (activeSection !== currentSectionId) {
        setActiveSection(currentSectionId);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [activeSection]); // activeSection을 의존성 배열에 추가하여 상태 동기화를 더 확실하게 합니다.

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
                <li key={sectionId}
                    data-section={sectionId}
                    className={visualActiveSection === sectionId ? 'active' : ''}
                    onMouseOver={() => setHoveredSection(sectionId)}>
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