// app/about/page.js
'use client'; // 버튼처럼 움직이는 기능이 있다면 이 줄을 넣어주세요!

export default function AboutPage() {
  return (
    <main>
      <h1>여기는 소개 페이지입니다.</h1>
      <p>저에 대한 이야기를 들어보세요!</p>
      <button onClick={() => alert('소개 페이지 버튼 눌림!')}>버튼</button>
    </main>
  );
}