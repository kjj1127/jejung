'use client';

import { useState } from "react"
import { Menu, X, User, Briefcase, Mail, Github, ExternalLink } from "lucide-react"
import "./styles.css"

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("about")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sections = [
    { id: "about", label: "소개", icon: User },
    { id: "projects", label: "프로젝트", icon: Briefcase },
    { id: "contact", label: "연락처", icon: Mail },
  ]

  const projects = [
    {
      title: "E-commerce 플랫폼",
      description: "Next.js와 Stripe 결제 시스템을 통합하여 구축한 풀스택 전자상거래 솔루션입니다.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe"],
      link: "#",
    },
    {
      title: "회사 업무 툴",
      description: "회사 내부에서 사용하는 업무 툴로, 프로젝트 관리와 팀 협업을 지원합니다.",
      tech: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
      link: "#",
    },
    {
      title: "날씨 대시보드",
      description: "위치 기반의 날씨 예보를 제공하는 반응형 날씨 대시보드입니다.",
      tech: ["React", "OpenWeather API", "Chart.js"],
      link: "#",
    },
  ]

  return (
    <div className="portfolio-container">
      <div className="portfolio-wrapper">
        <div className="portfolio-window">
          <nav className="portfolio-nav">
            <div className="nav-content">
              <h1 className="portfolio-title">Portfolio</h1>
              <div className="nav-desktop">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id)
                      }}
                      className={`nav-button ${activeSection === section.id ? "nav-button-active" : ""}`}
                    >
                      <Icon className="nav-icon" />
                      <span>{section.label}</span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
              </button>
            </div>
            {isMobileMenuOpen && (
              <div className="nav-mobile">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`nav-mobile-button ${activeSection === section.id ? "nav-mobile-button-active" : ""}`}
                    >
                      <Icon className="nav-icon" />
                      <span>{section.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </nav>
          <div className="content-area">
            <div className="content-padding">
              {activeSection === "about" && (
                <div className="section fade-in">
                  <div className="about-header">
                    <div className="profile-avatar">JJ</div>
                    <h2 className="profile-name">김제중</h2>
                    <p className="profile-title">풀스택 개발자</p>
                  </div>
                  <div className="about-content">
                    <div className="about-description">
                      <h3 className="section-title">소개</h3>
                      <p className="description-text">
                        2년 이상의 경력을 가진 열정적인 풀스택 개발자입니다. 다양한 편의성을 제공하는 웹 페이지를
                        만드는 것을 좋아하며, 사용자들이 만족해하는 경험을 주는 것에 만족감을 느낍니다.
                      </p>
                    </div>
                    <div className="skills-grid">
                      <div className="skill-card">
                        <h4 className="skill-title">프론트엔드</h4>
                        <div className="skill-tags">
                          {["HTML", "React", "Jquery", "CSS"].map((skill) => (
                            <span key={skill} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="skill-card">
                        <h4 className="skill-title">백엔드</h4>
                        <div className="skill-tags">
                          {["PHP", "MySQL"].map((skill) => (
                            <span key={skill} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeSection === "projects" && (
                <div className="section fade-in">
                  <div className="section-header">
                    <h2 className="section-main-title">내 프로젝트</h2>
                    <p className="section-description">
                      제가 최근에 작업한 몇 가지 프로젝트입니다. 각각의 프로젝트는 저에게 독특한 도전이자
                      배움의 경험이었습니다.
                    </p>
                  </div>
                  <div className="projects-grid">
                    {projects.map((project, index) => (
                      <div key={index} className="project-card">
                        <h3 className="project-title">{project.title}</h3>
                        <p className="project-description">{project.description}</p>
                        <div className="project-tech">
                          {project.tech.map((tech) => (
                            <span key={tech} className="tech-tag">
                              {tech}
                            </span>
                          ))}
                        </div>
                        <a href={project.link} className="project-link">
                          <span>프로젝트 보기</span>
                          <ExternalLink className="link-icon" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeSection === "contact" && (
                <div className="section fade-in">
                  <div className="section-header">
                    <h2 className="section-main-title">연락하기</h2>
                    <p className="section-description">
                      저는 새로운 기회와 흥미로운 프로젝트에 대해 항상 열려 있습니다. 함께 소통해요!
                    </p>
                  </div>
                  <div className="contact-content">
                    <div className="contact-links">
                      <a href="mailto:jejung@kakao.com" className="contact-card">
                        <Mail className="contact-icon" />
                        <div>
                          <h3 className="contact-title">이메일</h3>
                          <p className="contact-info">jejung@kakao.com</p>
                        </div>
                      </a>
                      <a href="https://github.com/kjj1127" className="contact-card">
                        <Github className="contact-icon" />
                        <div>
                          <h3 className="contact-title">GitHub</h3>
                          <p className="contact-info">@kjj1127</p>
                        </div>
                      </a>
                    </div>
                    <div className="contact-form-container">
                      <form className="contact-form">
                        <div className="form-group">
                          <label className="form-label">이름</label>
                          <input type="text" className="form-input" placeholder="당신의 이름을 입력하세요" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">이메일</label>
                          <input type="email" className="form-input" placeholder="당신의 이메일을 입력하세요" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">메시지</label>
                          <textarea rows={4} className="form-textarea" placeholder="당신의 메시지를 여기에 작성하세요..."></textarea>
                        </div>
                        <button type="submit" className="form-submit">
                          메시지 보내기
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}