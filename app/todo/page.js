"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"

// --- 1. 인증 컨텍스트 설정 ---
const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    getInitialSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    signOut: async () => {
      await supabase.auth.signOut()
      setSession(null)
    },
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

// --- 2. 로그인 모달 컴포넌트 ---
function LoginModal({ closeModal }) {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-close-btn" onClick={closeModal}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: "이메일",
                password_label: "비밀번호",
                button_label: "로그인",
                social_provider_text: "{{provider}} 계정으로 로그인",
              },
              sign_up: {
                email_label: "이메일",
                password_label: "비밀번호",
                button_label: "회원가입",
                social_provider_text: "{{provider}} 계정으로 가입",
              },
            },
          }}
        />
      </div>
    </div>
  )
}

// --- 3. 재사용 할 일 관리 모달 컴포넌트 ---
function ReusableTodosModal({ closeModal, reusableTodos, addReusableTodoToCurrentDate, deleteTodo, selectDate }) {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="reusable-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>재사용 할 일 관리</h3>
          <button className="modal-close-btn" onClick={closeModal}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {reusableTodos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>저장된 재사용 할 일이 없습니다.</p>
            </div>
          ) : (
            <div className="modal-todo-list">
              {reusableTodos.map((todo) => (
                <div key={todo.id} className="modal-todo-item">
                  <div className="modal-todo-content">
                    <span className="modal-todo-work">{todo.work}</span>
                  </div>
                  <div className="modal-actions">
                    <button onClick={() => addReusableTodoToCurrentDate(todo)} className="btn btn-primary btn-sm">
                      {selectDate}에 추가
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} className="btn btn-danger btn-sm">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 4. 메인 투두 애플리케이션 컴포넌트 ---
function App() {
  const { session, signOut } = useAuth()
  const [todos, setTodos] = useState([])
  const [reusableTodos, setReusableTodos] = useState([])
  const [newWork, setNewWork] = useState("")
  const [currentUser, setCurrentUser] = useState("")
  const [newReuse, setNewReuse] = useState(0)
  const [newDaily, setNewDaily] = useState(0)
  const [selectDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReusableModal, setShowReusableModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      setCurrentUser(session.user.id)
    } else {
      setCurrentUser("")
    }
  }, [session])

  useEffect(() => {
    if (currentUser) {
      getTodos()
      getReusableTodos()
    } else {
      setTodos([])
      setReusableTodos([])
      setLoading(false)
    }
  }, [currentUser, selectDate])

  async function getTodos() {
    try {
      setLoading(true)
      setError(null)
      const query = supabase
        .from("todo")
        .select("*")
        .eq("user", currentUser)
        .eq("reuse", 0)
        .or(`task_date.eq.${selectDate},daily.eq.1`)
        .order("task_date", { ascending: true })
        .order("created_at", { ascending: true })

      const { data, error } = await query
      if (error) {
        throw error
      }
      setTodos(data)
    } catch (error) {
      setError(error.message)
      console.error("할 일 가져오기 에러:", error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getReusableTodos() {
    try {
      const { data, error } = await supabase
        .from("todo")
        .select("*")
        .eq("user", currentUser)
        .eq("reuse", 1)
        .order("created_at", { ascending: true })
      if (error) {
        throw error
      }
      setReusableTodos(data)
    } catch (error) {
      console.error("재사용 할 일 가져오기 에러:", error.message)
    }
  }

  async function addTodo() {
    if (!newWork.trim()) {
      alert("할 일 내용을 입력해주세요.")
      return
    }
    if (!currentUser) {
      alert("로그인 후 할 일을 추가할 수 있습니다.")
      return
    }

    const commonTodoData = {
      user: currentUser,
      work: newWork,
      completed: 0,
    }

    const todosToInsert = []

    todosToInsert.push({
      ...commonTodoData,
      reuse: 0,
      daily: newDaily,
      task_date: selectDate,
    })

    if (newReuse === 1) {
      todosToInsert.push({
        ...commonTodoData,
        reuse: 1,
        daily: 0,
        task_date: null,
      })
    }

    try {
      const { data, error } = await supabase.from("todo").insert(todosToInsert).select()

      if (error) throw error
      setNewWork("")
      setNewReuse(0)
      setNewDaily(0)
      getTodos()
      getReusableTodos()
      alert("할 일이 성공적으로 추가/저장되었습니다!")
    } catch (error) {
      setError(error.message)
      console.error("할 일 추가/저장 에러:", error.message)
    }
  }

  async function addReusableTodoToCurrentDate(reusableTodo) {
    if (!currentUser) {
      alert("로그인 후 할 일을 추가할 수 있습니다.")
      return
    }

    try {
      const { data, error } = await supabase
        .from("todo")
        .insert([
          {
            user: currentUser,
            work: reusableTodo.work,
            reuse: 0,
            daily: 0,
            completed: 0,
            task_date: selectDate,
          },
        ])
        .select()

      if (error) throw error
      alert(`'${reusableTodo.work}'이(가) ${selectDate} 할 일에 추가되었습니다!`)
      getTodos()
      setShowReusableModal(false)
    } catch (error) {
      setError(error.message)
      console.error("재사용 할 일 추가 에러:", error.message)
    }
  }

  async function toggleComplete(id, currentStatus) {
    try {
      const newCompletedValue = currentStatus === 0 ? 1 : 0

      const { error } = await supabase.from("todo").update({ completed: newCompletedValue }).eq("id", id)

      if (error) throw error

      if (showReusableModal) {
        getReusableTodos()
      } else {
        getTodos()
      }
    } catch (error) {
      setError(error.message)
      console.error("완료 상태 토글 에러:", error.message)
    }
  }

  async function deleteTodo(id) {
    if (!confirm("정말로 삭제하시겠습니까?")) return

    try {
      const { error } = await supabase.from("todo").delete().eq("id", id)

      if (error) throw error

      if (showReusableModal) {
        getReusableTodos()
      } else {
        getTodos()
      }
      alert("할 일이 성공적으로 삭제되었습니다!")
    } catch (error) {
      setError(error.message)
      console.error("할 일 삭제 에러:", error.message)
    }
  }

  if (loading && currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>할 일을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">
            <span className="title-icon">✨</span>
            나의 할 일 목록
          </h1>
        </header>

        {!session ? (
          <div className="auth-section">
            <div className="auth-card">
              <div className="auth-icon">🚀</div>
              <h2>시작해보세요!</h2>
              <p>투두 리스트를 사용하려면 로그인 또는 회원가입이 필요합니다.</p>
              <button onClick={() => setShowLoginModal(true)} className="btn btn-primary btn-lg">
                로그인 / 회원가입
              </button>
            </div>
          </div>
        ) : (
          <div className="todo-section">
            <div className="user-info">
              <div className="user-welcome">
                <div className="user-avatar">{session.user.email.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="welcome-text">환영합니다!</p>
                  <p className="user-email">{session.user.email}</p>
                </div>
              </div>
              <button onClick={signOut} className="btn btn-outline btn-sm">
                로그아웃
              </button>
            </div>

            <div className="controls-section">
              <div className="date-control">
                <label htmlFor="date-picker">날짜 선택</label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <button onClick={() => setShowReusableModal(true)} className="btn btn-secondary">
                <span className="btn-icon">🔄</span>
                재사용 할 일 관리
              </button>
            </div>

            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="add-todo-section">
              <div className="add-todo-card">
                <div className="input-group">
                  <input
                    type="text"
                    value={newWork}
                    onChange={(e) => setNewWork(e.target.value)}
                    placeholder="새로운 할 일을 입력하세요..."
                    className="todo-input"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addTodo()
                      }
                    }}
                  />
                  <button onClick={addTodo} className="btn btn-primary">
                    <span className="btn-icon">+</span>
                    추가
                  </button>
                </div>

                <div className="checkbox-options">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={newReuse === 1}
                      onChange={(e) => {
                        setNewReuse(e.target.checked ? 1 : 0)
                        if (e.target.checked) {
                          setNewDaily(0)
                        }
                      }}
                    />
                    <span className="checkmark"></span>
                    재사용 할 일로 저장
                  </label>

                  {newReuse === 0 && (
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={newDaily === 1}
                        onChange={(e) => setNewDaily(e.target.checked ? 1 : 0)}
                      />
                      <span className="checkmark"></span>
                      매일 할 일
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="todos-section">
              <div className="section-header">
                <h2 className="section-title">
                  📅{" "}
                  {new Date(selectDate).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  할 일
                  {todos.some((todo) => todo.daily === 1 && todo.task_date !== selectDate) && (
                    <span className="daily-indicator"> (매일 할 일 포함)</span>
                  )}
                </h2>
                <div className="todo-stats">
                  완료: {todos.filter((todo) => todo.completed === 1).length} / {todos.length}
                </div>
              </div>

              {todos.length === 0 && !loading && !error ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>할 일이 없습니다</h3>
                  <p>새로운 할 일을 추가해보세요!</p>
                </div>
              ) : (
                <div className="todo-list">
                  {todos.map((todo) => (
                    <div key={todo.id} className={`todo-item ${todo.completed === 1 ? "completed" : ""}`}>
                      <label className="todo-checkbox">
                        <input
                          type="checkbox"
                          checked={todo.completed === 1}
                          onChange={() => toggleComplete(todo.id, todo.completed)}
                        />
                        <span className="checkmark"></span>
                      </label>

                      <div className="todo-content">
                        <span className="todo-text">{todo.work}</span>
                        {todo.daily === 1 && <span className="daily-badge">매일</span>}
                      </div>

                      <button onClick={() => deleteTodo(todo.id)} className="btn btn-danger btn-sm delete-btn">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showLoginModal && <LoginModal closeModal={() => setShowLoginModal(false)} />}
      {showReusableModal && (
        <ReusableTodosModal
          closeModal={() => setShowReusableModal(false)}
          reusableTodos={reusableTodos}
          addReusableTodoToCurrentDate={addReusableTodoToCurrentDate}
          deleteTodo={deleteTodo}
          selectDate={selectDate}
        />
      )}

      <style jsx global>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    color: #2d3748;
                    line-height: 1.6;
                }

                .app-container {
                    min-height: 100vh;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }

                .main-content {
                    width: 100%;
                    max-width: 800px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 24px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    overflow: hidden;
                }

                .app-header {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    padding: 40px 30px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .app-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    opacity: 0.3;
                }

                .app-title {
                    color: white;
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    position: relative;
                    z-index: 1;
                }

                .title-icon {
                    font-size: 2rem;
                    animation: sparkle 2s ease-in-out infinite;
                }

                @keyframes sparkle {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.1) rotate(5deg); }
                }

                /* 인증 섹션 */
                .auth-section {
                    padding: 60px 30px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .auth-card {
                    text-align: center;
                    background: white;
                    padding: 50px 40px;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    max-width: 400px;
                    width: 100%;
                }

                .auth-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    animation: bounce 2s ease-in-out infinite;
                }

                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }

                .auth-card h2 {
                    font-size: 1.8rem;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: #1a202c;
                }

                .auth-card p {
                    color: #718096;
                    margin-bottom: 30px;
                    font-size: 1.1rem;
                }

                /* 사용자 정보 */
                .user-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 30px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                }

                .user-welcome {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .user-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 1.2rem;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }

                .welcome-text {
                    font-weight: 600;
                    color: #1a202c;
                    margin-bottom: 2px;
                }

                .user-email {
                    color: #718096;
                    font-size: 0.9rem;
                }

                /* 컨트롤 섹션 */
                .controls-section {
                    padding: 30px;
                    display: flex;
                    gap: 20px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    background: #f8fafc;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }

                .date-control {
                    flex: 1;
                    min-width: 200px;
                }

                .date-control label {
                    display: block;
                    font-weight: 500;
                    color: #4a5568;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                }

                .date-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    background: white;
                    transition: all 0.2s ease;
                    color: #2d3748;
                }

                .date-input:focus {
                    outline: none;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }

                /* 버튼 스타일 */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    position: relative;
                    overflow: hidden;
                }

                .btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s;
                }

                .btn:hover::before {
                    left: 100%;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
                }

                .btn-secondary {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }

                .btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                }

                .btn-outline {
                    background: white;
                    color: #4a5568;
                    border: 2px solid #e2e8f0;
                }

                .btn-outline:hover {
                    background: #f7fafc;
                    border-color: #cbd5e0;
                }

                .btn-danger {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }

                .btn-danger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
                }

                .btn-sm {
                    padding: 8px 16px;
                    font-size: 0.9rem;
                }

                .btn-lg {
                    padding: 16px 32px;
                    font-size: 1.1rem;
                }

                .btn-icon {
                    font-size: 1.2rem;
                }

                /* 에러 알림 */
                .error-alert {
                    margin: 20px 30px;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border: 1px solid #fecaca;
                    border-radius: 12px;
                    color: #dc2626;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 500;
                }

                .error-icon {
                    font-size: 1.2rem;
                }

                /* 할 일 추가 섹션 */
                .add-todo-section {
                    padding: 30px;
                    background: #f8fafc;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                }

                .add-todo-card {
                    background: white;
                    padding: 25px;
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }

                .input-group {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    align-items: stretch;
                }

                .todo-input {
                    flex: 1;
                    padding: 16px 20px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    background: #f8fafc;
                    transition: all 0.2s ease;
                    color: #2d3748;
                }

                .todo-input:focus {
                    outline: none;
                    border-color: #4f46e5;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }

                .todo-input::placeholder {
                    color: #a0aec0;
                }

                .checkbox-options {
                    display: flex;
                    gap: 25px;
                    flex-wrap: wrap;
                }

                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    color: #4a5568;
                    position: relative;
                }

                .checkbox-item input[type="checkbox"] {
                    display: none;
                }

                .checkmark {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #cbd5e0;
                    border-radius: 6px;
                    position: relative;
                    transition: all 0.2s ease;
                    background: white;
                }

                .checkbox-item input[type="checkbox"]:checked + .checkmark {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    border-color: #4f46e5;
                }

                .checkbox-item input[type="checkbox"]:checked + .checkmark::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }

                /* 할 일 목록 섹션 */
                .todos-section {
                    padding: 30px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1a202c;
                    margin: 0;
                }

                .daily-indicator {
                    font-size: 0.9rem;
                    color: #718096;
                    font-weight: 400;
                }

                .todo-stats {
                    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #4338ca;
                    border: 1px solid #c7d2fe;
                }

                /* 빈 상태 */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #718096;
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    opacity: 0.7;
                }

                .empty-state h3 {
                    font-size: 1.3rem;
                    margin-bottom: 10px;
                    color: #4a5568;
                }

                .empty-state p {
                    font-size: 1rem;
                }

                /* 할 일 목록 */
                .todo-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .todo-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background: white;
                    border: 2px solid #f1f5f9;
                    border-radius: 16px;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .todo-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    transform: scaleY(0);
                    transition: transform 0.2s ease;
                }

                .todo-item:hover {
                    border-color: #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    transform: translateY(-1px);
                }

                .todo-item:hover::before {
                    transform: scaleY(1);
                }

                .todo-item.completed {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }

                .todo-item.completed::before {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    transform: scaleY(1);
                }

                .todo-checkbox {
                    position: relative;
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .todo-checkbox input[type="checkbox"] {
                    display: none;
                }

                .todo-checkbox .checkmark {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #cbd5e0;
                    border-radius: 8px;
                    background: white;
                    transition: all 0.2s ease;
                }

                .todo-checkbox input[type="checkbox"]:checked + .checkmark {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-color: #10b981;
                    transform: scale(1.1);
                }

                .todo-checkbox input[type="checkbox"]:checked + .checkmark::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                }

                .todo-content {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .todo-text {
                    font-size: 1.1rem;
                    color: #2d3748;
                    transition: all 0.2s ease;
                    word-break: break-word;
                }

                .todo-item.completed .todo-text {
                    text-decoration: line-through;
                    color: #a0aec0;
                }

                .daily-badge {
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    color: white;
                    font-size: 0.75rem;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
                }

                .delete-btn {
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    flex-shrink: 0;
                }

                .todo-item:hover .delete-btn {
                    opacity: 1;
                }

                /* 로딩 */
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    color: #4a5568;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #4f46e5;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* 모달 */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    padding: 20px;
                    animation: fadeIn 0.3s ease-out;
                }

                .auth-modal, .reusable-modal {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow: hidden;
                    position: relative;
                    animation: slideUp 0.3s ease-out;
                }

                .reusable-modal {
                    max-width: 700px;
                }

                .modal-close-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #f1f5f9;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    z-index: 10;
                    color: #64748b;
                }

                .modal-close-btn:hover {
                    background: #e2e8f0;
                    transform: rotate(90deg);
                }

                .modal-header {
                    padding: 30px 30px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1a202c;
                    margin: 0;
                }

                .modal-body {
                    padding: 30px;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .modal-body::-webkit-scrollbar {
                    width: 6px;
                }

                .modal-body::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }

                .modal-body::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 3px;
                }

                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }

                .modal-todo-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .modal-todo-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    gap: 15px;
                }

                .modal-todo-item:hover {
                    background: white;
                    border-color: #cbd5e0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .modal-todo-content {
                    flex: 1;
                }

                .modal-todo-work {
                    font-size: 1.1rem;
                    color: #2d3748;
                    word-break: break-word;
                }

                .modal-actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(50px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* 반응형 디자인 */
                @media (max-width: 768px) {
                    .app-container {
                        padding: 10px;
                    }

                    .main-content {
                        border-radius: 16px;
                    }

                    .app-header {
                        padding: 30px 20px;
                    }

                    .app-title {
                        font-size: 2rem;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .user-info {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                        padding: 20px;
                    }

                    .controls-section {
                        flex-direction: column;
                        align-items: stretch;
                        padding: 20px;
                    }

                    .date-control {
                        min-width: unset;
                    }

                    .input-group {
                        flex-direction: column;
                    }

                    .checkbox-options {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }

                    .todo-item {
                        padding: 15px;
                        flex-wrap: wrap;
                    }

                    .todo-content {
                        flex-basis: 100%;
                        margin-bottom: 10px;
                    }

                    .delete-btn {
                        opacity: 1;
                        margin-left: auto;
                    }

                    .modal-todo-item {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                    }

                    .modal-actions {
                        justify-content: flex-end;
                    }

                    .auth-modal, .reusable-modal {
                        margin: 10px;
                        max-width: calc(100% - 20px);
                    }

                    .modal-header, .modal-body {
                        padding: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .app-title {
                        font-size: 1.8rem;
                    }

                    .btn {
                        padding: 10px 16px;
                        font-size: 0.9rem;
                    }

                    .todo-input {
                        padding: 14px 16px;
                        font-size: 0.95rem;
                    }

                    .todo-text {
                        font-size: 1rem;
                    }

                    .section-title {
                        font-size: 1.3rem;
                    }
                }
            `}</style>
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
