'use client'; // 이 한 줄을 맨 위에 추가해주세요!

// app/page.js
// 이 부분은 파일을 읽어주는 역할을 하는 코드예요. 지우지 마세요!
import Image from "next/image"; // Next.js에서 이미지 쓰는 걸 도와주는 도구
import styles from "./page.module.css"; // 이 페이지의 스타일을 담고 있는 파일

// 이 부분이 실제 웹사이트에 보여질 내용을 만드는 코드예요.
export default function Home() {
  return (
    <main style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f0f0f0' }}> {/* <main> 태그 안에 스타일을 살짝 추가했어요 */}
      <h1>안녕하세요! 저의 첫 Next.js 웹사이트입니다!</h1> {/* 큰 제목 */}
      <p>여기는 제가 만든 첫 번째 페이지의 내용입니다.</p> {/* 작은 글씨 */}
      <p>새로운 걸 배우는 건 정말 즐거워요!</p>

      {/* 버튼을 하나 만들어 볼까요? */}
      <button
        onClick={() => alert('버튼이 눌렸어요! 반가워요!')}
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        여기를 눌러보세요!
      </button>

      <br /><br /> {/* 줄바꿈 두 번 */}

      {/* 이미지를 하나 넣어볼까요? */}
      {/* Image 태그는 Next.js가 이미지를 더 빠르게 보여주게 도와줘요 */}
      <Image
        src="/next.svg" // 'public' 폴더 안에 있는 next.svg 이미지를 가져와요
        alt="Next.js Logo"
        width={180} // 이미지의 가로 크기
        height={37} // 이미지의 세로 크기
        priority // 이 이미지를 먼저 불러오게 해요
      />

      <p style={{ marginTop: '20px', color: 'gray', fontSize: '14px' }}>
        이 페이지는 `app/page.js` 파일에 작성되었습니다.
      </p>
    </main>
  );
}