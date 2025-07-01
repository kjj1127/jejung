// 'use client'; // Next.js 사용 시 필요
import './blog.css';
import { useState, useEffect } from 'react';
// ⛔️ 따봉 기능은 DB에 컬럼이 없으므로 일단 제외했습니다.
// 💡 만약 '좋아요' 기능도 DB에 저장하고 싶다면 'blog' 테이블에 likes 같은 숫자 타입 컬럼을 추가해야 합니다.

// ⬇️ 1. supabase 클라이언트 import 하기
import { supabase } from '../supabaseClient'; // supabaseClient.js 파일 경로 확인!

function App() {
    // ⬇️ 2. state 간소화: DB에서 가져온 게시글 목록을 저장할 state
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true); // 데이터 로딩 상태
    
    // ⬇️ 3. state 간소화: 모달, 새 글 입력, 모달에 보일 글 번호
    const [modal, setModal] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [currentPostIndex, setCurrentPostIndex] = useState(0);

    // ⬇️ 4. DB에서 데이터 가져오기 (컴포넌트 로드 시 1회 실행)
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        // 'blog' 테이블에서 created_at을 기준으로 내림차순 정렬하여 데이터 가져오기
        const { data, error } = await supabase
            .from('blog')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching posts: ', error);
        } else {
            setPosts(data); // 가져온 데이터를 posts state에 저장
        }
        setLoading(false);
    };

    // ⬇️ 5. DB에 새로운 글 추가하는 함수
    const addPost = async () => {
        if (userInput.trim() === '') {
            alert('제목을 입력하세요.');
            return;
        }

        // DB에 새 글(title, content)을 추가합니다. content는 일단 비워둡니다.
        const { data, error } = await supabase
            .from('blog')
            .insert([{ title: userInput, content: '아직 내용이 없습니다.' }])
            .select(); // 삽입된 데이터를 반환받기 위해 .select() 추가

        if (error) {
            console.error('Error adding post: ', error);
        } else {
            // 화면에 즉시 반영하기 위해 기존 posts 목록의 맨 앞에 새 데이터를 추가
            setPosts([data[0], ...posts]);
            setUserInput(''); // 입력창 비우기
        }
    };
    
    // ⬇️ 6. DB에서 글 삭제하는 함수
    const deletePost = async (postId, index) => {
        // 사용자에게 삭제 여부 확인
        if (window.confirm("정말로 이 글을 삭제하시겠습니까?")) {
            const { error } = await supabase
                .from('blog')
                .delete()
                .match({ id: postId });

            if (error) {
                console.error('Error deleting post: ', error);
            } else {
                // 화면에 즉시 반영하기 위해 해당 인덱스의 게시글을 목록에서 제거
                const newPosts = [...posts];
                newPosts.splice(index, 1);
                setPosts(newPosts);
            }
        }
    };
    
    // 로딩 중일 때 표시할 화면
    if (loading) {
        return <div>로딩 중...</div>
    }

    return (
        <div className="App">
            <div className="black-nav">
                <h4>jejung blog</h4>
            </div>

            {/* ⬇️ 7. DB에서 가져온 posts 데이터로 목록 표시 */}
            {posts.map((post, i) => (
                <div className="list" key={post.id}> {/* key를 post.id로 변경 */}
                    <div className="title-area">
                        {/* 클릭 시 모달 열기 + 현재 글의 인덱스 저장 */}
                        <h4 onClick={() => { setModal(true); setCurrentPostIndex(i) }}>{post.title}</h4>
                        {/* <span>👍</span>  따봉 기능은 임시 제외 */}
                    </div>
                    {/* toLocaleDateString()를 사용해 날짜 형식 변경 */}
                    <p>{new Date(post.created_at).toLocaleDateString()} 발행</p>
                    {/* 삭제 버튼 클릭 시 deletePost 함수 호출 */}
                    <button onClick={() => deletePost(post.id, i)}>삭제</button>
                </div>
            ))}

            {/* ⬇️ 8. 글 추가 UI */}
            <input 
                type="text" 
                onChange={(e) => { setUserInput(e.target.value) }} 
                value={userInput} 
                placeholder="새 글 제목을 입력하세요"
            />
            <button onClick={addPost}>추가</button> {/* 추가 버튼 클릭 시 addPost 함수 호출 */}

            {/* ⬇️ 9. 모달창 UI: modal이 true일 때만 Modal 컴포넌트 보여주기 */}
            {modal && <Modal posts={posts} currentPostIndex={currentPostIndex} />}
        </div>
    );
}

// ⬇️ 10. Modal 컴포넌트 수정: posts 배열과 현재 인덱스를 props로 받음
function Modal(props) {
    const post = props.posts[props.currentPostIndex]; // 현재 글 정보
    
    if (!post) return null; // 혹시 모를 오류 방지

    return (
        <div className="modal">
            <h4>{post.title}</h4>
            <p>{new Date(post.created_at).toLocaleString()}</p> {/* 상세한 날짜 정보 */}
            <p>{post.content}</p> {/* DB의 content 컬럼 내용 표시 */}
        </div>
    );
}

export default App;